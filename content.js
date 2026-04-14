/* ============================================================
   Antitracker & Antiredirect — Content Script
   Tracking element removal, link tracking cleanup,
   cross-origin link neutralization, and window.open blocking.
   ============================================================ */

'use strict';

(() => {
  // Prevent double-injection
  if (window.__redirectShieldActive) return;
  window.__redirectShieldActive = true;

  const pageOrigin = window.location.origin;
  const pageHostname = window.location.hostname;

  // ─── Helper: Get base domain ────────────────────────────
  function getBaseDomain(hostname) {
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  }

  // ─── Helper: Is same site? ──────────────────────────────
  function isSameSite(url) {
    try {
      const parsedUrl = new URL(url, window.location.href);
      if (parsedUrl.origin === pageOrigin) return true;
      return getBaseDomain(pageHostname) === getBaseDomain(parsedUrl.hostname);
    } catch { return true; }
  }

  // ─── Ask background for tracker block state ─────────────
  let trackerBlockActive = true; // Assume active; updated async
  browser.runtime.sendMessage({ type: 'getTrackerBlockState' }).then(resp => {
    if (resp) trackerBlockActive = resp.trackerBlockEnabled;
  }).catch(() => {});

  // ─── Listen for messages from background ───────────────
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'showRedirectBlockedToast') {
      showBlockedToast(message.url);
    }
  });

  // ─── Listen for state toggles globally (all iframes) ────
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.redirectBlockEnabled !== undefined) {
      const enabled = changes.redirectBlockEnabled.newValue;
      redirectBlockActive = enabled;
      if (document.documentElement) {
        document.documentElement.dataset.rsRedirectBlockActive = enabled ? 'true' : 'false';
      }
      if (enabled && document.documentElement) injectPageGuard();
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TRACKING PROTECTION — Element & Link Cleaning
  // ═══════════════════════════════════════════════════════════

  // ─── Remove tracking elements from DOM ──────────────────
  const TRACKING_ELEMENT_SELECTORS = [
    // Tracking pixels
    'img[width="1"][height="1"]',
    'img[width="0"][height="0"]',
    'img[style*="display:none"]',
    'img[style*="display: none"]',
    'img[style*="visibility:hidden"]',

    // Hidden iframes (tracking beacons)
    'iframe[width="0"]', 'iframe[height="0"]',
    'iframe[style*="display:none"]', 'iframe[style*="display: none"]',
    'iframe[style*="width:0"]', 'iframe[style*="height:0"]',
    'iframe[src*="facebook.com/tr"]',
    'iframe[src*="doubleclick.net"]',

    // Tracking scripts
    'script[src*="google-analytics.com"]',
    'script[src*="googletagmanager.com"]',
    'script[src*="connect.facebook.net"]',
    'script[src*="hotjar.com"]',
    'script[src*="fullstory.com"]',
    'script[src*="clarity.ms"]',
    'script[src*="amplitude.com"]',
    'script[src*="segment.com"]',
    'script[src*="mixpanel.com"]',
    'script[src*="heapanalytics.com"]',
    'script[src*="quantserve.com"]',
    'script[src*="scorecardresearch.com"]',
    'script[src*="chartbeat.com"]',
    'script[src*="chartbeat.net"]',
    'script[src*="moatads.com"]',
    'script[src*="bat.bing.com"]',
    'script[src*="snap.licdn.com"]',
    'script[src*="ads.linkedin.com"]',
  ];

  function removeTrackingElements() {
    if (!trackerBlockActive) return 0;
    let removed = 0;
    const allSelectors = TRACKING_ELEMENT_SELECTORS.join(', ');
    try {
      const elements = document.querySelectorAll(allSelectors);
      elements.forEach(el => {
        if (el.dataset.redirectShieldRemoved) return;
        el.dataset.redirectShieldRemoved = 'true';
        el.remove();
        removed++;
      });
    } catch (e) { /* ignore selector errors */ }
    return removed;
  }

  // ─── Strip tracking from link hrefs ─────────────────────
  const TRACKING_LINK_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'gclid', 'gclsrc', 'dclid', 'fbclid', 'msclkid',
    'mc_cid', 'mc_eid', 'igshid', 'twclid', 'ttclid', 'li_fat_id',
    'epik', 'gbraid', 'wbraid',
  ];

  function cleanLinkTracking(link) {
    if (!trackerBlockActive) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    try {
      const url = new URL(href, window.location.href);
      let changed = false;
      for (const param of TRACKING_LINK_PARAMS) {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          changed = true;
        }
      }
      if (changed) link.setAttribute('href', url.toString());
    } catch { /* invalid URL */ }

    // Remove ping tracking attribute
    if (link.hasAttribute('ping')) {
      link.removeAttribute('ping');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // REDIRECT BLOCKING — Link Neutralization
  // (Only active when redirectBlockActive === true)
  // ═══════════════════════════════════════════════════════════

  // ─── Ask background for redirect block state ────────────
  let redirectBlockActive = false; // Default OFF; updated async
  browser.runtime.sendMessage({ type: 'getRedirectBlockState' }).then(resp => {
    if (resp) redirectBlockActive = resp.redirectBlockEnabled;
  }).catch(() => {});

  // ─── Inject page-context overrides ──────────────────────
  function injectPageGuard() {
    // Flag the document so injected script knows state
    if (document.documentElement) {
      document.documentElement.dataset.rsRedirectBlockActive = redirectBlockActive ? 'true' : 'false';
    }
    const pageScript = document.createElement('script');
    pageScript.textContent = `
      (function() {
        if (window.__redirectShieldPageGuard) return;
        window.__redirectShieldPageGuard = true;

        const __rs_pageOrigin = window.location.origin;
        const __rs_pageHost = window.location.hostname;
        const __rs_origOpen = window.open;
        const __rs_origClick = HTMLAnchorElement.prototype.click;
        const __rs_origDispatchEvent = EventTarget.prototype.dispatchEvent;

        function __rs_getBase(h) {
          var p = h.split('.'); return p.length >= 2 ? p.slice(-2).join('.') : h;
        }
        function __rs_sameSite(url) {
          try {
            var u = new URL(url, window.location.href);
            if (u.origin === __rs_pageOrigin) return true;
            return __rs_getBase(__rs_pageHost) === __rs_getBase(u.hostname);
          } catch(e) { return true; }
        }

        window.open = function(url, target, features) {
          if (document.documentElement.dataset.rsRedirectBlockActive === 'true' && url && !__rs_sameSite(url)) {
            console.log('[Antitracker & Antiredirect] Blocked window.open to: ' + url);
            return null;
          }
          return __rs_origOpen.call(this, url, target, features);
        };

        HTMLAnchorElement.prototype.click = function() {
          var href = this.href || this.getAttribute('href');
          if (document.documentElement.dataset.rsRedirectBlockActive === 'true' && href && !__rs_sameSite(href)) {
            console.log('[Antitracker & Antiredirect] Blocked anchor click to: ' + href);
            return;
          }
          return __rs_origClick.call(this);
        };

        EventTarget.prototype.dispatchEvent = function(event) {
          if (event && event.type === 'click' && this instanceof HTMLAnchorElement) {
            var href = this.href || this.getAttribute('href');
            if (document.documentElement.dataset.rsRedirectBlockActive === 'true' && href && !__rs_sameSite(href)) return false;
          }
          return __rs_origDispatchEvent.call(this, event);
        };
      })();
    `;
    const root = document.head || document.documentElement;
    if (root) { root.appendChild(pageScript); pageScript.remove(); }
  }

  // Inject ASAP — but only if redirect blocking is on
  browser.runtime.sendMessage({ type: 'getRedirectBlockState' }).then(resp => {
    if (resp && resp.redirectBlockEnabled) {
      redirectBlockActive = true;
      if (document.documentElement) {
        document.documentElement.dataset.rsRedirectBlockActive = 'true';
        injectPageGuard();
      } else {
        const earlyObserver = new MutationObserver(() => {
          if (document.documentElement) {
            earlyObserver.disconnect();
            document.documentElement.dataset.rsRedirectBlockActive = 'true';
            injectPageGuard();
          }
        });
        earlyObserver.observe(document, { childList: true });
      }
    }
  }).catch(() => {});

  // ─── Toast Notification for Blocked Redirects ───────────
  function showBlockedToast(blockedUrl) {
    const existing = document.getElementById('ps-redirect-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ps-redirect-toast';

    toast.innerHTML = 
      '<img class="toast-icon" alt="" style="width:22px;height:22px;border-radius:4px;flex-shrink:0;">' +
      '<div style="display:flex;flex-direction:column;gap:1px;">' +
        '<span style="font-weight:600;font-size:13px;color:#F0F0F5;">Redirect Blocked</span>' +
        '<span class="url-span" style="font-size:10px;color:#8B8BA3;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>' +
      '</div>' +
      '<button id="ps-toast-close" style="background:none;border:none;color:#8B8BA3;font-size:16px;cursor:pointer;padding:0 0 0 8px;line-height:1;">✕</button>';

    // Safely assign the dynamic values to prevent XSS and static analyzer warnings
    const urlSpan = toast.querySelector('.url-span');
    urlSpan.textContent = blockedUrl ? blockedUrl.substring(0, 60) : 'Cross-site redirect prevented';
    
    const toastIcon = toast.querySelector('.toast-icon');
    toastIcon.src = browser.runtime.getURL('icons/icon-32.png');

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%) translateY(100px)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      background: 'linear-gradient(135deg, rgba(15, 15, 26, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%)',
      border: '1px solid rgba(0, 217, 255, 0.25)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 217, 255, 0.1)',
      zIndex: '2147483647',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
      opacity: '0',
      backdropFilter: 'blur(12px)',
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });

    const closeBtn = toast.querySelector('#ps-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dismissToast(toast));
    }

    setTimeout(() => dismissToast(toast), 3000);
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
  }

  // ─── Click event interception ───────────────────────────
  document.addEventListener('click', (event) => {
    if (!redirectBlockActive) return;
    const link = event.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      const originalHref = link.getAttribute('data-original-href') || href;
      if (!originalHref || originalHref === '#' || originalHref.startsWith('javascript:') ||
          originalHref.startsWith('mailto:') || originalHref.startsWith('tel:')) return;

      if (!isSameSite(originalHref)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        showBlockedToast(originalHref);
        browser.runtime.sendMessage({ type: 'reportBlocked', count: 1, blockType: 'redirects' }).catch(() => {});
        return false;
      }
    }
  }, true);

  // ─── Form submission interception ───────────────────────
  document.addEventListener('submit', (event) => {
    if (!redirectBlockActive) return;
    const form = event.target;
    if (form.tagName !== 'FORM') return;
    const action = form.getAttribute('action');
    if (action && !isSameSite(action)) {
      event.preventDefault();
      event.stopPropagation();
      showBlockedToast(action);
      browser.runtime.sendMessage({ type: 'reportBlocked', count: 1, blockType: 'redirects' }).catch(() => {});
    }
  }, true);

  // ═══════════════════════════════════════════════════════════
  // DOM SCANNING — Remove tracking elements, clean links
  // ═══════════════════════════════════════════════════════════

  function scanDocument() {
    let trackersRemoved = removeTrackingElements();

    document.querySelectorAll('a[href]').forEach(link => {
      if (!link.dataset.redirectShieldCleaned) {
        link.dataset.redirectShieldCleaned = 'true';
        cleanLinkTracking(link);
      }
    });

    if (trackersRemoved > 0) {
      browser.runtime.sendMessage({
        type: 'reportBlocked', count: trackersRemoved, blockType: 'trackers'
      }).catch(() => {});
    }
  }

  // ─── MutationObserver ───────────────────────────────────
  const observer = new MutationObserver(mutations => {
    let trackersRemoved = 0;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the added node is a tracking element
        if (trackerBlockActive) {
          for (const sel of TRACKING_ELEMENT_SELECTORS) {
            try {
              if (node.matches && node.matches(sel)) {
                node.remove();
                trackersRemoved++;
                break;
              }
            } catch { /* ignore */ }
          }

          // Check children for tracking elements
          try {
            const allSel = TRACKING_ELEMENT_SELECTORS.join(', ');
            const trackingEls = node.querySelectorAll?.(allSel);
            if (trackingEls) {
              trackingEls.forEach(el => { el.remove(); trackersRemoved++; });
            }
          } catch { /* ignore */ }
        }

        // Clean new links
        if (node.tagName === 'A' && node.hasAttribute('href')) {
          if (!node.dataset.redirectShieldCleaned) {
            node.dataset.redirectShieldCleaned = 'true';
            cleanLinkTracking(node);
          }
        }

        const newLinks = node.querySelectorAll?.('a[href]:not([data-redirect-shield-cleaned])');
        if (newLinks) {
          newLinks.forEach(link => {
            link.dataset.redirectShieldCleaned = 'true';
            cleanLinkTracking(link);
          });
        }
      }
    }

    if (trackersRemoved > 0) {
      browser.runtime.sendMessage({
        type: 'reportBlocked', count: trackersRemoved, blockType: 'trackers'
      }).catch(() => {});
    }
  });

  // Start observing
  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // ─── Initialize ────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanDocument();
      startObserver();
    });
  } else {
    scanDocument();
    startObserver();
  }
})();
