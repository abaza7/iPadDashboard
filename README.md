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
| `fonts/` | Fraunces and Jost font files plus their license texts. Upload this whole folder |
| `adhan.mp3` | *Optional.* Your main adhan recording (see below) |
| `adhan-fajr.mp3` | *Optional.* A separate Fajr adhan |

## Hosting on GitHub Pages

1. Create a **public** repository (for example `iPadDashboard`).
2. Upload `index.html`, `sw.js`, the `fonts` folder and this README to the repository root. (On github.com choose **Add file → Upload files** and drag the `fonts` folder in as a folder, so the files end up at `fonts/Fraunces.woff2` and so on.)
3. Go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repo-name>/`.

To update the dashboard, upload the new files. The iPad gets the new version the next time the app opens online.

## Installing on the iPad

1. Open the site address in **Safari** on the iPad. Add any settings to the address first (see below).
2. Open the page once with internet so the service worker can save it for offline use.
3. Tap **Share → Add to Home Screen → Add**, and launch it from the new icon.
4. In **Settings → Display & Brightness → Auto-Lock**, choose **Never**.
5. In **Settings → Accessibility → Guided Access**, turn it on. Open the dashboard, triple-click the Home button, and start Guided Access to lock the iPad to the page.
6. Keep the iPad plugged in.

## Adhan alerts

The audio is not bundled with this project. Adhan recordings are usually copyrighted, so use one you have the right to use, such as a recording from your local mosque or one with a free license.

**Option A: choose the file on the iPad (recommended).**

1. Save the audio file (mp3, m4a, or wav) to the iPad, for example in the Files app or iCloud Drive.
2. In the dashboard, tap the pill in the bottom-left corner to open **Adhan alerts**.
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
| `nightFrom` | `23` | Hour (0–23) when dimming starts |
| `nightTo` | `6` | Hour (0–23) when dimming ends |

If you change the address after installing, delete the Home Screen icon and add it again.

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
