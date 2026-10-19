# iPad Dashboard

A single-page, always-on dashboard for an old iPad (built for an iPad Air 2 on iPadOS 15). It shows a large clock, the date (Gregorian and Hijri), the USD/EGP exchange rate, current weather with a 5-day forecast, and the daily prayer times with a countdown to the next one. It can play the adhan at the prayers you choose.

No build step, no dependencies, no API keys. The app is `index.html` plus a small service worker, `sw.js`.

## Features

- Clock with optional seconds and 12/24-hour display
- Current weather, feels-like, humidity, wind, and a 5-day forecast
- USD/EGP exchange rate with the change since yesterday
- Prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) with the next prayer highlighted and a countdown
- **Adhan alerts:** choose which of the five prayers play the adhan, and choose the audio files
- **Offline start:** opens with no internet using the last data it fetched. A month of prayer times is cached, so prayer times and adhan alerts keep working offline
- **Automatic retry:** any fetch that fails is retried every 5 minutes, and immediately when the iPad comes back online
- **Themes:** *Boho* (warm cream, terracotta and gold), *Dark boho*, and the original *Midnight*. The default, *Boho (auto)*, switches to Dark boho from **Maghrib until sunrise** using the day's prayer times, and back to the light theme at sunrise
- **Gold price:** 21k and 24k gold per gram in EGP, with the change since yesterday
- **Night screen and burn-in protection:** between `nightFrom` and `nightTo` (23:00–06:00 by default) the screen goes black with only a dim clock and the next prayer. Tap it to see the full dashboard for a minute. The whole layout also drifts by a few pixels every few minutes
- **Remote control:** switch themes, stop the adhan, toggle alerts or blank the screen from your phone (see below)
- **Update check:** the dashboard notices when a new version is published and updates itself when that can't cost you the adhan sound (see below)
- Custom fonts: Fraunces for the clock, date and prayer times, Jost for labels. Both are bundled, so there is no internet needed to show them
- Dims automatically at night, landscape and portrait layouts
- Plain ES5 JavaScript, so it runs on old Safari

## Data sources

