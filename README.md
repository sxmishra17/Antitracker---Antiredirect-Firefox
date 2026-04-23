# Antitracker & Antiredirect — Firefox Extension

> All-in-one browsing protection: block trackers and redirects for a clean, private browsing experience.

---

## Features

- 🛡️ **Tracker Blocking** — Blocks hundreds of known ad and tracking domains at the network layer using `webRequest` blocking before requests are made
- 🔗 **Redirect Blocking** — Detects and stops cross-origin navigations, new-tab redirects, and `window.open()` popups
- 🧹 **Tracking Parameter Stripping** — Automatically removes tracking query parameters (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.) from URLs
- 📊 **Block History** — Visualizes daily blocking data as a stacked bar chart with configurable retention
- 🔴 **Live Badge Counter** — Shows real-time count of blocked items on the extension icon
- 🎨 **Premium Dark UI** — Glassmorphism popup with animated counters and smooth transitions

---

## Installation

### From Firefox Add-ons (AMO)
Search **"Antitracker & Antiredirect"** on [addons.mozilla.org](https://addons.mozilla.org)

### Developer Install
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from this folder

---

## Project Structure

```
├── manifest.json       # MV2 manifest — permissions, background scripts
├── background.js       # Background script — redirect logic, state, badge management
├── content.js          # Content script — DOM scanning, link cleanup, toast UI
├── filters.js          # Domain lists (AD_DOMAINS, TRACKING_DOMAINS, TRACKING_PARAMS)
├── popup.html/js/css   # Extension popup UI
├── blocked.html/js/css # Redirect-blocked warning page
└── icons/              # Extension icons (16, 32, 48, 96, 128px)
```

---

## Privacy

**No data leaves your device.** This extension:
- ✅ Makes **zero external network requests**
- ✅ Stores data **locally only** using `browser.storage.local`
- ✅ Does **not collect** any user data
- ✅ Does **not transmit** browsing history anywhere

---

## Developer

**YuvaTech**

---

## License

All Rights Reserved.
