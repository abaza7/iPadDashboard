# iPad Dashboard

**Version:** v19.0 (`2026-10-21.v19.0`)  
**Platform:** A lightweight, static, touch-friendly dashboard designed for an older iPad (including iPad Air 2 / iPadOS 15 Safari), with a companion phone remote.  
**Deployment model:** HTTPS static hosting; no required application server, framework, Node runtime, or database on the deployed host.

> This README documents the functionality present in the **v19.0 source package**. It distinguishes implemented features from external services and planned ideas. Browser/iPadOS 15 integration tests have **not** been fully verified. Do not assume a feature can bypass iOS background, autoplay, or volume restrictions.

## Contents

1. [Overview](#overview)
2. [Dashboard features](#dashboard-features)
3. [Quran player](#quran-player)
4. [Lofi and internet radio](#lofi-and-internet-radio)
5. [Prayer times and adhan](#prayer-times-and-adhan)
6. [Themes, night display, and burn-in protection](#themes-night-display-and-burn-in-protection)
7. [Phone remote control](#phone-remote-control)
8. [ntfy notifications and Raspberry Pi](#ntfy-notifications-and-raspberry-pi)
9. [Settings, backups, and local data](#settings-backups-and-local-data)
10. [Deployment and upgrades](#deployment-and-upgrades)
11. [Configuration reference](#configuration-reference)
12. [Offline behavior, refresh, and updates](#offline-behavior-refresh-and-updates)
13. [Project architecture](#project-architecture)
14. [Development, build, and testing](#development-build-and-testing)
15. [Security and privacy](#security-and-privacy)
16. [Troubleshooting](#troubleshooting)
17. [Known limitations and future opportunities](#known-limitations-and-future-opportunities)

## Overview

The iPad Dashboard is an always-visible home information and media interface. Its primary screen combines a large clock, calendar/Hijri date, current weather and five-day outlook, prayer times, optional financial indicators, and easy access to Quran recitation and internet radio. It can show adhan alerts, switch to a dim or black nighttime screen, display ntfy notifications from external systems, and accept authenticated commands from a companion `remote.html` page on a phone.

### What you get

- Single-page main dashboard at `index.html`; companion remote at `remote.html`.
- Large local-time clock with optional seconds and 12-hour format; Gregorian and Hijri date.
- Weather: conditions, apparent temperature, humidity, wind, and five-day forecast.
- Prayer schedule with next-prayer indication and configurable adhan playback.
- Optional currency exchange-rate and derived gold-per-gram display.
- Quran Arabic text bundled locally; multiple reciters and verse-navigation controls.
- Lofi/ambient/internet radio with presets, custom HTTPS stations, and SomaFM fallback servers.
- Shared audio coordination: Quran/radio interrupted by adhan and resumed when applicable.
- Night screen, auto day/night theme, optional gentle position drift.
- ntfy-powered notification banners and remotely signed control commands.
- Local preference persistence, settings export/import, diagnostics, and service-worker caching.

### Not included

This version does **not** implement a live Raspberry Pi metrics dashboard, Docker/Jellyfin health panels, Reolink camera feeds, Home Assistant controls, arbitrary draggable widgets, or calendar synchronization. Raspberry Pi *messages* can be received via ntfy if configured. These broader integrations were discussed as future work, not shipped in v19.0.

## Dashboard features

### Clock and dates

- Displays device-local current time and Gregorian date.
- `h12=1` enables a 12-hour clock; `secs=0` hides seconds.
- Hijri date is displayed alongside the regular date.
- An optional subtle shifting/drift effect reduces prolonged static positioning.

**Timezone note:** Browser time and actual audio scheduling depend on the iPad's system clock/timezone. The `tz` URL parameter is also used by prayer-time configuration; verify both match the intended location.

### Weather

- Current temperature and conditions, with a weather icon.
- Feels-like temperature, humidity, and wind speed.
- Forecast cards for five days with high/low temperatures.
- Celsius by default; Fahrenheit with `units=f`.
- Weather data comes from the Open-Meteo forecast API; connectivity is required to refresh data. A previously cached response may still display during an outage.

### Currency and gold

- Optional exchange-rate chip (`fx=1`; on by default).
- Defaults to **USD → EGP**, adjustable with `from` and `to`.
- Optional gold price per gram (`gold=1`; on by default), dependent on exchange-rate data.
- Values are informational/reference data; they are **not** guaranteed bank transaction, retail gold, or live buy/sell quotes.
- Both chips can be hidden with URL flags; source reachability and refresh depend on external providers.

### Status information

The dashboard shows the last update or a short retry/unavailable message. The **Settings → System health** section provides a more detailed view of the current version, session age, network indicator, audio-readiness status, freshness of background jobs, and recent locally recorded diagnostic events.

## Quran player

Open it via the **book/Quran button** on the main screen or use the companion remote.

### Features

- Arabic Quran text supplied by the bundled `quran-data.js` asset (no text API needed after caching).
- Surah selection and Arabic/English search and navigation in the player.
- Reciter selection; default reciters are centrally listed in `js/core/catalog.js`.
- Verse-by-verse recitation and previous/next verse controls for compatible reciters.
- Support for a whole-surah Islam Sobhi audio source with local verse-timing files under `timings/islam-sobhi/`.
- Player display with surah/reciter information, progress, and a compact mini-player.
- Play, Pause, and **Stop** are distinct:
  - **Pause** pauses and retains the player/mini-player.
  - **Stop** stops playback and closes the Quran mini-player.
- Sleep-timer functionality, including a 30-minute remote shortcut.
- Coordinates with adhan playback: it can pause for an alert and resume afterwards when allowed.

### Reciters included

1. Mishary Alafasy
2. Abdul Basit (Murattal)
3. Mahmoud Khalil Al-Husary
4. Mohamed Al-Minshawi (Murattal)
5. Abdurrahman As-Sudais
6. Saud Ash-Shuraim
7. Maher Al-Muaiqly
8. Saad Al-Ghamdi
9. Ahmed Al-Ajamy
10. Islam Sobhi (whole-surah source / bundled verse timings)

Audio is streamed from external hosts, including EveryAyah and the Islam Sobhi source. Bundled Quran *text* is not the same thing as bundled recitation audio. **Internet is normally required for new playback**, and externally hosted media is not guaranteed to be available offline.

## Lofi and internet radio

Open via the radio button on the main dashboard or on the phone remote.

### Player functionality

- Play, Pause, Stop, station selection, and mini-player status.
- Internet MP3/audio streams: a working connection and a playable URL are required.
- Add custom stations by supplying a name and an **HTTPS** stream URL.
- Sleep timers, including 30, 60, and 90 minutes from the remote.
- Adhan-aware interruption and restoration as supported by the player.
- On supported SomaFM presets, tries a configured alternative server when the primary stream fails.
- Companion remote now-playing information and unified controls.

### Built-in stations (v19.0)

| Station | Primary stream | Alternate |
|---|---|---|
| Chillhop · Flux FM | `https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/` | — |
| Groove Salad · SomaFM | `https://ice5.somafm.com/groovesalad-128-mp3` | `https://ice6.somafm.com/groovesalad-128-mp3` |
| Fluid · SomaFM | `https://ice5.somafm.com/fluid-128-mp3` | `https://ice2.somafm.com/fluid-128-mp3` |
| Lush · SomaFM | `https://ice5.somafm.com/lush-128-mp3` | `https://ice6.somafm.com/lush-128-mp3` |
| Drone Zone · SomaFM | `https://ice5.somafm.com/dronezone-128-mp3` | `https://ice2.somafm.com/dronezone-128-mp3` |
| Code Radio | `https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3` | — |
| Radio Paradise Mellow | `https://stream.radioparadise.com/mellow-128` | — |
| Chillsynth · Nightride FM | `https://stream.nightride.fm/chillsynth.mp3` | — |

These are the URLs **configured in the source**, not a guarantee that the remote streaming services are currently operational. Some servers can change their paths or restrict clients.

## Prayer times and adhan

### Prayer display

- Calculates/fetches a daily prayer schedule for the selected coordinates, time zone, and calculation method.
- Includes **Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha** in the prayer timetable.
- Shows next prayer timing/countdown in the relevant dashboard/night display.
- Five adhan-enabled prayers: Fajr, Dhuhr, Asr, Maghrib, Isha; Sunrise is informational and not part of the alert-toggle set.
- Defaults to the Egyptian General Authority of Survey calculation method (`method=5`).

### Audio alerts

In **Settings → Play the adhan for**, individually turn Fajr, Dhuhr, Asr, Maghrib, and Isha on or off.

In **Settings → Sound**:

- Choose the general adhan audio file.
- Optionally choose a separate Fajr adhan file. If no Fajr-specific file is selected, Fajr uses the main one.
- Test the standard and Fajr audio.
- Clear an uploaded local sound where the interface offers that action.
- Device-provided files are stored locally in IndexedDB, with validation/size limits (25 MB maximum in the v19 source).

The player records basic diagnostic events for audio start/block/failure and takes precautions against duplicate or excessively late alerts. A brief grace window is configured for delayed prayer checks.

**Essential iPadOS limitation:** Safari/Home Screen applications generally require a **user tap to authorize sound again after opening or reloading**. iPadOS may suspend JavaScript while the device is sleeping or the app is backgrounded. A browser-based dashboard is **not a guaranteed unattended prayer alarm**. Keep the app foregrounded and the iPad awake where possible. Verify sound and speaker volume after every reload.

## Themes, night display, and burn-in protection

### Available themes

- **Boho (auto)** — automatically adjusts between the designed day/night treatments.
- **Boho light** — light treatment.
- **Dark boho** — dark treatment.
- **Midnight** — an alternate dark style.

### Night screen modes

The configured night interval defaults to **23:00–06:00** (adjustable with `nightFrom` and `nightTo` URL parameters).

- **Black + dim clock:** Minimizes the screen; retains a dim clock and next-prayer info.
- **Dim only:** Dims the design without forcing the full black view.
- **Off:** Disables scheduled night-screen behavior.

When the black screen is active, tapping it temporarily wakes the full dashboard (approximately one minute locally); the remote Wake command gives an extended wake period. A gentle layout drift can be enabled/disabled through `drift`.

The black-screen mode is a **web visual overlay**, not control over the device's physical backlight brightness; Safari cannot generally adjust the hardware brightness.

## Phone remote control

The phone remote is another static page served from the same deployment: **`remote.html`**. It is designed for mobile Safari or a phone browser and can be added to the Home Screen as a shortcut/web app.

### First-time setup / pairing

1. Make sure the iPad and phone can each access the internet and `https://ntfy.sh`.
2. Open the dashboard on the iPad.
3. Tap the settings/status pill near the bottom-left to open **Settings**.
4. Find **Remote control → Turn on**.
5. Copy or share the generated remote URL. The pairing credential comprises `topic.secret` and is typically carried in the URL fragment (`#…`).
6. Open that exact URL on the phone. Alternatively, open `remote.html` and paste the **complete** pairing code into its setup field.
7. The remote stores its pairing in the phone browser and starts requesting the iPad state.
8. Optionally add the phone remote to its Home Screen.

**Do not share the pairing link** in a public message, screenshot, public repository, or untrusted device. It is effectively an authorization credential. Settings import/export deliberately excludes the remote secret. Choosing **New code** requires re-pairing the phone.

### Communication and security

- Commands and status use the hosted **ntfy.sh** relay; devices do not need to share local Wi-Fi, but both require internet access.
- The v16.1+ remote protocol signs command payloads using the pairing secret (HMAC through Web Crypto), a timestamp, and a nonce.
- The dashboard rejects unsupported/invalid or replayed commands.
- The phone receives acknowledgements and authenticated status snapshots where available.
- An acknowledgement that the relay accepted a message is *not* necessarily proof that the intended operation completed; use the displayed state and diagnostics to confirm.
- Transport online/connected status should not be confused with guaranteed iPad wakefulness: iPadOS may pause the background application.

### Remote command reference

| Category | Actions |
|---|---|
| Adhan | Stop current alert; test adhan; toggle each prayer's alert on/off |
| Quran | Play, pause, stop, next/previous verse, choose reciter, search/select surah, 30-minute sleep timer |
| Radio | Play, pause, stop, select among built-in stations, add a custom HTTPS station, 30/60/90-minute sleep timers |
| Screen | Force black screen; wake the dashboard |
| Theme | Auto Boho, Boho light, Dark boho, Midnight |
| Night screen | Black, Dim, Off |
| Data/dashboard | Refresh data; ping/check iPad; request fresh state; reload dashboard (confirmation may be required) |
| Status / now playing | iPad status, current theme/display mode, audio readiness, Quran reciter/surah/verse, radio station, playback status/progress, connection information |
| Unified controls | Adaptive previous, play/pause, and stop for currently active audio source |

### Remote status details (v17 onward)

The live-status panel can show:

- Last known iPad status and time since the last response.
- Theme/display state and audio readiness.
- Currently active media (Quran, radio, or idle).
- Quran verse progress and reciter/surah where available.
- Radio station and primary/backup stream state where available.
- Unified media control buttons and an explicit **Refresh status** action.
- Basic connection diagnostics and command feedback.

Progress is sent periodically and may be interpolated on the phone; it is **not** a frame-accurate synchronized playback position. Live radio has no meaningful elapsed/total-duration progress bar.

### Re-pairing and resetting the remote

- **Settings → Remote control → New code:** revokes the previous code for the currently running dashboard and generates a replacement. Update the remote link on every phone.
- **Turn off:** disables iPad remote processing.
- **Forget** on the phone: discards its locally saved pairing.
- To troubleshoot: verify that the iPad is open/awake, the dashboard has internet, the pairing matches, and ntfy.sh is reachable.

## ntfy notifications and Raspberry Pi

The dashboard has an **independent ntfy notification subscriber** intended for events such as Raspberry Pi warnings, Docker/job alerts, and other messages sent by external systems.

### Configuring subscriptions

1. Go to **Settings → Notifications**.
2. Add a separate ntfy topic name (do **not** use the remote-control topic).
3. Choose a minimum notification priority: All (1), Normal and up (3), High and up (4), or Urgent only (5).
4. Use **Preview banner** to test presentation.
5. Review recent history or clear it from Settings.

High-priority notifications (4) can present persistent banners and chimes; urgent notifications (5) can show a more prominent full-screen alert and wake the dashboard's black-screen overlay. Audio still requires prior user interaction in Safari.

### Example publisher from your Pi

```bash
curl -H 'Title: Media Pi' -H 'Priority: high' \
  -d 'Jellyfin container has stopped' \
  https://ntfy.sh/YOUR_PRIVATE_PI_TOPIC
```

Use a **long, unguessable topic** and understand that the public ntfy.sh service is a relay, not a private, end-to-end encrypted telemetry service by default. Avoid sending secrets, private camera images, sensitive logs, or confidential data.

**Scope boundary:** v19.0 displays ntfy messages. It does **not** itself collect Raspberry Pi CPU, memory, temperature, disk, Docker state, qBittorrent metrics, or Jellyfin sessions. Those would require a separately developed monitoring agent/integration.

## Settings, backups, and local data

### Settings sections

The dashboard Settings panel contains:

- Individual adhan-alert toggles.
- Theme selection.
- Night-screen behavior.
- System Health (version, uptime/session time, network, adhan readiness, API freshness, diagnostic log).
- Settings Backup export/import.
- Adhan file selection, clearing, and audio tests.
- ntfy notification topics and priority threshold.
- Maintenance and screen info.
- Remote control pairing, status testing, and reset/disabling.

### Settings export/import

Use **Settings → Settings backup → Export** to download a JSON file of supported preferences. Use **Import** to select that file and restore configuration.

- Backup is intentionally a **preferences backup**, not a full media or database backup.
- It excludes pairing secrets, notification topics, and uploaded adhan sound files.
- Imported values are validated, and the dashboard may reload afterwards.
- Re-enable adhan audio with a tap after reloading.
- Keep a separate copy of any uploaded adhan source file.

### Storage technologies

| Storage | Purpose |
|---|---|
| `localStorage` | User preferences, theme, alerts, saved state, diagnostic/notification history, remote pairing on the phone |
| `IndexedDB` | User-selected adhan audio file data |
| Service Worker Cache Storage | Dashboard shell/static assets and optional same-origin sound files |
| Runtime memory | Playback state, current events, timers, active stream/error conditions |

Browser eviction, private browsing, clearing website data, changing hostnames, or a damaged origin can remove saved data. Preserve the same HTTPS origin for seamless upgrades.

## Deployment and upgrades

### Requirements

- A static **HTTPS** web host that can serve nested folders and `.js`, `.css`, `.json`, `.png`, `.woff2`, and audio files with appropriate content types.
- Safari/iPadOS 15 or a modern browser with `fetch`, `Promise`, Service Workers, Web Crypto, IndexedDB, and standard audio support.
- Internet access for external data APIs, streaming media, ntfy remote/notifications, and first-time cache population.
- No mandatory backend, Node.js process, database, Docker service, or Raspberry Pi to **host** the dashboard itself.

### Deploy the release ZIP

1. Back up the currently deployed site **and** export Settings if possible.
2. Extract `iPadDashboard_v19.0.zip`.
3. Upload the **entire site tree** to the static host/document root. Keep folders and relative paths intact.
4. Ensure these paths resolve over HTTPS:
   - `/index.html`
   - `/remote.html`
   - `/sw.js`
   - `/quran-data.js`
   - `/css/index.css` and `/css/remote.css`
   - `/js/core/...`, `/js/dashboard/index.js`, `/js/remote/remote.js`
   - `/fonts/...`, `/icons/...`, `/timings/islam-sobhi/...`
5. Visit `https://YOUR_HOST/index.html` on the iPad. Open or reload the app to acquire the new cached assets.
6. Open **Settings → System health** and verify the version reads v19.0; check for failing/stale API jobs.
7. Tap the dashboard once to unlock sound. Test adhan, Quran, radio, and remote functionality.
8. Confirm the phone remote at `https://YOUR_HOST/remote.html` still uses the correct saved pairing code.
9. Keep the previous ZIP and a known-good deployment available for rollback.

> **Critical:** The app has been modularized. Deploying only the top-level `index.html` or `remote.html` without matching `css/`, `js/`, fonts, and cache updates will break the application.

### Subdirectory hosting

All page assets use relative paths and may be served from a site subdirectory, but the service worker registration/scope, routing, and base URL must be tested at the target path. Avoid moving the application across origins without planning a preferences/pairing migration.

### Suggested static-host testing

From the extracted release directory, for local inspection only:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/` on the same computer. For iPad deployment, use **HTTPS**; service-worker functionality is unavailable on ordinary insecure remote HTTP origins. Localhost is treated specially in modern browsers. Use browser developer tools or the test harness for inspection.

### Rollback

Restore the complete previous release tree and reload the dashboard. Service-worker caching may briefly continue serving a newer or older asset; verify the version under System Health and clear the site cache only as a last resort because it can remove offline files or preferences. Never assume previous stored data is recoverable after clearing website data.

## Configuration reference

The site takes lightweight URL query parameters rather than requiring a build-time configuration file. Example:

```text
https://YOUR_HOST/index.html?city=Alexandria&lat=31.2&lon=29.95&tz=Africa%2FCairo&method=5&units=c&h12=1&secs=0
```

| Parameter | Default | Meaning |
|---|---|---|
| `city` | `Cairo` | Weather/location display label |
| `lat` | `30.0444` | Latitude (weather/prayer lookup) |
| `lon` | `31.2357` | Longitude (weather/prayer lookup) |
| `tz` | `Africa/Cairo` | Prayer/location timezone configuration |
| `method` | `5` | Prayer calculation method; 5 is Egyptian General Authority of Survey |
| `units` | `c` | `c` Celsius/km/h, `f` Fahrenheit/mph |
| `h12` | off | `1` to use a 12-hour clock |
| `secs` | on | `0` to hide seconds |
| `prayer` | on | `0` to hide/disable the prayer feature fetch path |
| `fx` | on | `0` to hide exchange-rate display |
| `gold` | on | `0` to hide gold display |
| `drift` | on | `0` to disable subtle layout drift |
| `from` | `USD` | Base currency for exchange display |
| `to` | `EGP` | Quote currency |
| `nightFrom` | `23` | Start hour for night display, 0–23 |
| `nightTo` | `6` | End hour for night display, 0–23 |

For example, hide finance widgets and use Fahrenheit:

```text
https://YOUR_HOST/index.html?fx=0&gold=0&units=f
```

**Practical warning:** These URL parameters describe the current page session and aren't automatically rewritten by the settings backup. Bookmark the preferred configured URL. Invalid coordinate/timezone/method values can lead to incorrect or failed external data requests.

## Offline behavior, refresh, and updates

### Service worker

`sw.js` uses versioned caches (`ipad-dashboard-v19.0`). It:

- Pre-caches the main page, remote page, bundled Quran text, fonts, styles, scripts, and other core files.
- Treats optional same-origin `adhan.mp3` and `adhan-fajr.mp3` as best-effort assets if available.
- Uses **network-first** for same-origin page navigations, falling back to cache when offline/slow.
- Uses a **stale-while-revalidate** approach for other same-origin GET assets.
- Does not intercept external API or media-service requests; those retain their own behavior.
- Clears other service-worker cache versions on activation.

### Data refresh and recovery

- Weather is scheduled for about every **30 minutes** after success.
- Prayer-time data is scheduled for about every **six hours** when enabled.
- Failed jobs use retry/backoff logic (starting around five minutes and capped around 30 minutes), and try again after connectivity/visibility returns.
- Updates and errors appear in the status/System Health interface.
- A cached screen is **not** proof that displayed values are current; verify freshness when the network has been unavailable.

### Update handling

The dashboard periodically checks for a changed `BUILD` string in the hosted main page. If a new version is detected, Settings offers **Update now**. Automatic maintenance reloads are guarded to avoid disruptive prayer-time windows and loss of an already-unlocked adhan sound state.

**After any restart or reload, tap to re-enable sound** and verify the remote. The browser cannot preserve every audio permission state across reloads.

## Project architecture

### Main files

```text
iPadDashboard/
├── index.html                 Main dashboard shell
├── remote.html                Phone remote shell
├── remote.webmanifest         Phone remote install metadata
├── sw.js                      Versioned offline service worker
├── quran-data.js              Bundled Arabic Quran text
├── css/
│   ├── index.css
│   └── remote.css
├── js/
│   ├── core/
│   │   ├── shared.js           Cryptographic/common helpers
│   │   ├── storage.js          Dashboard preference storage
│   │   ├── remote-storage.js   Remote preference storage
│   │   ├── catalog.js          Reciters and radio stations
│   │   ├── network.js          JSON API helper
│   │   ├── ui.js               Formatting and HTML escaping
│   │   ├── state.js            Observable state utility
│   │   ├── media-controller.js Media state normalization
│   │   ├── status-projection.js Read-only status snapshots
│   │   ├── components.js       Reusable UI helpers
│   │   └── diagnostics.js      Bounded event diagnostics
│   ├── dashboard/
│   │   └── index.js            Built browser dashboard script
│   └── remote/
│       └── remote.js           Remote implementation
├── src/dashboard/
│   ├── shell-before.js        First dashboard source section
│   ├── quran.js               Quran source section
│   ├── radio.js               Radio source section
│   └── shell-after.js         Final dashboard source section
├── timings/islam-sobhi/      Whole-surah timing JSON files
├── fonts/                    Locally hosted fonts and licenses
├── icons/                    Dashboard/remote icons
├── tests/                    Source-level unit and regression tests
├── tools/
│   ├── build.js               Combines dashboard sources
│   ├── release.js             Build + regression gate
│   ├── package.py             Validate and create release ZIP
│   ├── browser_e2e.py         Optional Playwright browser tests
│   └── browser_smoke.py       Legacy/alternative browser smoke tool
└── README.md
```

### Key architecture notes

- This is a **vanilla HTML/CSS/JavaScript** application, not a React/Vue project.
- Source-level Quran/radio sections are separated for maintenance, but built into one `js/dashboard/index.js` runtime script to preserve older Safari behavior and existing shared dependencies.
- Core utilities are loaded as ordinary scripts in a defined order in the HTML.
- Quran/radio playback engines still own live audio behavior. The shared state layer provides observed/projection state, **not** a fully authoritative independent player engine.
- The companion remote remains a separate page with its own script and CSS.
- Changes to `src/dashboard/` require rebuilding the generated `js/dashboard/index.js`. Avoid editing only the generated file if you intend changes to survive the next build.

### External dependencies (runtime)

| Dependency | Use |
|---|---|
| Open-Meteo | Weather forecasts |
| Prayer-time provider API | Daily prayer timings according to selected method/location |
| Exchange-rate and gold data providers | Finance indicators |
| EveryAyah / Islam Sobhi audio source | Quran recitations |
| SomaFM and other radio hosts | Internet radio playback |
| `ntfy.sh` | Phone remote command/status relay; notification subscriptions |

These providers are independently operated and may have downtime, rate limits, changes in content, or URL deprecations. Review the source when updating provider contracts.

## Development, build, and testing

### Build from source

Install a compatible Node.js release on the development machine; **Node is not needed on the deployed host**.

```bash
node tools/build.js
```

This regenerates the browser dashboard script from the split `src/dashboard/` source files.

### Source test gate

```bash
node tools/release.js
```

The v19.0 release script rebuilds and executes the configured source/unit/regression test suites.

### Package a release

```bash
python3 tools/package.py
```

This runs the release gate and creates a ZIP (default output in the parent directory). A custom destination can be supplied:

```bash
python3 tools/package.py /tmp/iPadDashboard_v19.0.zip
```

### Optional browser tests

```bash
python3 tools/browser_e2e.py
```

Requires the appropriate Playwright/Python and Chromium dependencies. In previous release attempts, Chromium tests were blocked or timed out in restricted execution environments. Treat the harness as available tooling, **not proof that all browser E2E tests passed**.

### Recommended pre-release regression checklist

- [ ] Dashboard loads on iPadOS 15 in Safari and from Home Screen.
- [ ] Clock, Hijri date, weather, forecast, and prayer tiles render correctly.
- [ ] Finance widgets show/hide via URL flags.
- [ ] Prayer timetable matches expected location/method/time zone.
- [ ] Adhan sound upload, playback test, scheduled event, and Fajr override work.
- [ ] Quran loads text, plays, pauses, advances, changes reciter, and Stop closes mini-player.
- [ ] Radio presets play; SomaFM primary-to-backup fallback functions; custom stream works.
- [ ] Adhan interruption and subsequent media resume behave correctly.
- [ ] Phone remote pairing, status refresh, authenticated command delivery, and invalid-command rejection work.
- [ ] All themes and black/dim/off night modes render correctly.
- [ ] Settings export/import and existing preferences survive reload.
- [ ] Notification topics show correct priority handling and history.
- [ ] App can reopen its cached shell without network (after initial successful install).
- [ ] An upgrade refreshes all scripts/styles without stale mixed-version assets.

## Security and privacy

- Keep **pairing URLs/secrets private**. The secret gives control of the dashboard.
- ntfy.sh is a third-party relay. Avoid publishing sensitive information in remote status or notification bodies.
- Use a separate, unguessable topic for Pi notifications. The **remote-control topic should not be used for ordinary notifications**.
- Never check generated pairing codes, unredacted settings, or real personal notifications into version control.
- The dashboard uses HTTPS for external browser requests; avoid mixed-content HTTP media streams.
- The remote protocol uses signed commands, timestamps, and replay checks; this protects authorization but does **not** turn a public relay into end-to-end private storage.
- Custom station links must use HTTPS. Only use trusted audio sources.
- The settings export excludes remote secrets and audio files, but still contains preferences; inspect it before sharing.
- Data/caches are origin-specific. Changing hostnames can create a fresh installation with different local storage.
- The project does not include an authenticated public admin API or camera/server management endpoint.

## Troubleshooting

| Symptom | Likely cause / action |
|---|---|
| Blank dashboard after upgrading | Deploy **all** `js/`, `css/`, assets and new `sw.js`; then reload; check the browser console if available. |
| Old look or behavior after deployment | Service-worker cache or mixed-version assets; verify System Health version and complete deployment. |
| Weather or prayer information stale | Check connectivity, coordinates, time zone, System Health job status, and external provider reachability. |
| Incorrect prayer times | Confirm `lat`, `lon`, `tz`, `method`, and system time/time zone. |
| Adhan did not play | Tap the iPad after starting/reloading; verify sound file, enabled prayer, speaker volume, and whether iOS suspended the page. |
| Uploaded adhan file missing | Check browser site data/IndexedDB, storage availability, and whether the host/origin changed. Re-upload the original file. |
| Quran text doesn't load | Ensure `quran-data.js` uploaded and cached; confirm script loads without errors. |
| Quran audio doesn't play | Verify internet, reciter source, device audio unlock, and player error indicators. |
| Stop doesn't close Quran mini-player | Use **Stop**, not Pause; reload and verify correct deployed JS/cache version. |
| Radio silent/buffering | Test the primary/backup URL, iPad audio permission, and external stream availability. |
| Remote says no answer | iPad may be asleep, backgrounded, offline, unpaired, or unable to reach ntfy.sh; use **Check iPad**. |
| Remote command rejected | Check the `topic.secret` pairing code and whether the code was rotated. |
| Remote shows stale Now Playing | Request **Refresh status**, wake/reopen the iPad, and check ntfy relay connectivity. |
| Notifications don't show | Confirm topic spelling, priority filter, internet, and whether the sender published to the correct topic. |
| Missing chime | iPadOS may need an initial user gesture; confirm speaker/volume. |
| Night display looks black | Check Night screen settings; tap the screen to wake temporarily, or use the remote Wake action. |
| Settings import fails | Use a valid dashboard-exported JSON file; backup does not include media/secret fields. |
| Offline screen unavailable | Successfully load the app online once, keep the same origin, and ensure the service worker installed. |

## Known limitations and future opportunities

### Known technical limitations

- Physical iPadOS 15 regression has not been certified end to end.
- Browser-hosted adhan cannot guarantee unattended playback through iPadOS suspend/auto-play restrictions.
- Remote updates depend on an available internet connection and the ntfy.sh service; status can become stale.
- Quran/radio playback depends on third-party hosts and internet, even though Arabic Quran text is bundled.
- Source sections are modularized for development but remain coupled at runtime; the shared state is currently a projection.
- Some UI components/diagnostics integration are still incremental rather than uniformly applied throughout the app.
- Real browser E2E harness execution was not proven in the earlier restricted build environment.

### Potential future features — **not implemented**

- Raspberry Pi metrics: CPU, RAM, temperature, disk, Docker health, Jellyfin/qBittorrent activity.
- Reolink Argus PT Ultra events, snapshots, or compatible hub/NVR camera feed.
- Smart home controls and Home Assistant integration.
- Customizable widget layout, dashboards/profiles, and Focus Mode.
- Calendar/tasks and richer financial history charts.
- Quran bookmarks, goals, and managed offline downloads.
- Multi-iPad control and scheduled remote routines.

---

## Release history (summary)

| Version | Main change |
|---|---|
| v16.0 | Diagnostics, network recovery, safer adhan/update handling |
| v16.1 | Quran Stop and book icon, signed remote commands, settings backup/import |
| v16.2 | Adhan file-picker and Quran selection-list alignment fixes |
| v17.0 | SomaFM stream/fallback updates and remote live status/Now Playing |
| v18.0–18.3 | CSS/JS separation, shared libraries, split media source, build tools/tests |
| v18.4–18.8 | Shared state and diagnostic projection, UI utility refinements, testing harness |
| v18.9 | Storage gateway and reusable settings improvements |
| **v19.0** | Final planned maintainability update; state and remote-storage hardening |

**Documentation baseline:** v19.0 source package. Before a production deployment, verify the actual target device, hosted APIs, and audio behaviors using the regression checklist above.
