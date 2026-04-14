/* ============================================================
   Antitracker & Antiredirect — Filter Lists
   Curated ad/tracking domain lists, cosmetic selectors, and
   tracking parameters for comprehensive ad + tracker blocking.
   ============================================================ */

'use strict';

// ─── Ad & Tracking Domains (Network-Level Blocking) ─────────
// Requests to these domains are cancelled before they load.
// Curated from EasyList/EasyPrivacy top domains.
const AD_DOMAINS = new Set([
  // Google Ads
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'adservice.google.com',
  'adservice.google.co.uk',
  'adservice.google.de',
  'adservice.google.fr',
  'adservice.google.ca',
  'adservice.google.com.au',
  'afs.googlesyndication.com',
  'partner.googleadservices.com',
  'tpc.googlesyndication.com',
  'www.googleadservices.com',
  'fundingchoicesmessages.google.com',
  'id.google.com',

  // DoubleClick
  'ad.doubleclick.net',
  'ad-g.doubleclick.net',
  'cm.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  's0.2mdn.net',
  'stats.g.doubleclick.net',

  // Facebook / Meta
  'pixel.facebook.com',
  'an.facebook.com',

  // Amazon Ads
  'aax.amazon-adsystem.com',
  'c.amazon-adsystem.com',
  'z-na.amazon-adsystem.com',
  's.amazon-adsystem.com',
  'fls-na.amazon-adsystem.com',
  'aax-us-east.amazon-adsystem.com',
  'aax-us-iad.amazon-adsystem.com',
  'rcm-na.amazon-adsystem.com',
  'ir-na.amazon-adsystem.com',
  'wms-na.amazon-adsystem.com',
  'unagi.amazon.com',
  'adtago.s3.amazonaws.com',

  // Microsoft/Bing Ads
  'ads.microsoft.com',
  'bat.bing.com',
  'c.bing.com',
  'a.ads.microsoft.com',

  // Twitter/X Ads
  'ads-api.twitter.com',
  'ads.twitter.com',
  'analytics.twitter.com',

  // Popular Ad Networks
  'ad.turn.com',
  'ads.yahoo.com',
  'ads.pubmatic.com',
  'gads.pubmatic.com',
  'hbopenbid.pubmatic.com',
  'image8.pubmatic.com',
  'ads.rubiconproject.com',
  'fastlane.rubiconproject.com',
  'optimized-by.rubiconproject.com',
  'prebid-server.rubiconproject.com',
  'ads.openx.net',
  'ox-d.openx.net',
  'u.openx.net',
  'rtb.openx.net',
  'bidder.criteo.com',
  'cas.criteo.com',
  'dis.criteo.com',
  'gum.criteo.com',
  'static.criteo.net',
  'ssp.criteo.com',
  'ads.taboola.com',
  'trc.taboola.com',
  'api.taboola.com',
  'cdn.taboola.com',
  'nr-data.taboola.com',
  'vidstat.taboola.com',
  'ads.outbrain.com',
  'amplify.outbrain.com',
  'log.outbrain.com',
  'widgets.outbrain.com',
  'odb.outbrain.com',
  'adnxs.com',
  'ib.adnxs.com',
  'prebid.adnxs.com',
  'secure.adnxs.com',
  'mediation.adnxs.com',
  'ad.smartadserver.com',
  'ww251.smartadserver.com',
  'cdn.smartadserver.com',
  'in.smartadserver.com',
  'ads.stickyadstv.com',
  'cdn.stickyadstv.com',
  'ad.71i.de',
  'ads.betweendigital.com',
  'native.sharethrough.com',
  'btloader.com',
  'confiant-integrations.global.ssl.fastly.net',
  'cdn.confiant-integrations.net',

  // Programmatic / Exchange
  'sync.outbrain.com',
  'e.crashlytics.com',
  'match.adsrvr.org',
  'insight.adsrvr.org',
  'cdn.adsafeprotected.com',
  'pixel.adsafeprotected.com',
  'fw.adsafeprotected.com',
  'static.adsafeprotected.com',
  'c.amazon-adsystem.com',
  'acdn.adnxs.com',
  'hb.adscale.de',

  // Ad Verification / Viewability
  'c.evidon.com',
  'l.betrad.com',
  'b.scorecardresearch.com',
  'sb.scorecardresearch.com',
  'securepubads.g.doubleclick.net',
  'pixel.moatads.com',
  'z.moatads.com',
  'js.moatads.com',
  'geo.moatads.com',
  'mb.moatads.com',
  'px.moatads.com',
  'v4.moatads.com',
  'ad.mrtnsvr.com',

  // Popups / Overlays
  'cdn.popcash.net',
  'o.ss2.us',
  'go.bebi.com',
  'ad.propellerads.com',
  'cdn.propellerads.com',
  'serve.popads.net',
  'c1.popads.net',
  'go.oclasrv.com',
  'go.onclasrv.com',
  'cdn.syndication.twimg.com',

  // Video Ads
  'imasdk.googleapis.com',
  'vid.springserve.com',
  'ads.adaptv.advertising.com',
  'redir.adap.tv',
  'ads.stickyadstv.com',
  'vast.adsafeprotected.com',

  // Mobile Ad SDKs (web versions)
  'app.appsflyer.com',
  'cdn.appsflyer.com',
  'launches.appsflyer.com',
  'e.deployads.com',
  'cdn.branch.io',

  // Miscellaneous / Test Domains
  'pagead2.googleadservices.com',
  'analyticsengine.s3.amazonaws.com',
  'analytics.s3.amazonaws.com',
  'advice-ads.s3.amazonaws.com',
  'log.pinterest.com',
  'trk.pinterest.com',
  'ads.pinterest.com',
  'events.redditmedia.com',
  'events.reddit.com',
  'ads.youtube.com',
  'log.byteoversea.com',
  'analytics.tiktok.com',
  'ads.tiktok.com',
  'business-api.tiktok.com',
  'ads-sg.tiktok.com',
  'ads-api.tiktok.com',
  'analytics-sg.tiktok.com',
  'auction.unityads.unity3d.com',
  'config.unityads.unity3d.com',
  'adserver.unityads.unity3d.com',
  'webview.unityads.unity3d.com',
  'geo.yahoo.com',
  'udcm.yahoo.com',
  'analytics.query.yahoo.com',
  'log.fc.yahoo.com',
  'partnerads.ysm.yahoo.com',
  'appmetrica.yandex.ru',
  'adfstat.yandex.ru',
  'metrika.yandex.ru',
  
  // OEMs / Hardware Trackers
  'iot-eu-logser.realme.com',
  'iot-logser.realme.com',
  'bdapi-in-ads.realmemobile.com',
  'api.ad.xiaomi.com',
  'sdkconfig.ad.intl.xiaomi.com',
  'sdkconfig.ad.xiaomi.com',
  'tracking.rus.miui.com',
  'data.mistat.india.xiaomi.com',
  'data.mistat.rus.xiaomi.com',
  'data.ads.oppomobile.com',
  'adsfs.oppomobile.com',
  'adx.ads.oppomobile.com',
  'metrics2.data.hicloud.com',
  'logbak.hicloud.com',
  'logservice.hicloud.com',
  'grs.hicloud.com',
  'metrics.data.hicloud.com',
  'logservice1.hicloud.com',
  'smetrics.samsung.com',
  'analytics-api.samsunghealthcn.com',
  'samsungads.com',
  'samsung-com.112.2o7.net',
  'iadsdk.apple.com',
  'books-analytics-events.apple.com',
  'api-adservices.apple.com',
  'metrics.mzstatic.com',
  'weather-analytics-events.apple.com',
  'notes-analytics-events.apple.com',
  'metrics.icloud.com',

  // Miscellaneous Ads (Batch 3)
  'bingads.microsoft.com',
  'aan.amazon.com',
  'dai.google.com',

  // Miscellaneous Ads (Batch 2)
  'gemini.yahoo.com', 'analytics.yahoo.com',
  'adfox.yandex.ru',
  'bdapi-ads.realmemobile.com',
  'data.mistat.xiaomi.com',
  'ck.ads.oppomobile.com',

  // Generic ad servers
  'ads.servebom.com',
  'adsrv.eacdn.com',
  'cdn.adpushup.com',
  'media.net',
  'static.media.net',
  'contextual.media.net',
  'adservetx.media.net',
]);