| Data | Source |
| --- | --- |
| Weather | [Open-Meteo](https://open-meteo.com/) |
| Prayer times and Hijri date | [Aladhan](https://aladhan.com/prayer-times-api) |
| Exchange rate | [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) (falls back to [open.er-api.com](https://www.exchangerate-api.com)) |

All are free and need no account. The exchange rate is a daily mid-market reference rate, not a bank's buy or sell price, so your bank or an exchange house will differ slightly.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole dashboard |
| `sw.js` | Service worker that makes offline start work |
| `icons/`, `apple-touch-icon.png` | The Home Screen icon (rainbow arch with a clock) in the sizes iPadOS asks for |
| `remote.html` | The phone remote control page |
| `fonts/` | Fraunces and Jost font files plus their license texts. Upload this whole folder |
| `adhan.mp3` | *Optional.* Your main adhan recording (see below) |
| `adhan-fajr.mp3` | *Optional.* A separate Fajr adhan |

## Hosting on GitHub Pages

1. Create a **public** repository (for example `iPadDashboard`).
2. Upload `index.html`, `remote.html`, `sw.js`, the `fonts` folder and this README to the repository root. (On github.com choose **Add file → Upload files** and drag the `fonts` folder in as a folder, so the files end up at `fonts/Fraunces.woff2` and so on.)
3. Go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repo-name>/`.

To update the dashboard, upload the new files. The iPad gets the new version the next time the app opens online.

## Installing on the iPad

1. Open the site address in **Safari** on the iPad. Add any settings to the address first (see below).
2. Open the page once with internet so the service worker can save it for offline use.
3. Tap **Share → Add to Home Screen → Add**, and launch it from the new icon.
   The icon is the arch-and-clock picture from the `icons` folder. iPadOS copies the icon when you add the page, so if you had added it before the icons existed, delete the old Home Screen icon and add it again.
4. In **Settings → Display & Brightness → Auto-Lock**, choose **Never**.
5. In **Settings → Accessibility → Guided Access**, turn it on. Open the dashboard, triple-click the Home button, and start Guided Access to lock the iPad to the page.
6. Keep the iPad plugged in.

## Adhan alerts

The audio is not bundled with this project. Adhan recordings are usually copyrighted, so use one you have the right to use, such as a recording from your local mosque or one with a free license.

**Option A: choose the file on the iPad (recommended).**

1. Save the audio file (mp3, m4a, or wav) to the iPad, for example in the Files app or iCloud Drive.
2. In the dashboard, tap the pill in the bottom-left corner to open **Settings**.
3. Under **Sound**, tap **Choose file** next to *Adhan* and pick your file. Optionally pick a separate *Fajr adhan*.
4. Turn each prayer on or off with the buttons at the top. A 🔔 or 🔕 icon on each prayer card shows its setting.
5. Tap **Test adhan** to check the sound and volume.

Any common audio file works (mp3, m4a, wav, aac). The file is checked when you pick it, and the panel tells you if the iPad can't play it. If the file is in iCloud Drive, open the Files app first and download it so it is stored on the iPad. The files and your choices are stored only on the iPad and are kept offline. Do this from the Home Screen app, not from Safari, because the two keep separate storage.

**Option B: host the file with the site.** Upload a file named `adhan.mp3` (and optionally `adhan-fajr.mp3`) next to `index.html`. It is used when no file has been chosen on the iPad. Only do this with a recording you are allowed to publish, because the repository is public.

**Important: tap once after opening the app.** iPadOS only allows sound after a tap, so when the app starts the pill shows *Tap once to enable adhan sound*. Tap anywhere on the screen once, and the adhan will then play on schedule. If an adhan time arrives before you have tapped, the screen shows a **Play adhan** button instead. After a reboot or if iPadOS closes the app, you need to tap once again.

The iPad's volume buttons control the loudness. The adhan screen has a **Stop** button.

## Settings in the address

Settings are passed in the address, so there is nothing to edit in the code. Add them before saving to the Home Screen.

Example:

```
https://<your-username>.github.io/iPadDashboard/?city=Alexandria&lat=31.2001&lon=29.9187&h12=1&secs=0
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `city` | `Cairo` | Name shown next to the weather |
| `lat` | `30.0444` | Latitude |
| `lon` | `31.2357` | Longitude |
| `tz` | `Africa/Cairo` | Time zone used for prayer times |
| `method` | `5` | Prayer calculation method (5 = Egyptian General Authority of Survey). See the [Aladhan methods list](https://aladhan.com/calculation-methods) |
| `units` | `c` | `c` for Celsius, `f` for Fahrenheit |
| `from` | `USD` | Currency to show the rate for |
| `to` | `EGP` | Currency the rate is shown in |
| `fx` | on | `0` to hide the exchange rate |
| `h12` | off | `1` for a 12-hour clock |
| `secs` | on | `0` to hide seconds |
| `prayer` | on | `0` to hide prayer times and adhan |
| `theme` | `boho` | `boho` (auto day/night), `boho-light`, `boho-dark` or `midnight`. You can also change it in the settings panel |
| `gold` | on | `0` to hide the gold price |
| `debug` | off | `1` shows screen measurements (size, safe areas) to help diagnose layout problems on a real iPad. Tap the box to close it |
| `drift` | on | `0` to turn off the slow layout drift |
| `remote` | none | Remote-control code (normally set in the settings panel instead) |
| `nightFrom` | `23` | Hour (0–23) when dimming starts |
| `nightTo` | `6` | Hour (0–23) when dimming ends |

If you change the address after installing, delete the Home Screen icon and add it again.

## Gold price

Gold comes from the same free rates file as the exchange rate (the XAU gold price converted to your currency), so it needs no extra service. It is shown per gram for 21k (21/24 of the spot price, the common karat in Egypt) and 24k, with the change in 21k since yesterday.

This is the international spot price converted at the day's exchange rate. Jewellers add their own premium, workmanship charges and taxes, so shop prices are higher. Treat it as a reference. Add `?gold=0` to hide it.

## Night screen and burn-in protection

- From `nightFrom` to `nightTo` (default 23:00–06:00) the screen turns black and shows only a dim clock and the next prayer. Tap the screen to see everything for a minute; it then goes black again. Adhan alerts still appear on top.
- In **Settings → Night screen** you can choose *Black + dim clock*, *Dim only* (the old behavior) or *Off*.
- Every few minutes the whole layout moves by a few pixels, so no element sits on exactly the same pixels all day. Use `?drift=0` to turn that off.
- The iPad Air 2 has an LCD screen, which does not burn in like OLED, but it can show faint image retention. This helps with that. The backlight stays on, so the iPad still uses a little power, so lower the brightness in Control Center at night if you want.

## Updates

About every six hours (and shortly after start-up) the dashboard checks whether a new version has been published.

- When one is found the pill at the bottom-left says **Update ready – tap here**. Open it and tap **Update now**.
- It also updates by itself at night, but only if that can't cost you the adhan sound. iPadOS only allows sound after you tap the screen once each time the page loads, so a reload silences the adhan until the next tap. Therefore the automatic update runs only if sound is not currently enabled, or no prayer alerts are switched on. Otherwise it waits for you to tap.
- After any reload, tap the screen once to re-enable sound.

## Remote control from your phone

1. On the iPad open **Settings → Remote control → Turn on**. It shows the address of the remote page, ending in a private code, in a box you can select. Use **Copy** or **Share** (the share sheet can send it to your phone by AirDrop, Messages or Notes).
2. Open that address on your phone (type it in, or send it to yourself in Notes or Messages) and use **Share → Add to Home Screen** to keep it as an app.
3. The phone page has buttons for: stop adhan, test adhan, black screen on/off, theme, night screen mode, each prayer's alert on/off, refresh data, check the iPad, and reload the app. The iPad confirms each command on the phone.

**If it doesn't work:**
- On the iPad open **Settings → Remote control → Test**. It sends a message to the relay and checks that it comes back. It says whether the iPad can't reach the relay at all, or reached it but received nothing.
- The phone page checks the iPad automatically when it opens and tells you if the iPad doesn't answer. Use **Check iPad** to repeat that.
- The code on the phone and in the iPad's settings must be exactly the same. After **New code** you need the new address on the phone.
- The iPad listens through a live connection and also checks the relay every 12 seconds, so a command can take up to about 12 seconds when the live connection is stalled.
- Commands older than two minutes are ignored, so a command sent while the iPad was offline won't fire later.

How it works: the phone and the iPad both use a free message relay, [ntfy.sh](https://ntfy.sh). The code is the name of a private topic. Anyone who learns the code can send these commands, so keep it private and use **New code** in the settings if it leaks. The iPad must be awake and online with the dashboard open. The commands cannot delete anything or change the data sources.

## Offline behavior and retries

- The page, the adhan files, and the last weather, exchange rate and prayer data are stored on the iPad.
- Prayer times are fetched a month at a time, so they keep working for days or weeks without internet.
- If a source fails, the bottom-right corner says which one (for example *Offline: weather*), and it is retried every 5 minutes. When the iPad reconnects, it retries immediately.
- Weather, exchange rate and prayer times fail independently, so one outage does not block the others.

## Troubleshooting

- **No sound:** tap the screen once, check the iPad volume and the side switch, and use **Test adhan** in the settings. Make sure a sound file is chosen. The pill shows *choose a sound* if none is set.
- **Can't choose an audio file:** open the dashboard from the Home Screen icon (not Safari), tap the pill in the bottom-left, then **Choose file → Browse**. Files in iCloud Drive must be downloaded first. Any message under the panel title says what went wrong.
- **Adhan did not play at the prayer time:** check that the prayer is switched on, that you tapped once since the app opened, and that the iPad was awake with the app open.
- **Wrong prayer times:** check `lat`, `lon`, `tz`, and `method` for your location.
- **Blank or "Offline" status:** the iPad has no internet, or one of the services is unreachable. Cached data is shown until the connection returns.
- **Old version after an update:** close the Home Screen app fully and open it again while online.
- **Screen turns off:** set Auto-Lock to **Never** and keep the iPad plugged in.

## Hosting on the iPad itself (optional)

If the iPad is jailbroken (an iPad Air 2 can be, using palera1n), you can serve the page from the device and open `http://localhost:8080`. Service workers need HTTPS or `localhost`, so offline start still works there.

1. Install `openssh` and `python3` from Sileo.
2. Copy the files to `/var/mobile/dashboard/`.
3. Run `python3 -m http.server 8080 --bind 127.0.0.1 --directory /var/mobile/dashboard`, or set it up as a launch daemon so it starts at boot.

The jailbreak is semi-tethered. After every reboot you need to reconnect to a computer and re-run the jailbreak before the server comes back.

## Fonts and licenses

The bundled fonts are free under the SIL Open Font License 1.1: [Fraunces](https://github.com/undercasetype/Fraunces) and [Jost](https://github.com/indestructible-type/Jost). Keep the `*-OFL.txt` files in `fonts/` when you publish. To use a different font, replace the files in `fonts/` and edit the three `@font-face` lines at the top of `index.html`.

## Notes

- Weather, exchange rate and prayer data come from third-party services, so check prayer times against your local mosque or authority if accuracy matters.
- The iPad Air 2 no longer receives security updates. Keep banking and other sensitive logins off it.

## Notifications from ntfy.sh (for example your Raspberry Pi)

Settings → **Notifications** → type the ntfy.sh topic your Pi already publishes to → Add. New messages appear as a banner at the top of the dashboard.

- Priority 1–3: banner for 20 seconds. Priority 4 (high): banner stays until tapped, plus a chime. Priority 5 (urgent): full-screen alert that also wakes the black night screen.
- "Show messages with priority" sets a minimum, so noisy topics don't light up the screen.
- The last 20 messages are kept in the same Settings section; a small "✉ n" on the bottom-left pill counts unread ones.
- Emoji tags such as `warning`, `rotating_light`, `white_check_mark`, `inbox_tray` become the banner icon.
- Only the ntfy.sh server works (a self-hosted `http://` server is blocked by Safari on an HTTPS page). The topic name acts like a password, so use a long random one. It cannot be the remote-control code.
- The topic is stored only on the iPad. Chimes need the usual one tap after the app opens.

## Weekly refresh

Settings → Maintenance → **Weekly refresh** (on by default). After 7 days of uptime the app reloads once, in the evening 45 minutes to 4 hours after Isha, never near a prayer or while an alert is showing. Reloading makes iPadOS silence the adhan until the screen is tapped once, so if remote control is on, your phone gets a message "weekly refresh done – tap the iPad once". Turn it off if you would rather never reload by itself.

## Quran player

The small book button at the bottom-left opens the player. Pick a surah (search by name or number) and a reciter (Mishary Alafasy is the default); it plays verse by verse, continues into the next surah, and remembers where you were.

- **Mini player:** a pill at the bottom while something is playing: play/pause, surah, reciter and verse counter. In landscape it also shows the current verse in Arabic (switch that off in the player). In portrait it stays compact and the verse is read in the reading view.
- **Reading view:** the current verse large, with the previous and next verse dimmed, plus the controls. Tap the verse in the mini player, or "Open reading view".
- **Controls:** previous/next verse, previous/next surah, tap the bar to jump to a verse, sleep timer (15/30/60 min or end of the surah).
- **Adhan:** the Quran pauses by itself when the adhan plays and resumes when the adhan is stopped or finished.
- **Phone remote:** a Quran section on the remote page (play, pause, stop, previous/next verse, surah number, sleep). Commands: `quran play`, `quran play 18`, `quran pause`, `quran stop`, `quran next`, `quran prev`, `quran surah 36`, `quran sleep 30`.
- **Needs internet for the audio** (everyayah.com). The text and the Arabic font are bundled (`quran-data.js`, `fonts/AmiriQuran.woff2`). Like the adhan, sound needs one tap after the app opens.
- Verse text: Tanzil.net via the quran-json package (CC BY-SA 4.0). Font: Amiri Quran (SIL OFL).

## Settings icon

When adhan sound is enabled and a sound is chosen, the bottom-left pill becomes a small gear (tap it for settings). The warning text comes back whenever a tap, a sound or an update is needed. A small number on the gear counts unread notifications.

## The strip at the bottom of the screen

On the iPad Air 2 (iPadOS 15) the see-through status bar style (`black-translucent`) made the Home Screen app 20 points shorter at the bottom, leaving a blank strip that the page can't paint (Settings → Screen info showed inner height 748 of 768). The page now asks for the solid `black` status bar instead: the status bar (time, battery) sits in its own black strip at the top and the page fills the rest of the screen. iOS reads this setting when the app is added to the Home Screen, so remove the old icon and use Share → Add to Home Screen again. To go back, change `black` to `black-translucent` in `index.html` and add the app again.

## Islam Sobhi (streamed reciter)

"Islam Sobhi" is the last entry in the Quran reciter list. Unlike the other reciters, which play one small file per verse from everyayah.com, he is **streamed as whole-surah files** from `cdn.mp3quran.net` (needs the internet; nothing is stored on the iPad).

- **Verse highlight / verse in the mini player / next and previous verse** need a small timing file per surah: `timings/islam-sobhi/001.json` ... `114.json`, each a list of start times in seconds (one per verse, plus the bismillah where the surah has one). Until a surah's file exists, the player simply says "streaming", plays the surah and hides the verse text; next/previous skip 15 s.
- Surahs play one after another. "Stop at end of surah" and the adhan pause work as for the other reciters.
- If the site changes its file addresses, edit the URL in the `QREC` list near the Quran player code in `index.html`.
