/* ============================================================
   Antitracker & Antiredirect — Background Script
   Core engine: redirect blocking, tracker blocking, state
   management, webRequest blocking, history, and messaging.
   ============================================================ */

'use strict';

// ─── State ──────────────────────────────────────────────────
let redirectBlockEnabled = false;  // Global redirect blocking
let trackerBlockEnabled = true;    // Global tracker blocking
const DEFAULT_RETENTION_DAYS = 14;

// Per-tab counters
const tabData = new Map(); // tabId → { redirectsBlocked, trackersBlocked, origin }
const tabOrigins = new Map(); // tabId → origin string
const childTabs = new Map(); // childTabId → parentTabId
const pendingNewTabs = new Set(); // tabIds marked for closure

// ─── Initialization ─────────────────────────────────────────
// Unconditionally load from storage to ensure state is never lost
// if the background script reloads or suspends.
browser.storage.local.get(['redirectBlockEnabled', 'trackerBlockEnabled', 'historyRetentionDays']).then(data => {
  if (data.redirectBlockEnabled !== undefined) redirectBlockEnabled = data.redirectBlockEnabled;
  if (data.trackerBlockEnabled !== undefined) trackerBlockEnabled = data.trackerBlockEnabled;
  pruneHistory();
});

browser.runtime.onInstalled.addListener(() => {
  // Future migration or install-time logic can go here
});

// ─── Helper: Get today's date key ───────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Helper: Get origin from URL ────────────────────────────
function getOrigin(url) {
  try { return new URL(url).origin; } catch { return null; }
}

// ─── Helper: Get hostname from URL ──────────────────────────
function getHostname(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

// ─── Helper: Is same site? ──────────────────────────────────
function isSameSite(url1, url2) {
  try {
    const host1 = new URL(url1).hostname;
    const host2 = new URL(url2).hostname;
    const base1 = host1.split('.').slice(-2).join('.');
    const base2 = host2.split('.').slice(-2).join('.');
    return base1 === base2;
  } catch { return false; }
}

// ─── Helper: Is extension URL? ──────────────────────────────
function isExtensionUrl(url) {
  try { return url.startsWith('moz-extension://') || url.startsWith('about:'); }
  catch { return false; }
}



function isTrackingDomain(hostname) {
  if (TRACKING_DOMAINS.has(hostname)) return true;
  const parts = hostname.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    if (TRACKING_DOMAINS.has(parts.slice(i).join('.'))) return true;
  }
  return false;
}

// ─── Helper: Strip tracking params from URL ─────────────────
function stripTrackingParams(url) {
  try {
    const parsed = new URL(url);
    let changed = false;
    for (const param of TRACKING_PARAMS) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.delete(param);
        changed = true;
      }
    }
    return changed ? parsed.toString() : null;
  } catch { return null; }
}

// ─── Tab Data Management ────────────────────────────────────
function getTabData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, { redirectsBlocked: 0, trackersBlocked: 0, origin: null });
  }
  return tabData.get(tabId);
}

// ─── History Management ─────────────────────────────────────
async function recordBlock(type, count = 1) {
  const key = todayKey();
  const data = await browser.storage.local.get(['history']);
  const history = data.history || {};
  if (!history[key]) history[key] = { redirects: 0, trackers: 0 };
  if (typeof history[key] === 'number') {
    // Migration from old format
    history[key] = { redirects: history[key], trackers: 0 };
  }
  history[key][type] = (history[key][type] || 0) + count;
  await browser.storage.local.set({ history });
}