// ─── Tracking Domains (Network-Level Blocking) ──────────────
const TRACKING_DOMAINS = new Set([
  // Google Analytics / Tag Manager
  'www.google-analytics.com',
  'ssl.google-analytics.com',
  'google-analytics.com',
  'analytics.google.com',
  'www.googletagmanager.com',
  'googletagservices.com',
  'pagead2.googlesyndication.com',
  'stats.wp.com',

  // Facebook Tracking
  'pixel.facebook.com',
  'connect.facebook.net',
  'graph.facebook.com',

  // Analytics Providers
  'cdn.segment.com',
  'api.segment.io',
  'cdn.mxpnl.com',
  'api-js.mixpanel.com',
  'decide.mixpanel.com',
  'heapanalytics.com',
  'cdn.heapanalytics.com',
  'js.hs-analytics.net',
  'track.hubspot.com',
  'js.hsadspixel.net',
  'js.hscollectedforms.net',
  'js.hs-banner.com',
  'js.usemessages.com',
  'snap.licdn.com',
  'px.ads.linkedin.com',
  'dc.ads.linkedin.com',

  // Additional Trackers
  'click.googleanalytics.com',
  'fwtracks.freshmarketer.com',
  'freshmarketer.com',
  'claritybt.freshmarketer.com',
  'realtime.luckyorange.com',

  // Hotjar / Session Recording
  'static.hotjar.com',
  'script.hotjar.com',
  'vars.hotjar.com',
  'in.hotjar.com',

  // FullStory
  'fullstory.com',
  'rs.fullstory.com',
  'edge.fullstory.com',

  // Amplitude
  'api.amplitude.com',
  'cdn.amplitude.com',
  'api2.amplitude.com',

  // Sentry / Error Tracking
  'app.getsentry.com',

  // General Tracking
  'ct.pinterest.com',
  'pixel.quantserve.com',
  'secure.quantserve.com',
  'rules.quantcount.com',
  'pixel.wp.com',
  'stats.wp.com',
  'tr.snapchat.com',
  'sc-static.net',
  'ping.chartbeat.net',
  'static.chartbeat.com',
  'pnimg.net',
  'bat.bing.com',
  'c.clarity.ms',
  'www.clarity.ms',
  't.clarity.ms',
  'a.clarity.ms',
  'd.clarity.ms',
  's.yimg.com',
  'sp.analytics.yahoo.com',
  'consent.yahoo.com',
  'ups.analytics.yahoo.com',
  'cmp.quantcast.com',

  // Fingerprinting / Device identification
  'fpcdn.pipedream.com',
  'api.fpjs.io',
  'fpnpmcdn.net',
  'openfpcdn.io',
  'tlsfingerprint.io',
  'ampcid.google.com',

  // Data brokers / Audience tracking
  'idsync.rlcdn.com',
  'x.bidswitch.net',
  'dsum-sec.casalemedia.com',
  'dpm.demdex.net',
  'fast.a.bidintg.io',
  'id5-sync.com',
  'cms.quantserve.com',
  'token.rubiconproject.com',
  'eus.rubiconproject.com',
  'sync.search.spotxchange.com',
  'delivery.vidible.tv',
  'ad.turn.com',
  'rtd-tm.everesttech.net',
  'assets.adobedtm.com',
  'dpm.demdex.net',

  // Social widgets with tracking
  'platform.twitter.com',
  'badges.instagram.com',
  'platform.linkedin.com',

  // Miscellaneous Trackers (Batch 8 - Edge Cases)
  'ad.spotify.com', 'ads-static.spotify.com', 'ads-tracking.spotify.com', 'ads-video.spotify.com', 'adeventtracker.spotify.com',
  'c.admob.com', 's.admob.com', 'media.admob.com', 'r.admob.com', 'v.admob.com', 'admob.biz', 'admob.co.kr', 'admob.co.nz', 'admob.co.uk', 'admob.co.za', 'admob.de', 'admob.dk', 'admob.es', 'admob.fi', 'admob.fr', 'pagead.googlesyndication.com',

  // Miscellaneous Trackers (Batch 7 - Missing Networks)
  'ads.spotify.com', 'audio-ads.spotify.com', 'spclient.wg.spotify.com',
  'tritondigital.com', 'yieldop.com',
  'revcontent.com', 'trends.revcontent.com', 'cdn.revcontent.com',
  'mgid.com', 'jsc.mgid.com', 'servicer.mgid.com',
  'applovin.com', 'a.applovin.com', 'rtb.applovin.com', 'msi.applovin.com',
  'admob.com', 'e.admob.com',
  'inmobi.com', 'config.inmobi.com', 'w.inmobi.com',
  'mintegral.com', 'mintegral.net', 'rayjump.com',
  'lotame.com', 'crwdcntrl.net', 'bcp.crwdcntrl.net', 'tags.crwdcntrl.net',

  // Miscellaneous Trackers (Batch 6)
  'liftoff.io',
  'as.casalemedia.com',
  'pixel.adsafeprotected.com',
  'static.adsafeprotected.com',
  'fw.adsafeprotected.com',
  'mineralt.io',
  'crypto-loot.org',
  'greatis.com',
  'sc-analytics.appspot.com',
  'px.srvcs.tumblr.com',
  'xp.apple.com',
  'open.oneplus.net',
  'www.awin1.com',
  'zenaps.com',
  'partnerstack.com',
  'www.anrdoezrs.net',
  'www.tkqlhce.com',
  'widget.intercom.io',
  'g.jwpsrv.com',
  'metrics.brightcove.com',

  // Miscellaneous Trackers (Batch 5)
  'api.fyber.com',
  'ironsource.mobi',
  'googletagmanager.com',
  'tagmanager.google.com',
  'fpjs.io',
  'siftscience.com',
  'app.adjust.com',
  'kochava.com',
  'device-metrics-us.amazon.com',
  'device-metrics-us-2.amazon.com',
  'mads-eu.amazon.com',
  'settings-win.data.microsoft.com',
  'vortex.data.microsoft.com',
  'vortex-win.data.microsoft.com',
  'watson.telemetry.microsoft.com',
  'us.info.lgsmartad.com',
  'ads.roku.com',
  'app-measurement.com',
  'consentcdn.cookiebot.com',
  'cookiebot.com',
  'consent.trustarc.com',
  'cdn.cookielaw.org',
  'cdn.privacy-mgmt.com',
  'logx.optimizely.com',
  'cdn.dynamicyield.com',
  'tremorhub.com',
  'ads.tremorhub.com',

  // Miscellaneous Trackers (Batch 4)
  'fingerprintjs.com',
  'cdn.siftscience.com',
  'analytics.adobe.io',
  'wzrkt.com',
  'clevertap-prod.com',
  'bnc.lt',
  'control.kochava.com',

  // Miscellaneous Trackers (Batch 3)
  'geolocation.onetrust.com',
  'consent.cookiebot.com',
  'app.usercentrics.eu',
  'www.dpbolvw.net',
  'shareasale-analytics.com',
  'impact.com',
  'api.impact.com',
  'api.partnerstack.com',
  'ssl.p.jwpcdn.com',
  'adsafeprotected.com',

  // Miscellaneous Trackers (Batch 2)
  'identify.hotjar.com', 'adm.hotjar.com', 'insights.hotjar.com', 'surveys.hotjar.com', 'careers.hotjar.com',
  'cdn.mouseflow.com', 'cdn-test.mouseflow.com', 'mouseflow.com', 'tools.mouseflow.com',
  'api.luckyorange.com', 'cdn.luckyorange.com', 'w1.luckyorange.com', 'upload.luckyorange.net', 'cs.luckyorange.net', 'settings.luckyorange.net', 'luckyorange.com',
  'notify.bugsnag.com', 'sessions.bugsnag.com', 'api.bugsnag.com', 'app.bugsnag.com',
  'browser.sentry-cdn.com',
  'analytics.pointdrive.linkedin.com',
  'ads.linkedin.com',
]);

