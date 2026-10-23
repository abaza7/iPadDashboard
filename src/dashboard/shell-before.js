(function () {
  "use strict";

  // ---------- config (override with URL params, e.g. ?city=Alexandria&lat=31.2&lon=29.95) ----------
  var q = {};
  location.search.replace(/^\?/, "").split("&").forEach(function (kv) {
    if (!kv) return;
    var p = kv.split("=");
    q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || "").replace(/\+/g, " "));
  });
  var CFG = {
    city:   q.city   || "Cairo",
    lat:    q.lat    || "30.0444",
    lon:    q.lon    || "31.2357",
    tz:     q.tz     || "Africa/Cairo",
    method: q.method || "5",            // 5 = Egyptian General Authority of Survey
    units:  q.units  || "c",            // c or f
    h12:    q.h12 === "1",              // 12-hour clock
    secs:   q.secs !== "0",             // show seconds
    prayer: q.prayer !== "0",           // show prayer row
    fx:     q.fx !== "0",               // show exchange rate
    gold:   q.gold !== "0",             // show gold price per gram (needs the exchange rate)
    drift:  q.drift !== "0",            // slowly shift the layout a few pixels
    from:   (q.from || "USD").toUpperCase(),
    to:     (q.to   || "EGP").toUpperCase(),
    nightFrom: parseInt(q.nightFrom || "23", 10),
    nightTo:   parseInt(q.nightTo   || "6", 10)
  };

  var BUILD = "2026-10-23.v19.6";           // bump on every release (used by the update check)
  var RETRY_MS = 5 * 60 * 1000;         // retry failed fetches every 5 minutes
  var ALERTABLE = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  var PRAYER_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  var ADHAN_WINDOW_MS = 2 * 60 * 1000;  // still play if we notice up to 2 min late

  var $ = function (id) { return document.getElementById(id); };
  var pad = DashboardUI.pad;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function store(k, v) { return DashboardStorage.write(k, v); }
  function load(k) { return DashboardStorage.read(k); }
  function esc(s) { return DashboardUI.escapeHTML(s); }
  function dmy(d) { return DashboardUI.dmy(d); }
  function hhmm(d) { return DashboardUI.hhmm(d); }

  function getJSON(url) { return DashboardNetwork.getJSON(url); }

  // Shared read-only projection of media state for future reusable components.
  // Existing media engines stay authoritative; subscribers never invoke player actions.
  var mediaState = DashboardState.create({ quran: null, radio: null });
  function syncMediaProjection() {
    var next = {};
    if (typeof Q !== "undefined" && Q) { var qm = DashboardMediaController.normalize(Q); next.quran = {
      active: qm.active, playing: qm.playing, paused: qm.paused,
      sura: Q.sura, verse: Q.a, reciter: Q.rec
    }; }
    if (typeof R !== "undefined" && R) { var rm = DashboardMediaController.normalize(R); next.radio = {
      active: rm.active, playing: rm.playing, paused: rm.paused,
      station: R.st, error: R.err || ""
    }; }
    mediaState.set(next);
  }


  // v18.4: shared bounded diagnostics, migrating the persisted v16 event schema.
  // Keep historical records readable by the existing Settings panel.
  var diagnostics = DashboardDiagnostics.create(40, load("diaglog") || []);
  var diagLog = diagnostics.list().map(function(e) { return {time:e.time, kind:e.category, detail:e.code}; });
  function diag(kind, detail) {
    diagnostics.add(kind, detail);
    diagLog = diagnostics.list().map(function(e) { return {time:e.time, kind:e.category, detail:e.code}; });
    store("diaglog", diagLog);
  }
  function friendlyAge(ts) { return DashboardUI.friendlyAge(ts); }
  function diagnosticsHTML() {
    var row = DashboardComponents.settingsRow;
    var h = row('Version ' + BUILD, 'Session ' + friendlyAge(pageStart) + ' · Network: ' + (navigator.onLine ? 'online' : 'offline') + ' · Adhan: ' + (unlocked ? 'audio enabled' : 'needs a tap'));
    jobs.forEach(function (j) {
      var age = friendlyAge(j.lastOK);
      var stale = !j.lastOK || (Date.now() - j.lastOK > j.okMs * 2);
      h += row(j.label + (j.failing ? ' · Error' : stale ? ' · Stale' : ' · Fresh'), 'Last success: ' + age + (j.failing ? ' · retry ' + Math.round(j.backoff / 1000) + 's' : ''));
    });
    h += row('Recent events', 'Stored locally on this device (last 40)', '<button class="btn ghost" type="button" data-a="diagclear">Clear</button>');
    diagLog.slice(0, 8).forEach(function (e) { h += '<div class="note">' + esc(new Date(e.time).toLocaleString()) + ' · ' + esc(e.kind) + ': ' + esc(e.detail) + '</div>'; });
    return h;
  }
  // ---------- background jobs: refresh on success, retry every 5 min on failure ----------
  var jobs = [];
  function addJob(label, fn, okMs) {
    var j = { label: label, fn: fn, okMs: okMs, timer: null, failing: false, running: false, failures: 0, backoff: RETRY_MS, lastOK: load("jobok_" + label) || 0 };
    j.run = function () {
      if (j.running) return;
      clearTimeout(j.timer);
      j.running = true;
      var p;
      try { p = fn(); } catch (e) { p = Promise.reject(e); }
      p.then(function () {
        if (j.failing) diag("recovered", j.label);
        j.failing = false; j.running = false; j.failures = 0; j.backoff = RETRY_MS;
        j.lastOK = Date.now(); store("jobok_" + j.label, j.lastOK);
        j.timer = setTimeout(j.run, j.okMs);
        updateStatus();
      }, function (err) {
        if (!j.failing) diag("fetch failed", j.label + " (" + (err && err.message || "unknown") + ")");
        j.failing = true; j.running = false; j.failures++;
        j.backoff = Math.min(30 * 60 * 1000, RETRY_MS * Math.pow(2, Math.min(j.failures - 1, 4)));
        j.timer = setTimeout(j.run, j.backoff);
        updateStatus();
      });
    };
    jobs.push(j);
    return j;
  }
  function updateStatus() {
    var bad = [];
    jobs.forEach(function (j) { if (j.failing) bad.push(j.label); });
    var full = bad.length ? "Unavailable: " + bad.join(", ") + " – retrying" : "Updated " + hhmm(new Date());
    $("status").textContent = (bad.length && ((Q && Q.active) || (R && R.active))) ? "Offline – retrying" : full;     // short while the player needs the room
    $("status").title = full;
    if (typeof positionMini === "function") positionMini();
  }
  function retryFailedNow() {
    jobs.forEach(function (j) { if (j.failing) j.run(); });
  }
  window.addEventListener("online", retryFailedNow);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) retryFailedNow(); });

  // ---------- clock ----------
  function renderClock() {
    if (typeof publishDashboardState === "function" && remoteTopic) publishDashboardState(false);
    var d = new Date();
    var h = d.getHours(), ap = "";
    if (CFG.h12) { ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; }
    var html = (CFG.h12 ? h : pad(h)) + ":" + pad(d.getMinutes());
    if (CFG.secs) html += '<span class="sec">' + pad(d.getSeconds()) + "</span>";
    if (CFG.h12) html += '<span class="ampm">' + ap + "</span>";
    $("clock").innerHTML = html;
    $("date").textContent = DAYS_LONG[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();

    var hr = d.getHours();
    var night = CFG.nightFrom > CFG.nightTo
      ? (hr >= CFG.nightFrom || hr < CFG.nightTo)
      : (hr >= CFG.nightFrom && hr < CFG.nightTo);
    document.body.classList.toggle("night", !!(night && nightMode !== "off"));
    setSleep((night && nightMode === "black" && Date.now() >= wakeUntil) || sleepForced, d);
  }

  // ---------- night screen: black with a dim clock (tap to wake for a minute) ----------
  var NIGHT_MODES = ["black", "dim", "off"];
  var nightMode = load("nightmode");
  if (NIGHT_MODES.indexOf(nightMode) < 0) nightMode = "black";
  var wakeUntil = 0, sleepForced = false;
  var nextInfo = null;       // { name, time } of the next prayer, kept by tickPrayer()

  function hmText(d) {
    var h = d.getHours(), ap = "";
    if (CFG.h12) { ap = h >= 12 ? " PM" : " AM"; h = h % 12 || 12; }
    return (CFG.h12 ? h : pad(h)) + ":" + pad(d.getMinutes()) + ap;
  }
  function setSleep(on, d) {
    var el = $("sleep");
    if (el.hidden === !on) {
      if (on) renderSleepText(d);
      return;
    }
    el.hidden = !on;
    document.documentElement.className = on ? "sleeping" : "";
    if (on) renderSleepText(d);
  }
  function renderSleepText(d) {
    var h = d.getHours(), ap = "";
    if (CFG.h12) { ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; }
    $("slClock").innerHTML = (CFG.h12 ? h : pad(h)) + ":" + pad(d.getMinutes()) + (ap ? '<span class="ampm">' + ap + "</span>" : "");
    var t = "";
    if (nextInfo && nextInfo.time) {
      var mins = Math.max(0, Math.round((nextInfo.time - d) / 60000));
      t = nextInfo.name + " " + hmText(nextInfo.time) + " · in " + (mins >= 60 ? Math.floor(mins / 60) + "h " : "") + (mins % 60) + "m";
    }
    $("slNext").textContent = t;
  }
  $("sleep").addEventListener("click", function () { wakeUntil = Date.now() + 60 * 1000; sleepForced = false; renderClock(); });

  // ---------- burn-in protection: the whole layout creeps a few pixels every few minutes ----------
  var DRIFT = [[0, 0], [0.7, 0.4], [-0.4, 0.8], [-0.8, -0.3], [0.3, -0.7], [0.8, 0.6], [-0.6, -0.6], [0.5, 0.1]];
  var driftI = Math.floor(Math.random() * DRIFT.length);
  function drift() {
    var pt = DRIFT[driftI++ % DRIFT.length], st = document.documentElement.style;
    st.setProperty("--dx", pt[0] + "vmin"); st.setProperty("--dy", pt[1] + "vmin");
  }
  if (CFG.drift) { drift(); setInterval(drift, 3 * 60 * 1000); }

  // ---------- weather (Open-Meteo, no API key) ----------
  var WX = {
    0: ["Clear", "☀️", "🌙"], 1: ["Mostly clear", "🌤️", "🌙"], 2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"], 45: ["Fog", "🌫️", "🌫️"], 48: ["Rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"], 53: ["Drizzle", "🌦️", "🌧️"], 55: ["Heavy drizzle", "🌧️", "🌧️"],
    61: ["Light rain", "🌦️", "🌧️"], 63: ["Rain", "🌧️", "🌧️"], 65: ["Heavy rain", "🌧️", "🌧️"],
    71: ["Light snow", "🌨️", "🌨️"], 73: ["Snow", "❄️", "❄️"], 75: ["Heavy snow", "❄️", "❄️"],
    80: ["Showers", "🌦️", "🌧️"], 81: ["Showers", "🌧️", "🌧️"], 82: ["Heavy showers", "⛈️", "⛈️"],
    95: ["Thunderstorm", "⛈️", "⛈️"], 96: ["Thunderstorm", "⛈️", "⛈️"], 99: ["Thunderstorm", "⛈️", "⛈️"]
  };
  function wx(code, isDay) {
    var e = WX[code];
    if (!e) {
      if (code >= 95) e = WX[95]; else if (code >= 80) e = WX[81]; else if (code >= 71) e = WX[73];
      else if (code >= 61) e = WX[63]; else if (code >= 51) e = WX[53]; else e = WX[3];
    }
    return { text: e[0], icon: isDay === 0 ? e[2] : e[1] };
  }
  function temp(v) { return Math.round(v) + "°"; }

  // ---------- line-art weather icons (boho themes) ----------
  function rays(cx, cy, r1, r2) {
    var o = "";
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, c = Math.cos(a), n = Math.sin(a);
      o += '<line class="c1" x1="' + (cx + r1 * c).toFixed(1) + '" y1="' + (cy + r1 * n).toFixed(1) +
        '" x2="' + (cx + r2 * c).toFixed(1) + '" y2="' + (cy + r2 * n).toFixed(1) + '"/>';
    }
    return o;
  }
  var CLOUD = '<path class="c2" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>';
  var CLOUD_F = CLOUD.replace('class="c2"', 'class="c2 cf"');
  var SUN = '<circle class="c1" cx="12" cy="12" r="4.4"/>' + rays(12, 12, 7.4, 10);
  var MOON = '<path class="c1" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  var ICONS = {
    sun: SUN,
    moon: MOON,
    cloud: CLOUD,
    partly: '<g transform="translate(-1.4 -1.6) scale(.62)">' + SUN + '</g><g transform="translate(5 6.4) scale(.74)">' + CLOUD_F + '</g>',
    partlyN: '<g transform="translate(-1.2 -1.4) scale(.6)">' + MOON + '</g><g transform="translate(5 6.4) scale(.74)">' + CLOUD_F + '</g>',
    fog: '<line class="c2" x1="4" y1="8" x2="20" y2="8"/><line class="c3" x1="2.5" y1="12.5" x2="21.5" y2="12.5"/><line class="c2" x1="5" y1="17" x2="19" y2="17"/>',
    rain: '<path class="c2" d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>' +
      '<line class="c3" x1="8" y1="13" x2="8" y2="21"/><line class="c3" x1="12" y1="15" x2="12" y2="23"/><line class="c3" x1="16" y1="13" x2="16" y2="21"/>',
    snow: '<path class="c2" d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>' +
      '<line class="c3" x1="8" y1="16" x2="8.01" y2="16"/><line class="c3" x1="8" y1="20" x2="8.01" y2="20"/><line class="c3" x1="12" y1="18" x2="12.01" y2="18"/>' +
      '<line class="c3" x1="12" y1="22" x2="12.01" y2="22"/><line class="c3" x1="16" y1="16" x2="16.01" y2="16"/><line class="c3" x1="16" y1="20" x2="16.01" y2="20"/>',
    storm: '<path class="c2" d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline class="c1" points="13 11 9 17 15 17 11 23"/>'
  };
  function kindOf(code, isDay) {
    var night = isDay === 0;
    if (code === 0) return night ? "moon" : "sun";
    if (code === 1 || code === 2) return night ? "partlyN" : "partly";
    if (code === 3) return "cloud";
    if (code === 45 || code === 48) return "fog";
    if (code >= 95) return "storm";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 51) return "rain";
    return "cloud";
  }
  function iconHTML(code, isDay) {
    if (document.documentElement.getAttribute("data-theme") === "midnight") return wx(code, isDay).icon;
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[kindOf(code, isDay)] + "</svg>";
  }

  function renderWeather(w) {
    if (!w || !w.current) return;
    var c = w.current;
    var info = wx(c.weather_code, c.is_day);
    $("wIcon").innerHTML = iconHTML(c.weather_code, c.is_day);
    $("wTemp").textContent = temp(c.temperature_2m) + (CFG.units === "f" ? "F" : "C");
    $("wDesc").textContent = info.text + " · " + CFG.city;
    $("wMeta").innerHTML = "<span>Feels " + temp(c.apparent_temperature) + " \u00B7 Humidity " + Math.round(c.relative_humidity_2m) +
      '%</span><span class="sep"> \u00B7 </span><span>Wind ' + Math.round(c.wind_speed_10m) + (CFG.units === "f" ? " mph" : " km/h") + "</span>";

    var f = $("forecast");
    f.innerHTML = "";
    var dly = w.daily;
    for (var i = 0; i < dly.time.length && i < 5; i++) {
      var p = dly.time[i].split("-");
      var dt = new Date(+p[0], +p[1] - 1, +p[2]);
      var fi = wx(dly.weather_code[i], 1);
      var el = document.createElement("div");
      el.className = "fc";
      el.innerHTML = '<div class="d">' + (i === 0 ? "Today" : DAYS[dt.getDay()]) + "</div>" +
        '<div class="i">' + iconHTML(dly.weather_code[i], 1) + "</div>" +
        '<div class="t">' + temp(dly.temperature_2m_max[i]) + " <span>" + temp(dly.temperature_2m_min[i]) + "</span></div>";
      f.appendChild(el);
    }
  }

  function fetchWeather() {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + CFG.lat + "&longitude=" + CFG.lon +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&forecast_days=5&timezone=auto" +
      (CFG.units === "f" ? "&temperature_unit=fahrenheit&wind_speed_unit=mph" : "");
    return getJSON(url).then(function (w) {
      if (!w || !w.current || !w.daily) throw new Error("bad weather");
      store("weather", w); renderWeather(w);
    });
  }

  // ---------- exchange rate (free, no key; daily reference rate) ----------
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  var OZ_G = 31.1034768;   // grams in a troy ounce

  function rateDateMs(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    return Date.parse(value + "T00:00:00Z");
  }
  function fxFresh(fx) {
    if (!fx || !(fx.rate > 0)) return false;
    var age = Date.now() - rateDateMs(fx.date);
    return isFinite(age) && age >= -86400000 && age < 72 * 3600000;
  }
  function renderFX(fx) {
    var el = $("fx");
    if (!CFG.fx || !fx || !(fx.rate > 0)) { el.hidden = true; renderGold(null); return; }
    var fresh = fxFresh(fx);
    var html = '<span class="pair">' + esc(fx.from) + "/" + esc(fx.to) + "</span>" + fx.rate.toFixed(2);
    if (typeof fx.prev === "number" && fresh) {
      var diff = fx.rate - fx.prev;
      html += '<span class="chg">' + (diff > 0.004 ? "▲" : diff < -0.004 ? "▼" : "–") + " " + Math.abs(diff).toFixed(2) + "</span>";
    }
    html += '<span class="fx-source" title="Rate date and provider">' + (fresh ? "" : "⚠ STALE · ") +
      esc(fx.date || "unknown date") + " · " + esc(fx.source || "cached") + "</span>";
    el.innerHTML = html;
    el.hidden = false;
    renderGold(fx);
  }
  function renderGold(fx) {
    var el = $("gold");
    if (!CFG.gold || !fx || !(fx.oz > 0)) { el.hidden = true; return; }
    var g24 = fx.oz / OZ_G, g21 = g24 * 21 / 24;
    var html = '<span class="pair">Gold/g</span><span class="karat">21k</span>' + fmtInt(g21) +
      '<span class="sepd">·</span><span class="karat">24k</span>' + fmtInt(g24);
    if (!fxFresh(fx)) html += '<span class="fx-source">⚠ STALE</span>';
    el.innerHTML = html; el.hidden = false;
  }
  function fetchFX() {
    if (!CFG.fx) return Promise.resolve();
    var f = CFG.from.toLowerCase(), t = CFG.to.toLowerCase();
    var last = load("fx");
    // Never fetch faster than every 6 hours, even after reloads or network reconnects.
    var lastAttempt = +(load("fx_last_attempt") || 0);
    if (Date.now() - lastAttempt < 6 * 3600000) return Promise.resolve();
    store("fx_last_attempt", Date.now());
    var jsd = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@";
    function pick(j, source) {
      var rate = j && j[f] && j[f][t];
      if (typeof rate !== "number" || !(rate > 0)) throw new Error("bad rate");
      var xau = j[f].xau;
      return {rate:rate, date:j.date, source:source, oz:(xau > 0 ? rate / xau : 0)};
    }
    function valid(cur) { if (!fxFresh(cur)) throw new Error("outdated FX source"); return cur; }
    function latest() {
      return getJSON(jsd + "latest/v1/currencies/" + f + ".json").then(function(j) { return valid(pick(j,"jsDelivr daily")); })
      .catch(function() { return getJSON("https://latest.currency-api.pages.dev/v1/currencies/" + f + ".json").then(function(j) {return valid(pick(j,"currency-api daily"));}); })
      .catch(function() { return getJSON("https://open.er-api.com/v6/latest/" + CFG.from).then(function(j) {
        var rate = j && j.rates && j.rates[CFG.to];
        if (!(rate > 0) || !j.time_last_update_utc) throw new Error("bad rate or update time");
        var ts = Date.parse(j.time_last_update_utc);
        if (!isFinite(ts)) throw new Error("bad source time");
        var date = new Date(ts).toISOString().slice(0,10);
        return valid({rate:rate,date:date,source:"open.er-api",oz:j.rates.XAU > 0 ? rate/j.rates.XAU : 0});
      }); });
    }
    return latest().then(function(cur) {
      // Previous-day lookup only once per accepted snapshot; no extra fetch on a stale response.
      cur.from = CFG.from; cur.to = CFG.to;
      if (last && last.date !== cur.date && last.rate > 0) {cur.prev=last.rate;cur.ozPrev=last.oz;}
      store("fx",cur);renderFX(cur);
    }).catch(function(err) {
      if (last) renderFX(last);
      if (typeof logDiag === "function") logDiag("fx", "source unavailable or stale");
    });
  }

  // ---------- prayer times (Aladhan monthly calendar, cached for offline use) ----------
  var prayerDays = load("pdays") || {};   // "DD-MM-YYYY" -> { t: {Fajr:"HH:MM",...}, h: "hijri text" }
  var prayerEls = [];

  function prunePrayerDays() {
    var cut = new Date();
    cut.setDate(cut.getDate() - 2);
    Object.keys(prayerDays).forEach(function (k) {
      var p = k.split("-");
      if (new Date(+p[2], +p[1] - 1, +p[0]).getTime() < cut.getTime()) delete prayerDays[k];
    });
  }

  function parseDay(d) {
    var g = d && d.date && d.date.gregorian && d.date.gregorian.date;
    if (!g || !d.timings) return null;
    var t = {}, n = 0;
    PRAYER_NAMES.forEach(function (name) {
      var m = /(\d{1,2}):(\d{2})/.exec(d.timings[name] || "");
      if (m) { t[name] = pad(+m[1]) + ":" + m[2]; n++; }
    });
    if (n < PRAYER_NAMES.length) return null;
    var h = d.date.hijri, htxt = "";
    if (h && h.month) htxt = parseInt(h.day, 10) + " " + (h.month.en || "") + " " + h.year + " AH";
    return { key: g, val: { t: t, h: htxt } };
  }

  function prayerParams() {
    return "latitude=" + CFG.lat + "&longitude=" + CFG.lon + "&method=" + CFG.method +
      "&timezonestring=" + encodeURIComponent(CFG.tz);
  }

  window.DashboardTodayFajr = function () {
    var d = new Date(), row = prayerDays[dmy(d)];
    return row && row.t && row.t.Fajr ? atTime(d, row.t.Fajr).getTime() : null;
  };
  function fetchMonth(y, m) {
    return getJSON("https://api.aladhan.com/v1/calendar/" + y + "/" + m + "?" + prayerParams()).then(function (r) {
      var out = {}, n = 0;
      (r && r.data || []).forEach(function (d) {
        var p = parseDay(d);
        if (p) { out[p.key] = p.val; n++; }
      });
      if (!n) throw new Error("bad calendar");
      return out;
    });
  }

  function fetchOneDay(d) {
    return getJSON("https://api.aladhan.com/v1/timings/" + dmy(d) + "?" + prayerParams()).then(function (r) {
      var p = parseDay(r && r.data && { timings: r.data.timings, date: r.data.date });
      if (!p) throw new Error("bad day");
      var o = {}; o[p.key] = p.val; return o;
    });
  }

  function fetchPrayer() {
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1;
    var ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
    var cur = fetchMonth(y, m).catch(function () {
      // fall back to just today + tomorrow if the monthly endpoint misbehaves
      var tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return Promise.all([fetchOneDay(now), fetchOneDay(tom)]).then(function (a) {
        var o = {}; Object.keys(a[0]).forEach(function (k) { o[k] = a[0][k]; });
        Object.keys(a[1]).forEach(function (k) { o[k] = a[1][k]; });
        return o;
      });
    });
    var next = fetchMonth(ny, nm).catch(function () { return {}; });
    return Promise.all([cur, next]).then(function (res) {
      [res[0], res[1]].forEach(function (mo) {
        Object.keys(mo).forEach(function (k) { prayerDays[k] = mo[k]; });
      });
      prunePrayerDays();
      store("pdays", prayerDays);
      buildPrayer();
    });
  }

  function atTime(base, str) {
    var m = /(\d{1,2}):(\d{2})/.exec(str);
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), +m[1], +m[2], 0);
  }
  function fmtHM(d) {
    var h = d.getHours(), ap = "";
    if (CFG.h12) { ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; }
    return (CFG.h12 ? h : pad(h)) + ":" + pad(d.getMinutes()) + (ap ? '<span class="ap">' + ap + "</span>" : "");
  }

  function buildPrayer() {
    if (!CFG.prayer) return;
    var now = new Date();
    var day = prayerDays[dmy(now)];
    $("hijri").textContent = day ? day.h : "";
    var box = $("prayers");
    box.innerHTML = "";
    prayerEls = [];
    PRAYER_NAMES.forEach(function (name) {
      var tstr = day && day.t[name];
      var t = tstr ? atTime(now, tstr) : null;
      var el = document.createElement("div");
      el.className = "pr";
      el.innerHTML = '<div class="b"></div><div class="n">' + name + '</div><div class="t">' +
        (t ? fmtHM(t) : "--:--") + '</div><div class="c"></div>';
      box.appendChild(el);
      prayerEls.push({
        el: el, name: name, time: t,
        c: el.querySelector(".c"), b: el.querySelector(".b"),
        alertable: ALERTABLE.indexOf(name) >= 0
      });
    });
    renderBells();
    tickPrayer();
  }

  function tickPrayer() {
    if (!CFG.prayer || !prayerEls.length) return;
    var now = new Date(), nextIdx = -1, nextTime = null, i;
    for (i = 0; i < prayerEls.length; i++) {
      var pt = prayerEls[i].time;
      if (pt && pt > now) { nextIdx = i; nextTime = pt; break; }
    }
    if (nextIdx === -1) {   // all done today -> tomorrow's Fajr, if we have it
      var tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      var td = prayerDays[dmy(tom)];
      if (td && td.t.Fajr) { nextIdx = 0; nextTime = atTime(tom, td.t.Fajr); }
    }
    nextInfo = nextIdx >= 0 ? { name: prayerEls[nextIdx].name, time: nextTime } : null;
    for (i = 0; i < prayerEls.length; i++) {
      var p = prayerEls[i];
      var cls = "pr";
      if (i === nextIdx) cls += " next";
      else if (p.time && p.time <= now) cls += " past";
      p.el.className = cls;
      if (i === nextIdx && nextTime) {
        var mins = Math.max(0, Math.round((nextTime - now) / 60000));
        p.c.textContent = "in " + (mins >= 60 ? Math.floor(mins / 60) + "h " : "") + (mins % 60) + "m";
      } else {
        p.c.textContent = "";
      }
    }
  }

  // ---------- themes: Boho switches itself to Dark Boho from Maghrib until sunrise ----------
  var THEMES = ["boho", "boho-light", "boho-dark", "midnight"];
  var themePref = THEMES.indexOf(q.theme) >= 0 ? q.theme : (load("theme") || "boho");
  if (THEMES.indexOf(themePref) < 0) themePref = "boho";
  var curTheme = "";

  function skyIsDark(now) {
    var day = prayerDays[dmy(now)];
    if (day && day.t.Maghrib && day.t.Sunrise) {
      return now >= atTime(now, day.t.Maghrib) || now < atTime(now, day.t.Sunrise);
    }
    return now.getHours() >= 18 || now.getHours() < 6;   // no prayer data yet: rough guess
  }
  function applyTheme() {
    if (typeof publishDashboardState === "function") setTimeout(function () { publishDashboardState(false); }, 0);
    var now = new Date();
    var t = themePref === "boho" ? (skyIsDark(now) ? "boho-dark" : "boho-light") : themePref;
    if (t === curTheme) return;
    curTheme = t;
    document.documentElement.setAttribute("data-theme", t);
    var w = load("weather");
    if (w) renderWeather(w);       // icons differ between Midnight and Boho
  }

  // ---------- adhan: settings, stored sound files, audio ----------
  var alerts = load("alerts");
  if (!alerts) { alerts = {}; ALERTABLE.forEach(function (n) { alerts[n] = true; }); }

  var fired = load("fired") || {};
  (function () {            // keep only today's entries
    var today = dmy(new Date());
    Object.keys(fired).forEach(function (k) { if (k.indexOf(today) !== 0) delete fired[k]; });
  })();

  function alertCount() {
    var n = 0;
    ALERTABLE.forEach(function (k) { if (alerts[k]) n++; });
    return n;
  }
  function renderBells() {
    prayerEls.forEach(function (p) {
      if (!p.alertable) { p.b.textContent = ""; return; }
      p.b.textContent = alerts[p.name] ? "🔔" : "🔕";
      p.b.style.opacity = alerts[p.name] ? "1" : "0.5";
    });
  }

  // tiny IndexedDB wrapper for the adhan files chosen on the iPad
  function idb() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open("dash", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }
  function idbReq(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = fn(db.transaction("files", mode).objectStore("files"));
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }
  function idbGet(k) { return idbReq("readonly", function (s) { return s.get(k); }); }
  function idbPut(k, v) { return idbReq("readwrite", function (s) { return s.put(v, k); }); }
  function idbDel(k) { return idbReq("readwrite", function (s) { return s.delete(k); }); }

  var sounds = { main: null, fajr: null };   // { url, name, src: "device" | "site" }

  function setSound(slot, s) {
    var old = sounds[slot];
    if (old && old.url) { try { URL.revokeObjectURL(old.url); } catch (e) {} }
    sounds[slot] = s;
  }

  // device file first, then adhan.mp3 / adhan-fajr.mp3 from the site (cached offline by the service worker)
  function loadSlot(slot) {
    return idbGet(slot).then(function (rec) {
      if (rec && rec.buf) {
        return { url: URL.createObjectURL(new Blob([rec.buf], { type: rec.type || "audio/mpeg" })), name: rec.name, src: "device" };
      }
      return null;
    }).catch(function () { return null; }).then(function (dev) {
      if (dev) return dev;
      var file = slot === "fajr" ? "adhan-fajr.mp3" : "adhan.mp3";
      return fetch(file).then(function (r) {
        if (!r.ok) throw new Error("none");
        return r.blob();
      }).then(function (b) {
        if (b.size < 10000) throw new Error("not audio");
        return { url: URL.createObjectURL(b), name: file, src: "site" };
      }).catch(function () { return null; });
    }).then(function (s) { setSound(slot, s); });
  }
  function loadSounds() {
    return Promise.all([loadSlot("main"), loadSlot("fajr")]).then(function () { updateChip(); });
  }
  function soundFor(name) {
    return name === "Fajr" ? (sounds.fajr || sounds.main) : sounds.main;
  }

  function mimeFor(file) {
    var ext = (file.name.split(".").pop() || "").toLowerCase();
    var m = { mp3: "audio/mpeg", mpga: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav", caf: "audio/x-caf", ogg: "audio/ogg" }[ext];
    return m || (file.type === "audio/mp3" ? "audio/mpeg" : file.type) || "audio/mpeg";
  }

  // one shared <audio> element: iOS only lets timers start sound on an element a tap has already started
  var audio = new Audio();
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  var unlocked = false;

  function silentWavUrl() {
    var n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf), i;
    function s(o, str) { for (var k = 0; k < str.length; k++) v.setUint8(o + k, str.charCodeAt(k)); }
    s(0, "RIFF"); v.setUint32(4, 36 + n, true); s(8, "WAVE"); s(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    s(36, "data"); v.setUint32(40, n, true);
    for (i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  var silentUrl = null;
  var chime = new Audio(), chimeUrl = null, nUnread = 0;
  function unlockAudio() {
    if (unlocked) return;
    try {
      if (!silentUrl) silentUrl = silentWavUrl();
      audio.src = silentUrl;
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { unlocked = true; updateChip(); }, function () {});
      }
      try { chime.src = silentUrl; var p2 = chime.play(); if (p2 && p2.catch) p2.catch(function () {}); } catch (e2) {}
      try { if (!R.active) { ra.src = silentUrl; var p4x = ra.play(); if (p4x && p4x.catch) p4x.catch(function () {}); } } catch (e4) {}
      try { if (!Q.active) { qa.src = silentUrl; var p3x = qa.play(); if (p3x && p3x.catch) p3x.catch(function () {}); } } catch (e3) {}
    } catch (e) {}
  }
  function firstTap() {
    if (unlocked) {
      document.removeEventListener("touchend", firstTap, true);
      document.removeEventListener("click", firstTap, true);
      return;
    }
    unlockAudio();
  }
  document.addEventListener("touchend", firstTap, true);
  document.addEventListener("click", firstTap, true);

  // ---------- adhan alert overlay ----------
  var alertMode = "stop";    // "stop" | "play" | "close"
  var alertTimer = null;

  function showAlert(title, sub, btn, mode) {
    clearTimeout(alertTimer);
    $("aName").textContent = title;
    $("aSub").textContent = sub;
    $("aBtn").textContent = btn;
    alertMode = mode;
    $("alert").hidden = false;
  }
  function hideAlert() {
    clearTimeout(alertTimer); $("alert").hidden = true;
    if (R && R.resumeAfter) { R.resumeAfter = false; rPlay(); }
    if (Q && Q.resumeAfter) { Q.resumeAfter = false; qPlay(); }
  }
  function stopAdhan() {
    try { audio.pause(); } catch (e) {}
    hideAlert();
    updateChip();
  }

  function playAdhan(name, isTest) {
    var s = soundFor(name);
    var title = isTest ? "Adhan test" : name;
    var sub = isTest ? (name === "Fajr" ? "Fajr adhan" : "Main adhan") : "It is time for " + name + " · " + hhmm(new Date());
    if (!s) {
      if (!isTest) diag("adhan unavailable", name + " (no sound configured)");
      showAlert(title, "No adhan sound is set. Open the Adhan settings to choose one.", "Close", "close");
      alertTimer = setTimeout(hideAlert, 60000);
      return;
    }
    if (window.DashboardAzkar && window.DashboardAzkar.isPlaying()) window.DashboardAzkar.stop();
    if (R && R.playing) { R.resumeAfter = true; R.want = false; try { ra.pause(); } catch (e00) {} R.playing = false; rUI(); }
    if (Q && Q.playing) { Q.resumeAfter = true; try { qa.pause(); } catch (e0) {} Q.playing = false; qUI(); }
    showAlert(title, sub, "Stop", "stop");
    try {
      audio.loop = false;
      audio.src = s.url;
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { unlocked = true; if (!isTest) diag("adhan playing", name); updateChip(); }, function () {
          if (!isTest) diag("adhan blocked", name + " (tap required)");
          // blocked (no tap since launch): ask for one
          showAlert(title, sub + " – tap to play", "▶ Play adhan", "play");
        });
      }
    } catch (e) {
      if (!isTest) diag("adhan error", name);
      showAlert(title, "Couldn't play the sound", "Close", "close");
    }
  }

  audio.addEventListener("ended", function () {
    if (!$("alert").hidden && alertMode === "stop") alertTimer = setTimeout(hideAlert, 4000);
    updateChip();
  });
  audio.addEventListener("error", function () {
    if (!$("alert").hidden && audio.src && audio.src !== silentUrl) {
      diag("adhan audio error", $("aName").textContent);
      showAlert($("aName").textContent, "This sound file couldn't be played. Try a different file.", "Close", "close");
    }
  });
  $("aBtn").addEventListener("click", function () {
    if (alertMode === "play") {
      var p = audio.play();
      alertMode = "stop"; $("aBtn").textContent = "Stop";
      if (p && p.then) p.then(function () { unlocked = true; updateChip(); }, function () {
        $("aSub").textContent = "Still blocked – check the iPad volume";
        alertMode = "close"; $("aBtn").textContent = "Close";
      });
    } else {
      stopAdhan();
    }
  });

  function checkAdhan(now) {
    if (!prayerEls.length) return;
    prayerEls.forEach(function (p) {
      if (!p.alertable || !alerts[p.name] || !p.time) return;
      var diff = now - p.time;
      if (diff < 0 || diff > ADHAN_WINDOW_MS) return;
      var key = dmy(now) + ":" + p.name;
      if (fired[key]) return;
      fired[key] = 1;
      store("fired", fired);
      diag("adhan attempted", p.name);
      playAdhan(p.name, false);
    });
  }

  // ---------- corner chip + settings panel ----------
  function updateChip() {
    var chip = $("chip"), txt, warn = false;
    if (!CFG.prayer) { chip.hidden = true; if (typeof positionMini === "function") positionMini(); return; }
    chip.hidden = false;
    if (updateReady) { txt = "🔄 Update ready – tap here"; warn = true; }
    else if (!sounds.main && !sounds.fajr) { txt = "⚠️ Adhan: choose a sound"; warn = true; }
    else if (!unlocked) { txt = "🔇 Tap once to enable adhan sound"; warn = true; }
    else if (!alertCount()) { txt = "🔕 Adhan off"; }
    else { txt = "🔔 Adhan on · " + alertCount() + " of 5"; }
    if (!warn) {      // sound is chosen and enabled: just a small settings icon (the details are in the title and the settings)
      chip.className = "chip icon";
      chip.innerHTML = ICON.gear + (nUnread ? '<span class="bd">' + nUnread + "</span>" : "");
      chip.title = txt + (nUnread ? " · " + nUnread + " unread" : "");
      chip.setAttribute("aria-label", "Settings. " + chip.title);
    } else {
      if (nUnread) txt += " · ✉ " + nUnread;
      chip.textContent = txt; chip.title = ""; chip.removeAttribute("aria-label");
      chip.className = "chip warn";
    }
    if (typeof positionMini === "function") positionMini();
  }

    function panelMsg(m) { var e = $("pmsg"); if (e) e.textContent = m || ""; }

  function soundRow(slot, label, hint) {
    var s = sounds[slot];
    var nm = s ? esc(s.name) + (s.src === "site" ? " (from the site)" : "") : "None";
    return '<div class="srow sound-row"><div class="sl"><b>' + label + "</b><small>" + hint + "</small><em>" + nm + "</em></div>" +
      '<div class="sb"><label class="btn filebtn">Choose file<input type="file" class="fin" data-s="' + slot + '"></label>' +
      (s && s.src === "device" ? '<button class="btn ghost" type="button" data-a="clear" data-s="' + slot + '">Clear</button>' : "") +
      "</div></div>";
  }

  function renderPanel() {
    var h = '<div class="ph"><span>Settings</span><button class="x" type="button" data-a="close" aria-label="Close"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="pm" id="pmsg"></div>';
    h += '<div class="sec" style="margin-top:0">Play the adhan for</div><div class="pills">';
    ALERTABLE.forEach(function (n) {
      h += '<button class="sw' + (alerts[n] ? " on" : "") + '" type="button" data-a="tog" data-n="' + n + '">' +
        (alerts[n] ? "🔔 " : "🔕 ") + n + "</button>";
    });
    h += '</div>';
    if (updateReady) {
      h += '<div class="sec">Update</div><div class="srow"><div class="sl"><b>A new version is ready</b><small>The app reloads. Afterwards tap the screen once to re-enable adhan sound.</small></div>' +
        '<div class="sb"><button class="btn pri" type="button" data-a="apply">Update now</button></div></div>';
    }
    h += '<div class="sec">Theme</div><div class="pills">';
    [["boho", "Boho (auto day/night)"], ["boho-light", "Boho light"], ["boho-dark", "Dark boho"], ["midnight", "Midnight"]].forEach(function (th) {
      h += '<button class="sw' + (themePref === th[0] ? " on" : "") + '" type="button" data-a="theme" data-v="' + th[0] + '">' + th[1] + "</button>";
    });
    h += '</div><div class="sec">Night screen (' + pad(CFG.nightFrom) + ':00 – ' + pad(CFG.nightTo) + ':00)</div><div class="pills">';
    [["black", "Black + dim clock"], ["dim", "Dim only"], ["off", "Off"]].forEach(function (nm) {
      h += '<button class="sw' + (nightMode === nm[0] ? " on" : "") + '" type="button" data-a="night" data-v="' + nm[0] + '">' + nm[1] + "</button>";
    });
    h += '</div><div class="note">Black screen: only a dim clock and the next prayer show, and the layout drifts slightly to protect the screen. Tap it to see everything for a minute.</div>';
    h += '<div class="sec">System health</div>' + diagnosticsHTML();
    h += '<div class="sec">Settings backup</div>' + DashboardComponents.settingsRow('Export or restore preferences', 'Excludes remote secrets, notification topics, and audio files.', '<button class="btn" type="button" data-a="backup-export">Export</button><button class="btn" type="button" data-a="backup-import">Import</button>');
    h += '<div class="sec">Sound</div>' +
      soundRow("main", "Adhan", "Plays for every enabled prayer") +
      soundRow("fajr", "Fajr adhan (optional)", "If empty, Fajr uses the main adhan") +
      '<div class="btns"><button class="btn pri" type="button" data-a="test" data-n="Dhuhr">▶ Test adhan</button>' +
      (sounds.fajr ? '<button class="btn" type="button" data-a="test" data-n="Fajr">▶ Test Fajr adhan</button>' : "") +
      '<button class="btn ghost" type="button" data-a="close">Close</button></div>' +
      '<div class="sec">Notifications</div>' + notifHTML() +
      '<div class="sec">Maintenance</div>' + maintHTML() +
      '<div class="srow"><div class="sl"><b>Screen info</b><small>Shows the screen measurements. Useful if something doesn\'t fit.</small></div><div class="sb"><button class="btn" type="button" data-a="dbg">Show</button></div></div>' +
      '<div class="sec">Remote control</div>' + remoteHTML() +
      '<div class="note">Files you choose are stored only on this iPad. Sound plays through the iPad speaker at its current volume; ' +
      "if you hear nothing, check the volume and the side switch. After the app is reopened, tap the screen once to re-enable sound.</div>";
    $("card").innerHTML = h;
  }

  // User preferences only: never export secret keys, notification topics, or audio files.
  var BACKUP_KEYS = ["alerts", "theme", "nightmode", "weekly", "quran", "radio", "rcustom", "nmin"];
  function exportSettings() {
    var out = { format: "ipad-dashboard-settings", schema: 1, created: new Date().toISOString(), settings: {} };
    BACKUP_KEYS.forEach(function (key) { var v = load(key); if (v !== null) out.settings[key] = v; });
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "ipad-dashboard-settings-v18.0.json"; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function importSettings(file) {
    if (!file || file.size > 100000) { alert("Invalid or oversized settings file."); return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        if (obj.format !== "ipad-dashboard-settings" || obj.schema !== 1 || !obj.settings || typeof obj.settings !== "object" || Array.isArray(obj.settings)) throw Error("Unsupported format");
        var count = 0;
        BACKUP_KEYS.forEach(function (key) {
          if (!Object.prototype.hasOwnProperty.call(obj.settings, key)) return;
          var value = obj.settings[key];
          if (key === "theme" && THEMES.indexOf(value) < 0) return;
          if (key === "nightmode" && NIGHT_MODES.indexOf(value) < 0) return;
          if (key === "weekly" && typeof value !== "boolean") return;
          if (key === "nmin" && [1,3,4,5].indexOf(value) < 0) return;
          if (key === "alerts" && (!value || typeof value !== "object" || Array.isArray(value))) return;
          if (["quran","radio"].indexOf(key) >= 0 && (!value || typeof value !== "object" || Array.isArray(value))) return;
          if (key === "rcustom" && !Array.isArray(value)) return;
          store(key, value); count++;
        });
        alert("Imported " + count + " preference groups. The dashboard will reload. Tap the screen again to enable audio.");
        location.reload();
      } catch (e) { alert("Import failed: " + e.message); }
    };
    reader.readAsText(file);
  }

  function openPanel() { nUnread = 0; updateChip(); renderPanel(); $("panel").hidden = false; }
  function closePanel() { $("panel").hidden = true; }

  $("settingsFile").addEventListener("change", function () { importSettings(this.files[0]); this.value = ""; });
  $("chip").addEventListener("click", openPanel);
  $("panel").addEventListener("click", function (e) {
    var t = e.target;
    if (t === $("panel")) { closePanel(); return; }
    while (t && t !== $("panel") && !(t.getAttribute && t.getAttribute("data-a"))) t = t.parentNode;
    if (!t || t === $("panel")) return;
    var a = t.getAttribute("data-a"), n = t.getAttribute("data-n"), s = t.getAttribute("data-s");
    if (a === "backup-export") exportSettings();
    else if (a === "backup-import") $("settingsFile").click();
    else if (a === "close") closePanel();
    else if (a === "tog") {
      alerts[n] = !alerts[n]; store("alerts", alerts);
      renderPanel(); renderBells(); updateChip();
    } else if (a === "night") {
      nightMode = t.getAttribute("data-v"); store("nightmode", nightMode);
      wakeUntil = 0; renderClock(); renderPanel();
    } else if (a === "rcopy") {
      copyRemoteLink();
    } else if (a === "rshare") {
      try { navigator.share({ title: "Dashboard remote", url: remoteURL() }).catch(function () {}); } catch (e) {}
    } else if (a === "rtest") {
      remoteTest();
    } else if (a === "rgen") {
      remoteSecret = randomHex(32); setRemote(newTopic()); renderPanel();
    } else if (a === "roff") {
      setRemote(""); renderPanel();
    } else if (a === "apply") {
      location.reload();
    } else if (a === "nadd") {
      nAdd(($("ntin") || {}).value);
    } else if (a === "ndel") {
      nTopics.splice(+n, 1); store("ntopics", nTopics); nReset(); renderPanel();
    } else if (a === "nmin") {
      nMin = +t.getAttribute("data-v"); store("nmin", nMin); renderPanel();
    } else if (a === "nclear") {
      nLog = []; store("nlog", nLog); renderPanel();
    } else if (a === "ntest") {
      nHandle({ id: "t" + Date.now(), time: Math.floor(Date.now() / 1000), topic: "preview", title: "Preview", message: "This is how a notification looks.", priority: 3, tags: ["bell"] }, true);
      closePanel();
    } else if (a === "diagclear") {
      diagnostics.clear(); diagLog = []; store("diaglog", diagLog); renderPanel();
    } else if (a === "dbg") {
      closePanel(); showDebug();
    } else if (a === "weekly") {
      weekly = !weekly; store("weekly", weekly); renderPanel();
    } else if (a === "theme") {
      themePref = t.getAttribute("data-v"); store("theme", themePref);
      curTheme = ""; applyTheme(); renderPanel();
    } else if (a === "test") {
      closePanel(); playAdhan(n, true);
    } else if (a === "clear") {
      idbDel(s).catch(function () {}).then(function () { return loadSlot(s); }).then(function () { renderPanel(); updateChip(); });
    }
  });

  // file chosen with the real <input type="file"> inside each "Choose file" button
  $("panel").addEventListener("change", function (e) {
    var inp = e.target;
    if (!inp || inp.type !== "file") return;
    var f = inp.files && inp.files[0], slot = inp.getAttribute("data-s");
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { panelMsg("That file is too large (25 MB max)."); return; }
    if (f.size < 1000) { panelMsg("That file looks empty or isn't audio."); return; }
    panelMsg("Reading " + f.name + "…");
    var fr = new FileReader();
    fr.onload = function () {
      var type = mimeFor(f), url = URL.createObjectURL(new Blob([fr.result], { type: type })), t = new Audio(), done = false;
      function finish(ok) {
        if (done) return; done = true;
        try { URL.revokeObjectURL(url); } catch (x) {}
        if (!ok) { panelMsg("This iPad can't play “" + f.name + "”. Use an mp3, m4a or wav file."); return; }
        idbPut(slot, { buf: fr.result, type: type, name: f.name })
          .then(function () { return loadSlot(slot); })
          .then(function () { renderPanel(); updateChip(); panelMsg("Saved: " + f.name); })
          .catch(function () { panelMsg("Couldn't save that file on this iPad."); });
      }
      t.preload = "metadata";
      t.onloadedmetadata = function () { finish(true); };
      t.oncanplay = function () { finish(true); };
      t.onerror = function () { finish(false); };
      setTimeout(function () { finish(true); }, 4000);   // some builds never fire events for blob audio: save anyway
      t.src = url;
    };
    fr.onerror = function () { panelMsg("Couldn't read that file. If it is in iCloud, open the Files app and download it first."); };
    fr.readAsArrayBuffer(f);
  });

  // ---------- updates: look for a new version; reload by itself only when that can't cost the adhan sound ----------
  var updateReady = false, pageStart = Date.now();
  function checkUpdate() {
    if (navigator.onLine === false) return;
    fetch("js/dashboard/index.js?chk=" + Date.now(), { cache: "no-store" }).then(function (r) {
      return r.ok ? r.text() : "";
    }).then(function (txt) {
      var m = /var BUILD = "([^"]+)"/.exec(txt || "");
      if (m && m[1] !== BUILD && !updateReady) { updateReady = true; updateChip(); }
    }).catch(function () {});
  }
  function prayerSoon(d, mins) {
    var i;
    for (i = 0; i < prayerEls.length; i++) {
      var t = prayerEls[i].time;
      if (t && Math.abs(t - d) < mins * 60000) return true;
    }
    return false;
  }
  function maybeAutoRefresh(d) {
    if (!updateReady || d.getSeconds() !== 0) return;
    if (Date.now() - pageStart < 10 * 60 * 1000) return;
    var hr = d.getHours();
    var night = CFG.nightFrom > CFG.nightTo ? (hr >= CFG.nightFrom || hr < CFG.nightTo) : (hr >= CFG.nightFrom && hr < CFG.nightTo);
    if (!night || !$("alert").hidden || !$("panel").hidden || prayerSoon(d, 15)) return;
    // reloading drops iPadOS's "sound allowed" state, so only do it if adhan sound isn't armed (or no alerts are on)
    if (unlocked && alertCount()) return;
    location.reload();
  }
  setTimeout(checkUpdate, 20 * 1000);
  setInterval(checkUpdate, 6 * 60 * 60 * 1000);


  // Authenticated v16.1 relay commands. Secrets remain in the URL fragment and local storage.
  // Shared, tested crypto helpers; pairing and message wire format are unchanged.
  var hexBytes = DashboardShared.hexBytes;
  var randomHex = DashboardShared.randomHex;
  var hmac = DashboardShared.hmac;

  // ---------- remote control through ntfy.sh (free relay): phone page -> topic -> this iPad ----------
  var remoteSecret = load("remote_secret") || "";
  var commandNonces = load("command_nonces") || [];
  var remoteTopic = "", remoteES = null, remoteState = "off", remoteLast = "", remoteErr = "", lastMsgId = "", selfTest = null;
  var doneIds = load("doneids") || [];
  function newTopic() {
    var a = "abcdefghjkmnpqrstuvwxyz23456789", out = "", i, r;
    try { r = new Uint8Array(16); crypto.getRandomValues(r); } catch (e) { r = []; for (i = 0; i < 16; i++) r.push(Math.floor(Math.random() * 256)); }
    for (i = 0; i < 16; i++) { out += a.charAt(r[i] % a.length); if (i % 4 === 3 && i < 15) out += "-"; }
    return out;
  }
  var cleanTopic = DashboardShared.cleanTopic;
  var relayBackoffUntil = 0, relayFailures = 0;
  function noteRelayFailure(r) {
    relayFailures = Math.min(relayFailures + 1, 7);
    var retry = Number(r && r.headers && r.headers.get("Retry-After"));
    var delay = retry > 0 ? retry * 1000 : Math.min(30 * 60000, 30000 * Math.pow(2, relayFailures - 1));
    relayBackoffUntil = Date.now() + delay;
  }
  function remotePost(text) {
    if (Date.now() < relayBackoffUntil) return Promise.reject(new Error("Relay rate limited; waiting to retry"));
    if (!remoteTopic) return Promise.reject(new Error("off"));
    return fetch("https://ntfy.sh/" + remoteTopic, { method: "POST", body: text }).then(function (r) {
      if (r.status === 429) noteRelayFailure(r);
      if (!r.ok) throw new Error("HTTP " + r.status);
      relayFailures = 0; relayBackoffUntil = 0;
    });
  }
  function remoteSend(text) { remotePost(text).catch(function () {}); }
  // v17 status messages are signed separately from commands. No credentials in payload.
  var stateSequence = 0, lastPublished = "", lastStateSend = 0, lastStateError = "", statusBusy = false;
  function dashboardState() {
    var qname = "", qcount = 0;
    if (Q.active && window.QDATA && QDATA.s[Q.sura - 1]) { qname = QDATA.s[Q.sura - 1][1]; qcount = QDATA.s[Q.sura - 1][2]; }
    var medium = Q.active ? "quran" : (R.active ? "radio" : "none");
    return DashboardStatusProjection.project({
      version: BUILD, theme: curTheme || themePref, screen: sleepForced ? "black" : (nightMode || "normal"),
      audioReady: unlocked, transport: remoteState, updated: Date.now(),
      quran: { active: Q.active, playing: Q.playing, loading: Q.loading, surah: Q.sura, name: qname,
        reciter: QREC[Q.rec][0], reciterIndex: Q.rec + 1, verse: Q.a, verseCount: qcount,
        elapsed: qa.currentTime, duration: qa.duration, sleepAt: Q.sleepAt || 0 },
      radio: { active: R.active, playing: R.playing, want: R.want, needTap: R.needTap,
        station: rCur().n, stationIndex: R.st + 1, sleepAt: R.sleepAt || 0,
        error: R.err || "", server: R.server ? "backup" : "primary" }
    });
  }
  // Read-only application projection for consumers; does not mutate audio engines.
  var applicationState = DashboardState.create({status: null});
  function syncApplicationProjection(snapshot) {
    applicationState.set({status: snapshot});
  }
  function publishDashboardState(force) {
    var state = dashboardState();
    syncApplicationProjection(state);
    if (!remoteTopic || !remoteSecret || !crypto.subtle) return;
    // updated timestamp changes each call; compare semantic fields instead
    state.updated = 0;
    if (state.quran) { state.quran.elapsed = 0; state.quran.duration = 0; state.quran.verse = 0; state.quran.loading = false; }
    var semantic = JSON.stringify(state); state.updated = Date.now();
    // Restore real playback timing in transmitted snapshot.
    if (state.quran) { state.quran.elapsed = Math.floor(qa.currentTime || 0); state.quran.duration = isFinite(qa.duration) ? Math.floor(qa.duration) : 0; }
    // Only publish when meaningful data changes, or a sparse heartbeat every 15 minutes (ntfy.sh free tier allows about 250 messages a day).
    // Progress/time changes are excluded to avoid hitting ntfy.sh free-tier quotas.
    if (Date.now() < relayBackoffUntil || statusBusy) return;
    if (!force && semantic === lastPublished && Date.now() - lastStateSend < 900000) return;   // idle heartbeat every 15 min
    if (!force && Date.now() - lastStateSend < 60000) return;                                  // at most one automatic update a minute
    statusBusy = true;
    var payload = "v17state|" + Date.now() + "|" + randomHex(16) + "|" + (++stateSequence) + "|" + encodeURIComponent(JSON.stringify(state));
    hmac(remoteSecret, payload).then(function (sig) { return remotePost(payload + "|" + sig); })
      .then(function () { lastPublished = semantic; lastStateSend = Date.now(); lastStateError = ""; },
        function (e) { lastStateError = String(e && e.message || e); })
      .then(function () { statusBusy = false; }, function () { statusBusy = false; });
  }
  setInterval(function () { publishDashboardState(false); }, 30000);
  setTimeout(function () { publishDashboardState(false); }, 7000);
  function remoteClose() { if (remoteES) { try { remoteES.close(); } catch (e) {} remoteES = null; } }
  function setRemote(t) {
    remoteTopic = cleanTopic(t);
    store("remote", remoteTopic);
    if (!remoteTopic) remoteSecret = "";
    else if (!remoteSecret) remoteSecret = randomHex(32);
    store("remote_secret", remoteSecret);
    remoteClose(); lastMsgId = ""; remoteLast = ""; remoteErr = ""; selfTest = null;
    remoteState = remoteTopic ? "connecting" : "off";
    if (remoteTopic) { remoteConnect(); setTimeout(remotePoll, 1500); }
  }

  // one place that handles every message, whether it came through the live stream or the polling fallback
  function handleRemoteMsg(m) {
    if (!m || (m.event && m.event !== "message") || !m.message) return;
    if (m.id) {
      if (doneIds.indexOf(m.id) >= 0) return;
      doneIds.push(m.id); if (doneIds.length > 40) doneIds.shift(); store("doneids", doneIds);
      lastMsgId = m.id;
    }
    if (m.time && Math.abs(Date.now() / 1000 - m.time) > 600) return;      // ignore anything old (generous: iPad clocks drift)
    var txt = String(m.message);
    if (selfTest && txt === "selftest " + selfTest.id) { selfTest.ok = true; return; }
    if (/^ack/i.test(txt) || /^selftest /.test(txt) || txt.indexOf("v17state|") === 0) return;
    if (txt.indexOf("v16.1|") !== 0 || !remoteSecret || !crypto.subtle) { remoteErr = "Unsigned command rejected"; setRState(); return; }
    var parts = txt.split("|");
    if (parts.length !== 5 || !/^\d{13}$/.test(parts[1]) || !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[4]) ||
        commandNonces.indexOf(parts[2]) >= 0) return;
    if (Math.abs(Date.now() - +parts[1]) > 600000) { remoteErr = "Command ignored: the phone and iPad clocks differ by about " + Math.round(Math.abs(Date.now() - +parts[1]) / 60000) + " min"; setRState(); return; }
    var message = parts.slice(0, 4).join("|");
    hmac(remoteSecret, message).then(function (signature) {
      if (signature !== parts[4] || commandNonces.indexOf(parts[2]) >= 0) return;
      commandNonces.push(parts[2]); if (commandNonces.length > 150) commandNonces.shift(); store("command_nonces", commandNonces);
      remoteLast = hhmm(new Date()); remoteErr = "";
      runCommand(parts[3]); setRState(); setTimeout(function () { publishDashboardState(true); }, 350);
    }).catch(function () { remoteErr = "Signature verification unavailable"; setRState(); });
  }
  function remoteConnect() {
    if (!remoteTopic || !window.EventSource) return;
    remoteClose();
    try {
      remoteES = new EventSource("https://ntfy.sh/" + remoteTopic + "/sse");
      remoteES.onopen = function () { remoteState = "on"; remoteErr = ""; setRState(); publishDashboardState(true); };
      remoteES.onerror = function () { remoteState = "retry"; setRState(); };
      remoteES.addEventListener("message", function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (x) { return; }
        handleRemoteMsg(m);
      });
    } catch (e) { remoteErr = String(e && e.message || e); }
  }
  // fallback: ask the relay for new messages every 12 s, in case the live stream is silent (iPadOS sometimes stalls it)
  function remotePoll() {
    if (!remoteTopic) return;
    var url = "https://ntfy.sh/" + remoteTopic + "/json?poll=1&since=" + encodeURIComponent(lastMsgId || "2m");
    if (remoteES && remoteES.readyState === 1) return;
    if (Date.now() < relayBackoffUntil) return;
    fetch(url).then(function (r) {
      if (r.status === 429) { noteRelayFailure(r); throw new Error("HTTP 429"); }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (t) {
      remoteErr = "";
      t.split("\n").forEach(function (l) { if (!l) return; var m; try { m = JSON.parse(l); } catch (x) { return; } handleRemoteMsg(m); });
      setRState();
    }).catch(function (e) { remoteErr = String(e && e.message || e); setRState(); });
  }
  setInterval(function () { if (remoteTopic && (!remoteES || remoteES.readyState === 2)) remoteConnect(); }, 60 * 1000);
  setInterval(remotePoll, 60 * 1000);

  function copyRemoteLink() {
    var url = remoteURL(), box = $("rtest");
    function say(t) { if ($("rtest")) $("rtest").textContent = t; }
    function fallback() {
      var el = $("rurl"), ok = false;
      try { el.focus(); el.select(); el.setSelectionRange(0, 9999); ok = document.execCommand("copy"); } catch (e) {}
      say(ok ? "✓ Link copied." : "Select the link in the box and choose Copy.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say("✓ Link copied."); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  function remoteTest() {
    var id = Math.random().toString(36).slice(2, 10), box = $("rtest");
    selfTest = { id: id, ok: false };
    if (box) box.textContent = "Testing…";
    remotePost("selftest " + id).then(function () {
      var n = 0, t = setInterval(function () {
        n++;
        if (selfTest && selfTest.ok) { clearInterval(t); if ($("rtest")) $("rtest").textContent = "✓ Works: sent a message and received it back."; }
        else if (n >= 16) { clearInterval(t); if ($("rtest")) $("rtest").textContent = "Sent, but it never came back. This network may be blocking ntfy.sh, or the stream is stalled. Try again in a minute."; }
        else if (n === 3 || n === 7 || n === 11) remotePoll();
      }, 1000);
    }, function (e) { if ($("rtest")) $("rtest").textContent = "Couldn't reach ntfy.sh (" + (e && e.message || e) + "). Check the iPad's internet connection."; });
  }

  function remoteLabel() {
    var t = remoteState === "on" ? "Connected" : (remoteState === "retry" ? "Reconnecting…" : (remoteState === "connecting" ? "Connecting…" : "Off"));
    if (remoteLast) t += " · last command " + remoteLast;
    if (remoteErr) t += " · " + remoteErr;
    if (Date.now() < relayBackoffUntil) t += " · ntfy.sh limit reached, sending paused for " + Math.max(1, Math.ceil((relayBackoffUntil - Date.now()) / 60000)) + " min";
    return t;
  }
  function setRState() { var e = $("rstate"); if (e) e.textContent = remoteLabel(); }
  function remoteURL() { var code = remoteTopic + "." + remoteSecret; try { return new URL("remote.html", location.href).href + "#" + code; } catch (e) { return "remote.html#" + code; } }
  function remoteHTML() {
    if (!remoteTopic) {
      return '<div class="srow"><div class="sl"><b>Control from your phone</b><small>Uses the free ntfy.sh relay. Needs internet on both devices.</small></div>' +
        '<div class="sb"><button class="btn pri" type="button" data-a="rgen">Turn on</button></div></div>';
    }
    return '<div class="srow"><div class="sl"><b>Remote is on</b><small id="rstate">' + esc(remoteLabel()) + '</small></div>' +
      '<div class="sb"><button class="btn" type="button" data-a="rtest">Test</button><button class="btn" type="button" data-a="rgen">New code</button><button class="btn ghost" type="button" data-a="roff">Turn off</button></div></div>' +
      '<div class="pm" id="rtest"></div>' +
      '<div class="note">On your phone open this address (tap the box to select it, or use Copy / Share):</div>' +
      '<div class="urlrow"><input class="urlbox" id="rurl" type="text" readonly onfocus="this.select()" onclick="this.select()" value="' + esc(remoteURL()) + '" aria-label="Remote control link">' +
      '<button class="btn pri" type="button" data-a="rcopy">Copy</button>' +
      (navigator.share ? '<button class="btn" type="button" data-a="rshare">Share</button>' : "") + '</div>' +
      '<div class="note">Keep this pairing link private. v16.1 signs commands and rejects unsigned messages. Re-pair the phone after upgrading.</div>';
  }

  function needsTapNote() { return unlocked ? "" : " (the iPad needs one tap first)"; }
  // commands: stop, test, theme <x>, night <black|dim|off>, sleep, wake, alert <prayer> <on|off>, refresh, reload, ping
  function runCommand(text) {
    var w = text.trim().toLowerCase().split(/\s+/), c = w[0], ack = "";
    if (c === "ack:" || /^ack/.test(c)) return;
    if (c === "stop") { stopAdhan(); ack = "adhan stopped"; }
    else if (c === "test") { playAdhan("Dhuhr", true); ack = "testing adhan"; }
    else if (c === "theme" && THEMES.indexOf(w[1]) >= 0) {
      themePref = w[1]; store("theme", themePref); curTheme = ""; applyTheme();
      if (!$("panel").hidden) renderPanel();
      ack = "theme " + w[1];
    } else if (c === "night" && NIGHT_MODES.indexOf(w[1]) >= 0) {
      nightMode = w[1]; store("nightmode", nightMode); wakeUntil = 0; renderClock();
      if (!$("panel").hidden) renderPanel();
      ack = "night screen: " + w[1];
    } else if (c === "sleep") { sleepForced = true; renderClock(); ack = "black screen on"; }
    else if (c === "wake") { sleepForced = false; wakeUntil = Date.now() + 30 * 60 * 1000; renderClock(); ack = "awake"; }
    else if (c === "alert" && w.length >= 3) {
      var nm = w[1].charAt(0).toUpperCase() + w[1].slice(1);
      if (ALERTABLE.indexOf(nm) >= 0 && (w[2] === "on" || w[2] === "off")) {
        alerts[nm] = w[2] === "on"; store("alerts", alerts);
        if (!$("panel").hidden) renderPanel();
        renderBells(); updateChip(); ack = nm + " alert " + w[2];
      }
    } else if (c === "quran") {
      var qc = w[1];
      if (qc === "play") { if (w[2] >= 1 && w[2] <= 114) qStartSura(+w[2]); else qPlay(); ack = "quran: play" + needsTapNote(); }
      else if (qc === "pause") { qPause(); ack = "quran paused"; }
      else if (qc === "stop") { qStop(); ack = "quran stopped"; }
      else if (qc === "next" || qc === "prev") { qLoadData(function () { if (qc === "next") qNextVerse(false); else qPrevVerse(); }); ack = "quran: " + qc + " verse"; }
      else if (qc === "reciter" && w[2] >= 1 && w[2] <= QREC.length) {
        var was = Q.playing || Q.needTap;
        Q.rec = +w[2] - 1; qPersist();
        if (Q.active && window.QDATA) qGoto(Q.sura, Q.a, was); else qPanelLive();
        ack = "quran reciter: " + QREC[Q.rec][0];
      }
      else if (qc === "surah" && w[2] >= 1 && w[2] <= 114) { qStartSura(+w[2]); ack = "quran: surah " + w[2] + needsTapNote(); }
      else if (qc === "sleep" && w[2] !== undefined) { qSleep(w[2] === "end" ? "end" : String(+w[2] || 0)); ack = "quran sleep timer: " + w[2]; }
    } else if (c === "azkar") {
      var ac = w[1], az = window.DashboardAzkar;
      if (!az) ack = "azkar unavailable";
      else if (ac === "play") { az.play(); ack = "azkar playing (may need a tap on the iPad)"; }
      else if (ac === "pause") { az.pause(); ack = "azkar paused"; }
      else if (ac === "stop") { az.stop(); ack = "azkar stopped"; }
      else if (ac === "open") { az.open(); ack = "azkar opened"; }
    } else if (c === "radio") {
      var rc = w[1], wo = text.trim().split(/\s+/);
      if (rc === "play") { if (w[2] >= 1 && w[2] <= rList().length) R.st = +w[2] - 1; rPlay(); ack = "radio: " + rList()[R.st].n + needsTapNote(); }
      else if (rc === "station" && w[2] >= 1 && w[2] <= rList().length) { rPlay(+w[2] - 1); ack = "radio: " + rList()[R.st].n + needsTapNote(); }
      else if (rc === "pause") { rPause(); ack = "radio paused"; }
      else if (rc === "stop") { rStop(); ack = "radio stopped"; }
      else if (rc === "sleep" && w[2] !== undefined) { rSleep(String(+w[2] || 0)); ack = "radio sleep timer: " + (+w[2] || "off"); }
      else if (rc === "add" && wo[2]) {
        var nm2 = wo.slice(3).join(" ") || "My station", r2 = rAdd(nm2, wo[2]);
        ack = r2 ? "radio: " + r2 : "radio: station added, playing" + needsTapNote();
        if (!r2) rPlay(rList().length - 1);
      }
    } else if (c === "refresh") { jobs.forEach(function (j) { j.run(); }); ack = "refreshing data"; }
    else if (c === "reload") { remoteSend("ack: reloading (tap the iPad once afterwards)"); setTimeout(function () { location.reload(); }, 800); return; }
    else if (c === "state") { ack = "state requested"; }
    else if (c === "ping") { ack = "online " + hhmm(new Date()) + " · sound " + (unlocked ? "ready" : "needs a tap") + " · " + BUILD; }
    if (ack) remoteSend("ack: " + ack);
    if (c === "state") publishDashboardState(true);
  }

  // ---------- notifications from ntfy.sh topics (for example the Pi's alerts), shown as banners ----------
  var nTopics = load("ntopics") || [], nMin = load("nmin") || 1, nLog = load("nlog") || [], nIds = load("nids") || [];
  var nES = null, nState = nTopics.length ? "connecting" : "off", nSince = 0, nErr = "", toastTimer = null, nMsg = "";
  var weekly = load("weekly") !== false;
  var TAGICON = { warning: "⚠️", rotating_light: "🚨", white_check_mark: "✅", heavy_check_mark: "✅", x: "❌", tada: "🎉", skull: "💀",
    inbox_tray: "📥", arrow_down: "⬇️", movie_camera: "🎬", clapper: "🎬", bell: "🔔", package: "📦", fire: "🔥", lock: "🔒", thermometer: "🌡️", electric_plug: "🔌" };
  function beepUrl() {
    var rate = 11025, n = Math.floor(rate * 0.5), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), i;
    function w(o, str) { for (var k = 0; k < str.length; k++) v.setUint8(o + k, str.charCodeAt(k)); }
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, n * 2, true);
    for (i = 0; i < n; i++) {
      var tt = i / rate, f = tt < 0.22 ? 880 : 1175, env = Math.max(0, 1 - ((tt % 0.25) / 0.25)) * 0.6;
      v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * f * tt) * env * 20000), true);
    }
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  function playChime() {
    if (!unlocked || !audio.paused) return;
    try { if (!chimeUrl) chimeUrl = beepUrl(); chime.src = chimeUrl; var p = chime.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function nIcon(e) {
    var i;
    for (i = 0; i < (e.tags || []).length; i++) if (TAGICON[e.tags[i]]) return TAGICON[e.tags[i]];
    return e.p >= 5 ? "🚨" : e.p >= 4 ? "❗" : "🔔";
  }
  function nToast(e) {
    var el = $("toast");
    el.className = "toast" + (e.p >= 4 ? " hi" : "");
    el.innerHTML = "<b>" + nIcon(e) + " " + esc(e.title || e.topic || "Notification") + "</b>" + (e.msg ? "<span>" + esc(e.msg) + "</span>" : "") +
      "<small>" + hhmm(new Date(e.t)) + (e.topic ? " · " + esc(e.topic) : "") + "</small>";
    el.hidden = false;
    clearTimeout(toastTimer);
    if (e.p < 4) toastTimer = setTimeout(function () { el.hidden = true; }, 20000);
  }
  $("toast").addEventListener("click", function () { $("toast").hidden = true; clearTimeout(toastTimer); nUnread = 0; updateChip(); });
  function nHandle(m, force) {
    if (!m || (m.event && m.event !== "message") || (!m.message && !m.title)) return;
    if (m.id) {
      if (nIds.indexOf(m.id) >= 0) return;
      nIds.push(m.id); if (nIds.length > 80) nIds.shift(); store("nids", nIds);
    }
    if (m.time && m.time > nSince) nSince = m.time;
    if (remoteTopic && m.topic === remoteTopic) return;
    var p = m.priority || 3;
    if (p < nMin && !force) return;
    var e = { t: (m.time || Math.floor(Date.now() / 1000)) * 1000, title: String(m.title || ""), msg: String(m.message || ""), p: p, tags: m.tags || [], topic: m.topic || "" };
    if (!force) { nLog.unshift(e); if (nLog.length > 20) nLog.length = 20; store("nlog", nLog); }
    var fresh = force || Date.now() - e.t < 180000;
    if (!fresh) return;
    nUnread++; updateChip();
    if (p >= 5 && $("alert").hidden) {
      wakeUntil = Date.now() + 60000; sleepForced = false; renderClock();
      showAlert(nIcon(e) + " " + (e.title || "Urgent notification"), e.msg, "Dismiss", "close");
      alertTimer = setTimeout(hideAlert, 10 * 60 * 1000);
      playChime();
    } else {
      if (p >= 4) { wakeUntil = Date.now() + 60000; renderClock(); playChime(); }
      nToast(e);
    }
  }
  function nClose() { if (nES) { try { nES.close(); } catch (e) {} nES = null; } }
  function nReset() { nClose(); nSince = 0; nErr = ""; nState = nTopics.length ? "connecting" : "off"; if (nTopics.length) { nConnect(); setTimeout(nPoll, 1500); } }
  function nConnect() {
    if (!nTopics.length || !window.EventSource) return;
    nClose();
    try {
      nES = new EventSource("https://ntfy.sh/" + nTopics.join(",") + "/sse");
      nES.onopen = function () { nState = "on"; nErr = ""; nStateUI(); };
      nES.onerror = function () { nState = "retry"; nStateUI(); };
      nES.addEventListener("message", function (ev) { var m; try { m = JSON.parse(ev.data); } catch (x) { return; } nHandle(m); });
    } catch (e) { nErr = String(e && e.message || e); }
  }
  function nPoll() {
    if (!nTopics.length) return;
    fetch("https://ntfy.sh/" + nTopics.join(",") + "/json?poll=1&since=" + (nSince ? nSince : "10m")).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (t) {
      nErr = "";
      t.split("\n").forEach(function (l) { if (!l) return; var m; try { m = JSON.parse(l); } catch (x) { return; } nHandle(m); });
      nStateUI();
    }).catch(function (e) { nErr = String(e && e.message || e); nStateUI(); });
  }
  setInterval(function () { if (nTopics.length && (!nES || nES.readyState === 2)) nConnect(); }, 60 * 1000);
  setInterval(nPoll, 15 * 1000);
  function nLabel() {
    var t = nState === "on" ? "Listening" : nState === "retry" ? "Reconnecting…" : nState === "connecting" ? "Connecting…" : "Off";
    if (nErr) t += " · " + nErr;
    return t;
  }
  function nStateUI() { var e = $("nstate"); if (e) e.textContent = nLabel(); }
  function nAdd(v) {
    var t = cleanTopic(String(v || "").trim());
    if (t.length < 4) { nMsg = "Enter the topic name your Pi publishes to (at least 4 characters)."; renderPanel(); return; }
    if (t === remoteTopic) { nMsg = "That is the remote-control code. Use your Pi's own topic."; renderPanel(); return; }
    if (nTopics.indexOf(t) < 0) nTopics.push(t);
    nMsg = ""; store("ntopics", nTopics); nReset(); renderPanel();
  }
  function notifHTML() {
    var h = '<div class="pm">' + esc(nMsg) + '</div>', i;
    h += '<div class="note">Shows messages from your ntfy.sh topics as a banner. Only enter a topic that is private to you: anyone who knows a topic name can read it.</div>';
    for (i = 0; i < nTopics.length; i++) {
      h += '<div class="srow"><div class="sl"><b>' + esc(nTopics[i]) + '</b>' + (i === 0 ? '<small id="nstate">' + esc(nLabel()) + '</small>' : '') + '</div>' +
        '<div class="sb"><button class="btn ghost" type="button" data-a="ndel" data-n="' + i + '">Remove</button></div></div>';
    }
    h += '<div class="urlrow"><input class="urlbox" id="ntin" type="text" placeholder="ntfy topic name" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="ntfy topic">' +
      '<button class="btn pri" type="button" data-a="nadd">Add</button></div>';
    h += '<div class="note">Show messages with priority:</div><div class="pills">';
    [[1, "All"], [3, "Normal and up"], [4, "High and up"], [5, "Urgent only"]].forEach(function (o) {
      h += '<button class="sw' + (nMin === o[0] ? " on" : "") + '" type="button" data-a="nmin" data-v="' + o[0] + '">' + o[1] + "</button>";
    });
    h += '</div><div class="note">High (4): the banner stays until tapped, with a chime. Urgent (5): full-screen alert that wakes the black screen. Chimes need the one-time tap after the app opens.</div>';
    h += '<div class="btns"><button class="btn" type="button" data-a="ntest">Preview banner</button>' + (nLog.length ? '<button class="btn ghost" type="button" data-a="nclear">Clear history</button>' : "") + '</div>';
    if (nLog.length) {
      h += '<div class="nlist">';
      nLog.slice(0, 10).forEach(function (e) {
        h += '<div class="nitem">' + nIcon(e) + " <b>" + esc(e.title || e.topic || "Notification") + "</b>" + (e.msg ? " – " + esc(e.msg) : "") +
          "<small>" + hhmm(new Date(e.t)) + (e.topic ? " · " + esc(e.topic) : "") + "</small></div>";
      });
      h += "</div>";
    }
    return h;
  }

  // ---------- weekly refresh: a fresh page every 7 days keeps an always-on Safari from slowing down ----------
  function maybeWeekly(d) {
    if (!weekly || d.getSeconds() !== 0) return;
    if (Date.now() - pageStart < 7 * 24 * 3600 * 1000) return;
    if (!$("alert").hidden || !$("panel").hidden || prayerSoon(d, 15) || (R && R.active && R.want) || (Q && Q.playing)) return;
    // Never sacrifice an enabled adhan to background maintenance.
    if (unlocked && alertCount()) return;
    var i, isha = null, ok;
    for (i = 0; i < prayerEls.length; i++) if (prayerEls[i].name === "Isha" && prayerEls[i].time) isha = prayerEls[i].time;
    // evening, after Isha when people are likely awake to give the one tap that re-enables adhan sound
    ok = isha ? (d - isha > 45 * 60000 && d - isha < 4 * 3600000) : (d.getHours() >= 22);
    if (!ok) return;
    store("reloadnote", Date.now());
    location.reload();
  }
  function maintHTML() {
    return '<div class="srow"><div class="sl"><b>Weekly refresh</b><small>Reloads the app once a week in the evening after Isha. Afterwards the iPad needs one tap to re-enable adhan sound' +
      (remoteTopic ? ", and your phone gets a reminder" : "") + '.</small></div>' +
      '<div class="sb"><button class="sw' + (weekly ? " on" : "") + '" type="button" data-a="weekly">' + (weekly ? "On" : "Off") + '</button></div></div>';
  }