async function pruneHistory() {
  const data = await browser.storage.local.get(['history', 'historyRetentionDays']);
  const retentionDays = data.historyRetentionDays || DEFAULT_RETENTION_DAYS;
  const history = data.history || {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  let changed = false;
  for (const dateKey of Object.keys(history)) {
    if (dateKey < cutoffStr) { delete history[dateKey]; changed = true; }
  }
  if (changed) await browser.storage.local.set({ history });
}

setInterval(pruneHistory, 24 * 60 * 60 * 1000);

// ─── Badge Management ───────────────────────────────────────
function updateBadge(tabId) {
  const td = tabData.get(tabId);
  const total = td ? td.redirectsBlocked + td.trackersBlocked : 0;
  if (total > 0) {
    const text = total > 999 ? '999+' : total.toString();
    browser.browserAction.setBadgeText({ text, tabId });
    browser.browserAction.setBadgeBackgroundColor({ color: '#FF4757', tabId });
  } else if (redirectBlockEnabled || trackerBlockEnabled) {
    browser.browserAction.setBadgeText({ text: '✓', tabId });
    browser.browserAction.setBadgeBackgroundColor({ color: '#00D9FF', tabId });
  } else {
    browser.browserAction.setBadgeText({ text: '', tabId });
  }
}

// ─── Content Script Injection ───────────────────────────────
function injectContentScript(tabId) {
  browser.tabs.executeScript(tabId, {
    file: 'content.js',
    runAt: 'document_start',
    allFrames: true
  }).catch(() => {});
}

// ─── Close Tab/Window Helper ────────────────────────────────
function closeTabOrWindow(tabId) {
  browser.tabs.remove(tabId).catch(() => {});
  // Safety: clear pendingNewTabs after 10s to prevent indefinite accumulation
  setTimeout(() => pendingNewTabs.delete(tabId), 10000);
  browser.tabs.get(tabId).then(tab => {
    if (!tab || !tab.windowId) return;
    browser.windows.get(tab.windowId, { populate: true }).then(win => {
      if (win.type === 'popup' || (win.tabs && win.tabs.length <= 1)) {
        browser.windows.remove(win.id).catch(() => {});
      }
    }).catch(() => {});
  }).catch(() => {});
}

// ─── Send Toast Notification to Tab ─────────────────────────
function notifyRedirectBlocked(tabId, blockedUrl) {
  browser.tabs.sendMessage(tabId, {
    type: 'showRedirectBlockedToast',
    url: blockedUrl
  }).catch(() => {});
}

// ─── WebRequest: Main Handler ───────────────────────────────
function handleBeforeRequest(details) {
  const tabId = details.tabId;
  if (tabId === -1) return {};
  if (isExtensionUrl(details.url)) return {};
  if (pendingNewTabs.has(tabId)) return { cancel: true };

  const hostname = getHostname(details.url);
  const td = getTabData(tabId);

  // ── Tracker Blocking ──────────────────────────────────────
  if (trackerBlockEnabled && (details.type !== 'main_frame')) {
    if (isTrackingDomain(hostname)) {
      td.trackersBlocked++;
      updateBadge(tabId);
      recordBlock('trackers', 1);
      return { cancel: true };
    }
  }

  // ── Tracking Parameter Stripping ──────────────────────────
  if (trackerBlockEnabled && details.type === 'main_frame') {
    const cleanedUrl = stripTrackingParams(details.url);
    if (cleanedUrl && cleanedUrl !== details.url) {
      return { redirectUrl: cleanedUrl };
    }
  }

  // ── Redirect Blocking ────────────────────────────────────
  if (!redirectBlockEnabled) return {};

  // Detect user-typed navigations (no originUrl = address bar)
  const originUrl = details.originUrl || '';
  const documentUrl = details.documentUrl || '';

  if (details.type === 'main_frame' && !originUrl && !documentUrl) {
    const newOrigin = getOrigin(details.url);
    if (newOrigin) {
      tabOrigins.set(tabId, newOrigin);
      td.origin = newOrigin;
    }
    return {};
  }

  // Detect child tabs (opened from protected pages)
  let isNewChildTab = false;
  let parentTabId = null;
  let parentOriginForChild = null;

  const trackedParentId = childTabs.get(tabId);
  if (trackedParentId != null) {
    const ptd = tabData.get(trackedParentId);
    if (ptd && ptd.origin) {
      isNewChildTab = true;
      parentTabId = trackedParentId;
      parentOriginForChild = ptd.origin;
    }
  }

  if (!isNewChildTab && originUrl && !isExtensionUrl(originUrl) && details.type === 'main_frame') {
    if (!tabOrigins.has(tabId)) {
      for (const [tid, tdd] of tabData) {
        if (tdd.origin && isSameSite(tdd.origin, originUrl)) {
          isNewChildTab = true;
          parentTabId = tid;
          parentOriginForChild = tdd.origin;
          break;
        }
      }
    }
  }

  const tabOrigin = td.origin || tabOrigins.get(tabId);
  if (!tabOrigin && !isNewChildTab) return {};
  const effectiveOrigin = tabOrigin || parentOriginForChild;
  if (!effectiveOrigin || isExtensionUrl(effectiveOrigin)) return {};

  // Block cross-origin main frame navigations
  if (details.type === 'main_frame') {
    if (!isSameSite(effectiveOrigin, details.url)) {
      // New tab from protected page → close it
      if (isNewChildTab && parentOriginForChild && !isSameSite(parentOriginForChild, details.url)) {
        const ptd = getTabData(parentTabId);
        ptd.redirectsBlocked++;
        updateBadge(parentTabId);
        recordBlock('redirects', 1);
        notifyRedirectBlocked(parentTabId, details.url);
        pendingNewTabs.add(tabId);
        closeTabOrWindow(tabId);
        childTabs.delete(tabId);
        return { cancel: true };
      }

      // Same-tab cross-origin redirect → show blocked page
      if (tabOrigin) {
        td.redirectsBlocked++;
        updateBadge(tabId);
        recordBlock('redirects', 1);
        const fromOrigin = originUrl ? getOrigin(originUrl) : tabOrigin;
        const blockedUrl = browser.runtime.getURL(
          `blocked.html?url=${encodeURIComponent(details.url)}&from=${encodeURIComponent(fromOrigin)}`
        );
        return { redirectUrl: blockedUrl };
      }
    }
  }

  // Block cross-origin sub-frame navigations
  if (details.type === 'sub_frame') {
    if (effectiveOrigin && !isSameSite(effectiveOrigin, details.url)) {
      td.redirectsBlocked++;
      updateBadge(tabId);
      recordBlock('redirects', 1);
      notifyRedirectBlocked(tabId, details.url);
      return { cancel: true };
    }
  }

  return {};
}

// Register webRequest listener
browser.webRequest.onBeforeRequest.addListener(
  handleBeforeRequest,
  { urls: ['<all_urls>'] },
  ['blocking']
);

// ─── Track Tab Origins ──────────────────────────────────────
try {
  browser.webNavigation.onCommitted.addListener(details => {
    if (details.frameId === 0) {
      const url = details.url;
      const transitionType = details.transitionType;

      if (transitionType === 'typed' || transitionType === 'auto_bookmark' ||
          transitionType === 'keyword' || transitionType === 'generated') {
        if (!isExtensionUrl(url)) {
          const origin = getOrigin(url);
          tabOrigins.set(details.tabId, origin);
          const td = getTabData(details.tabId);
          td.origin = origin;
        }
        return;
      }

      if (!isExtensionUrl(url)) {
        const origin = getOrigin(url);
        tabOrigins.set(details.tabId, origin);
        const td = getTabData(details.tabId);
        td.origin = origin;
      }
    }
  });
} catch (e) {
  console.warn('Antitracker & Antiredirect: webNavigation API not available:', e.message);
}

// ─── Tab Lifecycle ──────────────────────────────────────────
browser.tabs.onRemoved.addListener(tabId => {
  tabData.delete(tabId);
  tabOrigins.delete(tabId);
  childTabs.delete(tabId);
  pendingNewTabs.delete(tabId);

  // Clean orphaned childTabs entries that reference this tab as parent
  for (const [childId, parentId] of childTabs) {
    if (parentId === tabId) childTabs.delete(childId);
  }
});

// Detect new tabs from protected pages
try {
  browser.webNavigation.onCreatedNavigationTarget.addListener(details => {
    if (!redirectBlockEnabled) return;

    const sourceTabId = details.sourceTabId;
    const newTabId = details.tabId;
    const url = details.url;

    const ptd = tabData.get(sourceTabId);
    const parentOrigin = ptd && ptd.origin;
    const effectiveOrigin = parentOrigin || tabOrigins.get(sourceTabId);
    if (!effectiveOrigin) {
      childTabs.set(newTabId, sourceTabId);
      return;
    }

    if (url && !isExtensionUrl(url) && url !== 'about:blank' && !isSameSite(effectiveOrigin, url)) {
      if (ptd) ptd.redirectsBlocked++;
      updateBadge(sourceTabId);
      recordBlock('redirects', 1);
      notifyRedirectBlocked(sourceTabId, url);
      pendingNewTabs.add(newTabId);
      closeTabOrWindow(newTabId);
      return;
    }

    childTabs.set(newTabId, sourceTabId);

    if (!url || url === 'about:blank') {
      const capturedOrigin = effectiveOrigin;
      setTimeout(() => {
        if (pendingNewTabs.has(newTabId)) return;
        browser.tabs.get(newTabId).then(tab => {
          if (!tab || !tab.url) return;
          if (tab.url === 'about:blank' || (!isExtensionUrl(tab.url) && !isSameSite(capturedOrigin, tab.url))) {
            if (ptd) ptd.redirectsBlocked++;
            updateBadge(sourceTabId);
            recordBlock('redirects', 1);
            notifyRedirectBlocked(sourceTabId, tab.url);
            pendingNewTabs.add(newTabId);
            closeTabOrWindow(newTabId);
            childTabs.delete(newTabId);
          }
        }).catch(() => {});
      }, 500);
    }
  });
} catch (e) {
  console.warn('Antitracker & Antiredirect: onCreatedNavigationTarget not available:', e.message);
}

browser.tabs.onCreated.addListener(tab => {
  if (!redirectBlockEnabled) return;
  if (pendingNewTabs.has(tab.id)) return;

  if (tab.openerTabId != null) {
    const ptd = tabData.get(tab.openerTabId);
    const parentOrigin = ptd && ptd.origin;

    if (tab.url && parentOrigin && !isExtensionUrl(tab.url) && tab.url !== 'about:blank') {
      if (!isSameSite(parentOrigin, tab.url)) {
        if (ptd) ptd.redirectsBlocked++;
        updateBadge(tab.openerTabId);
        recordBlock('redirects', 1);
        pendingNewTabs.add(tab.id);
        closeTabOrWindow(tab.id);
        return;
      }
    }
    if (!childTabs.has(tab.id)) {
      childTabs.set(tab.id, tab.openerTabId);
    }
  }
});

// Catch popup windows
try {
  browser.windows.onCreated.addListener(win => {
    if (!redirectBlockEnabled) return;
    if (win.type === 'popup' || win.type === 'normal') {
      browser.tabs.query({ windowId: win.id }).then(tabs => {
        for (const tab of tabs) {
          const openerTabId = tab.openerTabId;
          const trackedParent = openerTabId != null ? openerTabId : childTabs.get(tab.id);
          if (trackedParent != null) {
            const ptd = tabData.get(trackedParent);
            const parentOrigin = ptd && ptd.origin;
            if (parentOrigin) {
              const tabUrl = tab.url || '';
              if (tabUrl === 'about:blank' || (tabUrl && !isExtensionUrl(tabUrl) && !isSameSite(parentOrigin, tabUrl))) {
                if (ptd) ptd.redirectsBlocked++;
                updateBadge(trackedParent);
                recordBlock('redirects', 1);
                pendingNewTabs.add(tab.id);
                browser.windows.remove(win.id).catch(() => {
                  browser.tabs.remove(tab.id).catch(() => {});
                });
                return;
              }
            }
          }
        }
      });
    }
  });
} catch (e) {
  console.warn('Antitracker & Antiredirect: windows API not available:', e.message);
}

// Handle tab updates — catch child tabs and inject content script
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (pendingNewTabs.has(tabId)) return;

  const url = changeInfo.url || tab.url;

  // Catch child tabs navigating cross-origin
  if (redirectBlockEnabled && url && !isExtensionUrl(url) && url !== 'about:blank') {
    const parentId = childTabs.get(tabId);
    if (parentId != null) {
      const ptd = tabData.get(parentId);
      if (ptd && ptd.origin && !isSameSite(ptd.origin, url)) {
        ptd.redirectsBlocked++;
        updateBadge(parentId);
        recordBlock('redirects', 1);
        notifyRedirectBlocked(parentId, url);
        pendingNewTabs.add(tabId);
        closeTabOrWindow(tabId);
        childTabs.delete(tabId);
        return;
      }
      if (changeInfo.status === 'complete') childTabs.delete(tabId);
    }
  }

  // Update origin and inject content script
  if (changeInfo.status === 'complete' && tab.url && !isExtensionUrl(tab.url)) {
    const origin = getOrigin(tab.url);
    tabOrigins.set(tabId, origin);
    const td = getTabData(tabId);
    td.origin = origin;
    injectContentScript(tabId);
  }
});