// ─── Cosmetic Selectors (DOM-Level Ad Hiding) ───────────────
// These CSS selectors match common ad containers/wrappers.
const COSMETIC_SELECTORS = [
  // Google Ads
  'ins.adsbygoogle',
  '[id^="google_ads"]',
  '[id^="div-gpt-ad"]',
  '[data-google-query-id]',
  '.google-auto-placed',
  'div[id^="gpt_unit_"]',

  // Generic ad patterns
  '.ad-banner', '#ad-banner',
  '.ad-container', '#ad-container',
  '.ad-wrapper', '#ad-wrapper',
  '.ad-slot', '#ad-slot',
  '.ad-unit', '#ad-unit',
  '.ad-block',
  '.ad-placement',
  '.ad-holder',
  '.ad-frame',
  '.ad-leaderboard',
  '.ad-skyscraper',
  '.ad-rectangle',
  '.ad-sidebar',
  '.ad_banner', '#ad_banner',
  '.ad_container', '#ad_container',
  '.ad_wrapper', '#ad_wrapper',
  '.ad_slot', '#ad_slot',
  '.sidebar-ad', '#sidebar-ad',
  '.sidebarAd', '#sidebarAd',
  '.banner-ad', '#banner-ad',
  '.bannerAd', '#bannerAd',
  '[data-ad-slot]',
  '[data-ad-client]',
  '[data-ad-manager]',
  '[data-adunit]',
  '[data-ad-unit]',
  '[aria-label="Ads"]',
  '[aria-label="Advertisement"]',
  '[aria-label="advertisement"]',

  // Common ad class names
  '.ad', '.ads', '.adbox', '.adsbox', '.ad-box', '.ad-placeholder',
  '#ad', '#ads', '#adbox', '#ad-box',
  '.test-ad', '#test-ad',
  '.adBanner', '#adBanner',
  '.textad', '.text-ad',
  '.pub_300x250', '.pub_728x90', '.pub_300x250m', '.pub_728x90m',
  '[class^="pub_"]', '[id^="pub_"]',
  '[class*="AdBanner"]', '[id*="AdBanner"]',
  '.adsbygoogle',
  '.ad-banner',
  '.adbanner',
  '.ad_banner',
  '.advert',
  '.advertisement',
  '.sponsored-content',
  '.sponsored_content',
  '.native-ad',
  '.promoted-content',
  '.promoted_content',
  '.dfp-ad',
  '.ad-insertion',
  '.ad-text',

  // Taboola / Outbrain
  '.trc_rbox',
  '.trc_related_container',
  '#taboola-below-article',
  '#taboola-mid-article',
  '#taboola-right-rail',
  '[id^="taboola-"]',
  '.OUTBRAIN',
  '[data-widget-id*="outbrain"]',
  '.ob-widget',
  '.ob-smartfeed-wrapper',

  // Common sticky/floating ads
  '[class*="sticky-ad"]',
  '[class*="stickyAd"]',
  '[id*="sticky-ad"]',
  '[class*="floating-ad"]',
  '[id*="floating-ad"]',
  '[class*="adhesion"]',
  '.ad-footer-sticky',
  '.ad-bottom-sticky',

  // Popup / Overlay ads
  '.interstitial', '#interstitial',
  '.overlay-ad', '#overlay-ad',

  // YouTube-specific ad elements
  '.ytp-ad-module',
  '.ytp-ad-overlay-container',
  '.ytp-ad-overlay-slot',
  '.ytp-ad-image-overlay',
  '.ytp-ad-text-overlay',
  '.video-ads',
  '.ytd-promoted-sparkles-web-renderer',
  '.ytd-display-ad-renderer',
  '.ytd-companion-slot-renderer',
  '.ytd-action-companion-ad-renderer',
  '.ytd-in-feed-ad-layout-renderer',
  '.ytd-banner-promo-renderer',
  '.ytd-statement-banner-renderer',
  '.ytd-ad-slot-renderer',
  '#player-ads',
  '#masthead-ad',
  'ytd-promoted-video-renderer',
  'ytd-display-ad-renderer',
  'ytd-ad-slot-renderer',
  '.ad-showing .ytp-ad-skip-button-container',

  // Cookie consent / GDPR banners (these are tracking-related)
  // Note: Not blocking these as they serve a legal purpose
];

