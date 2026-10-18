# iPad Dashboard

A single-file, always-on dashboard for an old iPad (built for an iPad Air 2 on iPadOS 15). It shows a large clock, the date (Gregorian and Hijri), current weather with a 5-day forecast, and the six daily prayer times with a countdown to the next one.

No build step, no dependencies, no API keys. The whole app is `index.html`.

## Features

- Clock with optional seconds and 12/24-hour display
- Current weather, feels-like, humidity, wind, and a 5-day forecast
- Prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) with the next prayer highlighted and a countdown
- Dims automatically at night
- Landscape and portrait layouts
- Shows the last known data when Wi-Fi drops
- Reloads itself around 04:00 each day to stay fresh
- Plain ES5 JavaScript, so it runs on old Safari

## Data sources

| Data | Source |
| --- | --- |
| Weather | [Open-Meteo](https://open-meteo.com/) |
| Prayer times and Hijri date | [Aladhan](https://aladhan.com/prayer-times-api) |

Both are free and need no account. An internet connection is required for fresh data.

## Hosting on GitHub Pages

1. Create a **public** repository (for example `dashboard`).
2. Upload `index.html` (and this README) to the repository root.
3. Go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repo-name>/`.

To update the dashboard, upload a new `index.html`. The iPad loads the new version the next time the app opens.

## Installing on the iPad

1. Open the site address in **Safari** on the iPad.
2. Add any settings to the address first (see below).
3. Tap **Share → Add to Home Screen → Add**.
4. Launch it from the new icon so it runs full-screen without Safari's bars.
5. In **Settings → Display & Brightness → Auto-Lock**, choose **Never**.
6. In **Settings → Accessibility → Guided Access**, turn it on. Open the dashboard, triple-click the Home button, and start Guided Access to lock the iPad to the page.
7. Keep the iPad plugged in.

## Settings

Settings are passed in the address, so there is nothing to edit in the code. Add them before saving to the Home Screen.

Example:

```
https://<your-username>.github.io/dashboard/?city=Alexandria&lat=31.2001&lon=29.9187&h12=1&secs=0
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `city` | `Cairo` | Name shown next to the weather |
| `lat` | `30.0444` | Latitude |
| `lon` | `31.2357` | Longitude |
| `tz` | `Africa/Cairo` | Time zone used for prayer times |
| `method` | `5` | Prayer calculation method (5 = Egyptian General Authority of Survey). See the [Aladhan methods list](https://aladhan.com/calculation-methods) |
| `units` | `c` | `c` for Celsius, `f` for Fahrenheit |
| `h12` | off | `1` for a 12-hour clock |
| `secs` | on | `0` to hide seconds |
| `prayer` | on | `0` to hide the prayer row |
| `nightFrom` | `23` | Hour (0–23) when dimming starts |
| `nightTo` | `6` | Hour (0–23) when dimming ends |

If you change the address after installing, delete the Home Screen icon and add it again.

## Troubleshooting

- **Blank or "Offline" status:** the iPad has no internet, or one of the APIs is unreachable. Cached data is shown until the connection returns.
- **Wrong prayer times:** check `lat`, `lon`, `tz`, and `method` for your location.
- **Screen turns off:** set Auto-Lock to **Never** and keep the iPad plugged in.
- **Old data after an update:** close the Home Screen app fully and reopen it.

## Hosting on the iPad itself (optional)

If the iPad is jailbroken (an iPad Air 2 can be, using palera1n), you can serve the page from the device and open `http://localhost:8080`:

1. Install `openssh` and `python3` from Sileo.
2. Copy `index.html` to `/var/mobile/dashboard/`.
3. Run `python3 -m http.server 8080 --bind 127.0.0.1 --directory /var/mobile/dashboard`, or set it up as a launch daemon so it starts at boot.

Note that the jailbreak is semi-tethered. After every reboot you need to reconnect to a computer and re-run the jailbreak before the server comes back.

## Notes

- Weather and prayer data come from third-party services, so check prayer times against your local mosque or authority if accuracy matters.
- The iPad Air 2 no longer receives security updates. Keep banking and other sensitive logins off it.
