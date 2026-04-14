/* ============================================================
   Antitracker & Antiredirect — Blocked Page Script
   Parses blocked URL info, auto-close countdown, navigation
   ============================================================ */

'use strict';

(() => {
  // ─── Parse URL params ─────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const blockedUrl = params.get('url') || 'Unknown';
  const fromOrigin = params.get('from') || 'Unknown';

  // ─── Populate info ────────────────────────────────────────
  const blockedUrlEl = document.getElementById('blocked-url');
  const blockedFromEl = document.getElementById('blocked-from');

  blockedUrlEl.textContent = blockedUrl;
  blockedFromEl.textContent = fromOrigin;

  // Truncate for display if too long
  if (blockedUrl.length > 80) {
    blockedUrlEl.textContent = blockedUrl.substring(0, 80) + '…';
    blockedUrlEl.title = blockedUrl;
  }

  // ─── Go Back Button ───────────────────────────────────────
  const goBackBtn = document.getElementById('go-back-btn');
  goBackBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, close the tab
      browser.tabs.getCurrent().then(tab => {
        browser.tabs.remove(tab.id);
      });
    }
  });

  // ─── Close Tab Button ─────────────────────────────────────
  const closeTabBtn = document.getElementById('close-tab-btn');
  closeTabBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    browser.tabs.getCurrent().then(tab => {
      browser.tabs.remove(tab.id);
    });
  });

  // ─── Auto-revert Countdown ────────────────────────────────
  const countdownTimerEl = document.getElementById('countdown-timer');
  let secondsLeft = 5;

  const countdownInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft >= 0) {
      countdownTimerEl.textContent = secondsLeft;
    }

    if (secondsLeft < 0) {
      clearInterval(countdownInterval);
      // Go back if possible, otherwise close
      if (window.history.length > 1) {
        window.history.back();
      } else {
        browser.tabs.getCurrent().then(tab => {
          browser.tabs.remove(tab.id);
        }).catch(() => {
          window.close();
        });
      }
    }
  }, 1000);

  // Stop countdown if user is interacting
  document.addEventListener('mousemove', () => {
    if (secondsLeft <= 3) return; // Don't restart if almost done
    // User is active, pause countdown is handled by buttons above
  });
})();