// ─── Tracking Element Selectors (DOM Removal) ───────────────
// Elements matching these selectors are removed from the DOM.
const TRACKING_SELECTORS = [
  // Tracking pixels (1x1 images)
  'img[width="1"][height="1"]',
  'img[width="0"][height="0"]',
  'img[style*="display:none"]',
  'img[style*="display: none"]',
  'img[style*="visibility:hidden"]',
  'img[style*="visibility: hidden"]',

  // Common tracking iframes
  'iframe[width="0"]',
  'iframe[height="0"]',
  'iframe[style*="display:none"]',
  'iframe[style*="display: none"]',
  'iframe[style*="width:0"]',
  'iframe[style*="height:0"]',
  'iframe[src*="facebook.com/tr"]',
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="googlesyndication"]',

  // Tracking scripts by src pattern
  'script[src*="google-analytics.com"]',
  'script[src*="googletagmanager.com"]',
  'script[src*="googlesyndication.com"]',
  'script[src*="googleadservices.com"]',
  'script[src*="facebook.net/en_US/fbevents"]',
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
  'script[src*="taboola.com"]',
  'script[src*="outbrain.com"]',
  'script[src*="moatads.com"]',
  'script[src*="adsafeprotected.com"]',
  'script[src*="bat.bing.com"]',
  'script[src*="snap.licdn.com"]',
  'script[src*="sc-static.net"]',
  'script[src*="ads.linkedin.com"]',
  'script[src*="platform.twitter.com/oct.js"]',
  'script[src*="static.ads-twitter.com"]',

  // Noscript tracking
  'noscript > img[src*="facebook"]',
  'noscript > img[src*="analytics"]',
  'noscript > img[src*="doubleclick"]',
  'noscript > img[src*="pixel"]',
];

