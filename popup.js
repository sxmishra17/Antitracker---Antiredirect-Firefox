/* ============================================================
   Antitracker & Antiredirect — Popup Script
   Handles UI state, toggles, counters, history chart, and
   messaging with the background script.
   ============================================================ */

'use strict';

// ─── Elements ───────────────────────────────────────────────
const redirectToggle = document.getElementById('redirect-toggle');
const adblockToggle = document.getElementById('adblock-toggle');
const redirectStatusText = document.getElementById('redirect-status-text');
const adblockStatusText = document.getElementById('adblock-status-text');
const redirectBlockedCount = document.getElementById('redirect-blocked-count');
const adsBlockedCount = document.getElementById('ads-blocked-count'); // We'll keep the ID since it maps to HTML but label is trackers
const totalBlockedCount = document.getElementById('total-blocked-count');
const retentionSelect = document.getElementById('retention-select');
const historyChart = document.getElementById('history-chart');

let currentTabId = null;
let historyData = {};

// ─── Initialize ─────────────────────────────────────────────
async function init() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) currentTabId = tabs[0].id;

  try {
    const state = await browser.runtime.sendMessage({
      type: 'getState',
      tabId: currentTabId
    });

    // Update toggles
    redirectToggle.checked = state.redirectBlockEnabled;
    adblockToggle.checked = state.trackerBlockEnabled;
    updateStatusTexts(state.redirectBlockEnabled, state.trackerBlockEnabled);

    // Update counters
    animateCounter(redirectBlockedCount, state.redirectsBlocked);
    animateCounter(adsBlockedCount, state.trackersBlocked);

    // Retention
    retentionSelect.value = state.retentionDays.toString();

    // History
    historyData = state.history;
    renderChart(historyData, state.retentionDays);

    // Total from history
    let totalRedirects = 0;
    let totalTrackers = 0;
    for (const val of Object.values(historyData)) {
      if (typeof val === 'object') {
        totalRedirects += val.redirects || 0;
        totalTrackers += val.trackers || 0;
      } else {
        totalRedirects += val; // Legacy format
      }
    }
    animateCounter(totalBlockedCount, totalRedirects + totalTrackers);
  } catch (err) {
    console.error('Antitracker & Antiredirect: Failed to get state:', err);
  }
}

// ─── Status Text Updates ────────────────────────────────────
function updateStatusTexts(redirectEnabled, trackerBlockEnabled) {
  redirectStatusText.textContent = redirectEnabled ? 'Active — blocking redirects' : 'Inactive';
  redirectStatusText.className = redirectEnabled ? 'toggle-status active' : 'toggle-status';

  adblockStatusText.textContent = trackerBlockEnabled ? 'Active — blocking trackers' : 'Inactive';
  adblockStatusText.className = trackerBlockEnabled ? 'toggle-status active' : 'toggle-status';
}

// ─── Counter Animation ─────────────────────────────────────
function animateCounter(element, targetValue) {
  const duration = 600;
  const startTime = performance.now();
  const startValue = parseInt(element.textContent) || 0;

  element.classList.add('animate');

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (targetValue - startValue) * eased);
    element.textContent = currentValue.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  if (targetValue !== startValue) {
    requestAnimationFrame(update);
  } else {
    element.textContent = targetValue.toLocaleString();
  }
}

// ─── Toggle Handlers ────────────────────────────────────────
redirectToggle.addEventListener('change', async () => {
  try {
    const response = await browser.runtime.sendMessage({ type: 'toggleRedirectBlock' });
    updateStatusTexts(response.redirectBlockEnabled, adblockToggle.checked);
  } catch (err) {
    console.error('Antitracker & Antiredirect: Toggle redirect failed:', err);
  }
});

adblockToggle.addEventListener('change', async () => {
  try {
    const response = await browser.runtime.sendMessage({ type: 'toggleTrackerBlock' });
    updateStatusTexts(redirectToggle.checked, response.trackerBlockEnabled);
  } catch (err) {
    console.error('Antitracker & Antiredirect: Toggle tracker blocker failed:', err);
  }
});

// ─── Retention Dropdown ─────────────────────────────────────
retentionSelect.addEventListener('change', async () => {
  const days = parseInt(retentionSelect.value);
  try {
    await browser.runtime.sendMessage({ type: 'setRetentionDays', days });
    renderChart(historyData, days);
  } catch (err) {
    console.error('Antitracker & Antiredirect: Set retention failed:', err);
  }
});