// ─── Message Handler ────────────────────────────────────────
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'toggleRedirectBlock': {
      redirectBlockEnabled = !redirectBlockEnabled;
      browser.storage.local.set({ redirectBlockEnabled });
      sendResponse({ redirectBlockEnabled });
      break;
    }

    case 'toggleTrackerBlock': {
      trackerBlockEnabled = !trackerBlockEnabled;
      browser.storage.local.set({ trackerBlockEnabled });
      // Re-inject content scripts when toggling trackers
      if (trackerBlockEnabled) {
        browser.tabs.query({}).then(tabs => {
          tabs.forEach(t => {
            if (t.url && !isExtensionUrl(t.url)) {
              injectContentScript(t.id);
            }
          });
        });
      }
      sendResponse({ trackerBlockEnabled });
      break;
    }

    case 'getState': {
      const tabId = message.tabId;
      const td = tabData.get(tabId);
      browser.storage.local.get(['history', 'historyRetentionDays']).then(data => {
        sendResponse({
          redirectBlockEnabled,
          trackerBlockEnabled,
          redirectsBlocked: td ? td.redirectsBlocked : 0,
          trackersBlocked: td ? td.trackersBlocked : 0,
          history: data.history || {},
          retentionDays: data.historyRetentionDays || DEFAULT_RETENTION_DAYS
        });
      });
      return true;
    }

    case 'setRetentionDays': {
      const days = message.days;
      browser.storage.local.set({ historyRetentionDays: days }).then(() => {
        pruneHistory();
        sendResponse({ retentionDays: days });
      });
      return true;
    }

    case 'reportBlocked': {
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      if (tabId != null) {
        const td = getTabData(tabId);
        const type = message.blockType || 'trackers';
        if (type === 'trackers') {
          td.trackersBlocked += message.count || 1;
        } else {
          td.redirectsBlocked += message.count || 1;
        }
        updateBadge(tabId);
        recordBlock(type, message.count || 1);
      }
      break;
    }

    case 'getTrackerBlockState': {
      sendResponse({ trackerBlockEnabled });
      break;
    }

    case 'getRedirectBlockState': {
      sendResponse({ redirectBlockEnabled });
      break;
    }

    case 'getHistory': {
      browser.storage.local.get(['history', 'historyRetentionDays']).then(data => {
        sendResponse({
          history: data.history || {},
          retentionDays: data.historyRetentionDays || DEFAULT_RETENTION_DAYS
        });
      });
      return true;
    }
  }
});

// ─── Memory Leak Prevention ────────────────────────────────
browser.tabs.onRemoved.addListener(tabId => {
  tabData.delete(tabId);
  tabOrigins.delete(tabId);
  childTabs.delete(tabId);
  pendingNewTabs.delete(tabId);
});