// ─── Tracking URL Parameters (Stripped from URLs) ───────────
const TRACKING_PARAMS = [
  // Google
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',

  // Facebook / Meta
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
  'fb_beacon_info', 'action_object_map', 'action_type_map', 'action_ref_map',

  // Microsoft
  'msclkid',

  // HubSpot
  'hsa_acc', 'hsa_cam', 'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_la',
  'hsa_ol', 'hsa_net', 'hsa_ver', 'hsa_kw', 'hsa_mt', 'hsa_tgt',
  '__hssc', '__hstc', '__hsfp', 'hsCtaTracking', '_hsenc', '_hsmi',

  // Mailchimp
  'mc_cid', 'mc_eid',

  // Adobe
  'ef_id', 's_cid', 's_kwcid',

  // General
  'igshid',
  'si',  // Spotify
  'ref', // Various
  'ref_src', 'ref_url',
  'yclid', // Yandex
  '_openstat', // Openstat
  'wickedid', // Wicked Reports
  'twclid', // Twitter
  'ttclid', // TikTok
  'li_fat_id', // LinkedIn
  'spm', // Alibaba
  'scm', // Alibaba
  'vero_id', // Vero
  'mkt_tok', // Marketo
  '_bta_tid', '_bta_c', // Bronto
  'trk_contact', 'trk_msg', 'trk_module', 'trk_sid', // Listrak
  'mc_tc', // MailChimp
  'ml_subscriber', 'ml_subscriber_hash', // MailerLite
  'oly_anon_id', 'oly_enc_id', // Omeda Olytics
  'rb_clickid', // Unknown
  's_cid', // Adobe Site Catalyst
  'elqTrackId', 'elqTrack', // Eloqua
  'assetType', 'assetId', 'recipientId', 'messageId', // Responsys
  'vgo_ee', // Act-On
  'dt_dapp', // Dataxu
  'epik', // Pinterest
  'pp', // Pepperjam
];