// ─── History Chart ──────────────────────────────────────────
function renderChart(history, retentionDays) {
  const canvas = historyChart;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  // Generate data
  const dates = [];
  const redirectValues = [];
  const trackerValues = [];
  const today = new Date();

  for (let i = retentionDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dates.push(key);

    const dayData = history[key];
    if (typeof dayData === 'object') {
      redirectValues.push(dayData.redirects || 0);
      trackerValues.push(dayData.trackers || 0);
    } else {
      redirectValues.push(dayData || 0);
      trackerValues.push(0);
    }
  }

  const combinedValues = dates.map((_, i) => redirectValues[i] + trackerValues[i]);
  const maxVal = Math.max(...combinedValues, 1);
  const barCount = dates.length;

  const padding = { top: 18, right: 8, bottom: 22, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const gap = Math.max(1, Math.min(3, chartWidth / barCount * 0.15));
  const barWidth = Math.max(2, (chartWidth - gap * (barCount - 1)) / barCount);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartHeight / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Draw stacked bars
  combinedValues.forEach((total, i) => {
    const x = padding.left + i * (barWidth + gap);
    const totalHeight = (total / maxVal) * chartHeight;
    const redirectHeight = (redirectValues[i] / maxVal) * chartHeight;
    const trackerHeight = (trackerValues[i] / maxVal) * chartHeight;

    const baseY = padding.top + chartHeight;
    const radius = Math.min(barWidth / 2, 3);

    // Tracker portion (bottom, amber)
    if (trackerValues[i] > 0) {
      const h = Math.max(trackerHeight, 2);
      const y = baseY - h - Math.max(redirectHeight, redirectValues[i] > 0 ? 2 : 0);
      const gradient = ctx.createLinearGradient(x, y, x, baseY);
      gradient.addColorStop(0, 'rgba(255, 165, 2, 0.85)');
      gradient.addColorStop(1, 'rgba(255, 120, 0, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, baseY - h - Math.max(redirectHeight, redirectValues[i] > 0 ? 2 : 0),
        barWidth, h);
    }

    // Redirect portion (top, teal)
    if (redirectValues[i] > 0) {
      const h = Math.max(redirectHeight, 2);
      const gradient = ctx.createLinearGradient(x, baseY - h, x, baseY);
      gradient.addColorStop(0, 'rgba(0, 217, 255, 0.85)');
      gradient.addColorStop(1, 'rgba(124, 58, 237, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, baseY - h, barWidth, h);
    }

    // Empty bar
    if (total === 0) {
      ctx.fillStyle = 'rgba(90, 90, 114, 0.2)';
      ctx.fillRect(x, baseY - 2, barWidth, 2);
    }

    // Glow
    if (total > 0) {
      ctx.shadowColor = 'rgba(0, 217, 255, 0.2)';
      ctx.shadowBlur = 4;
      ctx.fillRect(x, baseY - Math.max(totalHeight, 2), barWidth, Math.max(totalHeight, 2));
      ctx.shadowBlur = 0;
    }
  });

  // Date labels
  ctx.fillStyle = 'rgba(139, 139, 163, 0.7)';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';

  let labelFreq;
  if (retentionDays <= 1) labelFreq = 1;
  else if (retentionDays <= 7) labelFreq = 1;
  else if (retentionDays <= 14) labelFreq = 2;
  else labelFreq = 5;

  dates.forEach((dateStr, i) => {
    if (i % labelFreq === 0 || i === dates.length - 1) {
      const x = padding.left + i * (barWidth + gap) + barWidth / 2;
      const y = height - 4;
      ctx.fillText(dateStr.slice(5), x, y);
    }
  });

  // Legend
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'left';

  // Redirect legend dot
  ctx.fillStyle = 'rgba(0, 217, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(padding.left + 2, padding.top - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(139, 139, 163, 0.7)';
  ctx.fillText('Redirects', padding.left + 8, padding.top - 4);

  // Tracker legend dot
  const legendX = padding.left + 62;
  ctx.fillStyle = 'rgba(255, 165, 2, 0.85)';
  ctx.beginPath();
  ctx.arc(legendX, padding.top - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(139, 139, 163, 0.7)';
  ctx.fillText('Trackers', legendX + 6, padding.top - 4);
}

// ─── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
