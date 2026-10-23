  // v19.9: the Quran/radio controls live in the weather arch (context.js). Set to true to bring the old bottom mini players back.
  var MINI_PLAYERS = false;
  var CX = { cur: null, queue: [], until: 0, verseKey: "", mode: "", nKey: "" };   // context-arch state (see context.js)
  var CX_NOTE_MS = 12000;
  // ---------- Quran player: verse-by-verse audio from everyayah.com, text bundled in quran-data.js ----------
  var ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    skipb: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
    skipf: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>',
    badge: '<svg viewBox="0 0 24 24" class="bd"><path d="M12.00 0.40 L12.30 0.45 L12.60 0.60 L12.88 0.81 L13.15 1.07 L13.41 1.32 L13.66 1.53 L13.92 1.66 L14.19 1.72 L14.48 1.69 L14.79 1.59 L15.12 1.46 L15.47 1.33 L15.81 1.24 L16.14 1.21 L16.44 1.28 L16.70 1.45 L16.92 1.69 L17.09 2.00 L17.25 2.34 L17.39 2.67 L17.54 2.96 L17.73 3.18 L17.95 3.34 L18.23 3.42 L18.56 3.45 L18.92 3.46 L19.29 3.47 L19.64 3.51 L19.95 3.62 L20.20 3.80 L20.38 4.05 L20.49 4.36 L20.53 4.71 L20.54 5.08 L20.55 5.44 L20.58 5.77 L20.66 6.05 L20.82 6.27 L21.04 6.46 L21.33 6.61 L21.66 6.75 L22.00 6.91 L22.31 7.08 L22.55 7.30 L22.72 7.56 L22.79 7.86 L22.76 8.19 L22.67 8.53 L22.54 8.88 L22.41 9.21 L22.31 9.52 L22.28 9.81 L22.34 10.08 L22.47 10.34 L22.68 10.59 L22.93 10.85 L23.19 11.12 L23.40 11.40 L23.55 11.70 L23.60 12.00 L23.55 12.30 L23.40 12.60 L23.19 12.88 L22.93 13.15 L22.68 13.41 L22.47 13.66 L22.34 13.92 L22.28 14.19 L22.31 14.48 L22.41 14.79 L22.54 15.12 L22.67 15.47 L22.76 15.81 L22.79 16.14 L22.72 16.44 L22.55 16.70 L22.31 16.92 L22.00 17.09 L21.66 17.25 L21.33 17.39 L21.04 17.54 L20.82 17.73 L20.66 17.95 L20.58 18.23 L20.55 18.56 L20.54 18.92 L20.53 19.29 L20.49 19.64 L20.38 19.95 L20.20 20.20 L19.95 20.38 L19.64 20.49 L19.29 20.53 L18.92 20.54 L18.56 20.55 L18.23 20.58 L17.95 20.66 L17.73 20.82 L17.54 21.04 L17.39 21.33 L17.25 21.66 L17.09 22.00 L16.92 22.31 L16.70 22.55 L16.44 22.72 L16.14 22.79 L15.81 22.76 L15.47 22.67 L15.12 22.54 L14.79 22.41 L14.48 22.31 L14.19 22.28 L13.92 22.34 L13.66 22.47 L13.41 22.68 L13.15 22.93 L12.88 23.19 L12.60 23.40 L12.30 23.55 L12.00 23.60 L11.70 23.55 L11.40 23.40 L11.12 23.19 L10.85 22.93 L10.59 22.68 L10.34 22.47 L10.08 22.34 L9.81 22.28 L9.52 22.31 L9.21 22.41 L8.88 22.54 L8.53 22.67 L8.19 22.76 L7.86 22.79 L7.56 22.72 L7.30 22.55 L7.08 22.31 L6.91 22.00 L6.75 21.66 L6.61 21.33 L6.46 21.04 L6.27 20.82 L6.05 20.66 L5.77 20.58 L5.44 20.55 L5.08 20.54 L4.71 20.53 L4.36 20.49 L4.05 20.38 L3.80 20.20 L3.62 19.95 L3.51 19.64 L3.47 19.29 L3.46 18.92 L3.45 18.56 L3.42 18.23 L3.34 17.95 L3.18 17.73 L2.96 17.54 L2.67 17.39 L2.34 17.25 L2.00 17.09 L1.69 16.92 L1.45 16.70 L1.28 16.44 L1.21 16.14 L1.24 15.81 L1.33 15.47 L1.46 15.12 L1.59 14.79 L1.69 14.48 L1.72 14.19 L1.66 13.92 L1.53 13.66 L1.32 13.41 L1.07 13.15 L0.81 12.88 L0.60 12.60 L0.45 12.30 L0.40 12.00 L0.45 11.70 L0.60 11.40 L0.81 11.12 L1.07 10.85 L1.32 10.59 L1.53 10.34 L1.66 10.08 L1.72 9.81 L1.69 9.52 L1.59 9.21 L1.46 8.88 L1.33 8.53 L1.24 8.19 L1.21 7.86 L1.28 7.56 L1.45 7.30 L1.69 7.08 L2.00 6.91 L2.34 6.75 L2.67 6.61 L2.96 6.46 L3.18 6.27 L3.34 6.05 L3.42 5.77 L3.45 5.44 L3.46 5.08 L3.47 4.71 L3.51 4.36 L3.62 4.05 L3.80 3.80 L4.05 3.62 L4.36 3.51 L4.71 3.47 L5.08 3.46 L5.44 3.45 L5.77 3.42 L6.05 3.34 L6.27 3.18 L6.46 2.96 L6.61 2.67 L6.75 2.34 L6.91 2.00 L7.08 1.69 L7.30 1.45 L7.56 1.28 L7.86 1.21 L8.19 1.24 L8.53 1.33 L8.88 1.46 L9.21 1.59 L9.52 1.69 L9.81 1.72 L10.08 1.66 L10.34 1.53 L10.59 1.32 L10.85 1.07 L11.12 0.81 L11.40 0.60 L11.70 0.45Z" fill="currentColor"/><circle cx="12" cy="12" r="9.3" fill="none" stroke="var(--card)" stroke-width="0.9"/><text x="12" y="10.02" text-anchor="middle" font-family="AmiriQuran" font-size="5" fill="var(--card)">القرآن</text><text x="12" y="16.02" text-anchor="middle" font-family="AmiriQuran" font-size="5" fill="var(--card)">الكريم</text></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2.5"/></svg>'
  };
  var QREC = DashboardCatalog.reciters;
  var QBASE = "https://everyayah.com/data/";
  var qa = new Audio(); qa.preload = "auto"; qa.setAttribute("playsinline", "");
  var qpre = new Audio(); qpre.preload = "auto";
  var qsv = load("quran") || {};
  var Q = { sura: qsv.sura >= 1 && qsv.sura <= 114 ? qsv.sura : 18, a: qsv.a, rec: qsv.rec >= 0 && qsv.rec < QREC.length ? qsv.rec : 0, verses: qsv.verses !== false,
    active: false, playing: false, needTap: false, err: "", sleepAt: 0, sleepEnd: false, sleepV: "0", resumeAfter: false, retry: 0, loading: false, dataErr: "",
    tm: null, tmDone: false, tmKey: "", seekV: null, seekT: null };
  function p3(n) { return ("00" + n).slice(-3); }
  function qHasBis(s) { return s !== 1 && s !== 9; }
  function qFirst(s) { return qHasBis(s) ? 0 : 1; }
  function qCount(s) { return QDATA.s[s - 1][2]; }
  function qText(s, a) { return a === 0 ? QDATA.v[0][0] : QDATA.v[s - 1][a - 1]; }
  function qUrl(s, a) { return QBASE + QREC[Q.rec][1] + "/" + (a === 0 ? "001001" : p3(s) + p3(a)) + ".mp3"; }
  function qStream() { return QREC[Q.rec].length > 2; }
  function qSurl(s) { return QREC[Q.rec][1] + p3(s) + ".mp3"; }
  function qSrcOk(src) {
    var i;
    if (!src) return false;
    if (src.indexOf(QBASE) === 0) return true;
    for (i = 0; i < QREC.length; i++) if (QREC[i].length > 2 && src.indexOf(QREC[i][1]) === 0) return true;
    return false;
  }
  function qNoVerse() { return qStream() && Q.tmDone && !Q.tm; }   // streamed without a timing file: no verse tracking
  function qPersist() { store("quran", { sura: Q.sura, a: Q.a, rec: Q.rec, verses: Q.verses }); }
  function qLoadData(cb) {
    if (window.QDATA) { cb(); return; }
    if (Q.loading) return;
    Q.loading = true; Q.dataErr = "";
    var sc = document.createElement("script");
    sc.src = "quran-data.js";
    sc.onload = function () { Q.loading = false; if (window.QDATA) { if (Q.a == null || Q.a < qFirst(Q.sura) || Q.a > qCount(Q.sura)) Q.a = qFirst(Q.sura); cb(); } };
    sc.onerror = function () { Q.loading = false; Q.dataErr = "Couldn't load the Quran text. Check the connection and try again."; qUI(); };
    document.head.appendChild(sc);
  }
  function qNextPos() {
    var s = Q.sura, a = Q.a + 1;
    if (a > qCount(s)) { if (s >= 114) return null; s++; a = qFirst(s); }
    return { s: s, a: a };
  }
  function qResume() {
    var p;
    try { p = qa.play(); } catch (e) {}
    if (p && p.then) p.then(function () { Q.needTap = false; qUI(); }, function () { Q.playing = false; Q.needTap = true; qUI(); });
  }
  function qLoadTimings(s) {
    var key = Q.rec + ":" + s, x;
    if (Q.tmKey === key) return;
    Q.tmKey = key; Q.tm = null; Q.tmDone = false;
    x = new XMLHttpRequest();
    x.open("GET", "timings/" + QREC[Q.rec][2] + "/" + p3(s) + ".json");
    x.onreadystatechange = function () {
      var d = null, n;
      if (x.readyState !== 4 || Q.tmKey !== key) return;
      if (x.status === 200) {
        try { d = JSON.parse(x.responseText); } catch (e) { d = null; }
        n = qCount(s) - qFirst(s) + 1;
        if (!(d && d.length === n)) d = null;
      }
      Q.tm = d; Q.tmDone = true;
      qApplySeek(); qUI();
    };
    try { x.send(); } catch (e) { Q.tmDone = true; }
  }
  function qApplySeek() {
    var t = null;
    if (!qStream() || qa.readyState < 1) return;
    if (Q.seekT != null) t = Q.seekT;
    else if (Q.seekV != null) {
      if (!Q.tmDone) return;
      if (Q.tm) t = Q.tm[Q.seekV - qFirst(Q.sura)];
      else if (Q.seekV === qFirst(Q.sura)) t = 0;
    } else return;
    Q.seekT = null; Q.seekV = null;
    if (t != null && isFinite(t)) { try { qa.currentTime = t; } catch (e) {} }
  }
  function qVerseAt(t) {
    var i = Q.tm.length - 1;
    while (i > 0 && Q.tm[i] > t + 0.2) i--;
    return qFirst(Q.sura) + i;
  }
  function qGotoStream(s, a, play) {
    var url = qSurl(s);
    qLoadTimings(s);
    Q.seekV = a; Q.seekT = null;
    if (qa.src !== url) { qa.src = url; try { qpre.removeAttribute("src"); } catch (e) {} } else qApplySeek();
    if (play !== false) qResume();
    qUI();
  }
  function qGoto(s, a, play) {
    if (R && R.active) rStop();
    Q.sura = s; Q.a = a; Q.err = ""; Q.retry = 0; Q.active = true; qPersist();
    if (qStream()) { qGotoStream(s, a, play); return; }
    qa.src = qUrl(s, a);
    var np = qNextPos(); if (np) qpre.src = qUrl(np.s, np.a);
    if (play !== false) qResume();
    qUI();
  }
  function qPlay() {
    if (window.DashboardAzkar && window.DashboardAzkar.isPlaying()) window.DashboardAzkar.stop();
    if (R && R.active) rStop();
    qLoadData(function () {
      Q.active = true;
      if (!qSrcOk(qa.src)) qGoto(Q.sura, Q.a, true); else qResume();
      qUI();
    });
  }
  function qPause() { try { qa.pause(); } catch (e) {} Q.playing = false; Q.resumeAfter = false; qUI(); }
  function qToggle() { if (Q.playing) qPause(); else qPlay(); }
  function qStop() { try { qa.pause(); qa.removeAttribute("src"); qa.load(); } catch (e) {} Q.playing = false; Q.needTap = false; Q.active = false; Q.sleepAt = 0; Q.sleepEnd = false; Q.sleepV = "0"; Q.resumeAfter = false; $("qread").hidden = true; qUI(); }
  function qNextVerse(auto) {
    var np = qNextPos();
    if (qStream() && !auto && np && np.s === Q.sura) {        // seek inside the surah file
      if (Q.tm) qGoto(np.s, np.a, Q.playing || Q.needTap); else { try { qa.currentTime = qa.currentTime + 15; } catch (e) {} }
      return;
    }
    if (!np) { qPause(); return; }
    if (auto && Q.sleepEnd && np.s !== Q.sura) { Q.sleepEnd = false; Q.sleepV = "0"; qPause(); qGoto(np.s, np.a, false); return; }
    qGoto(np.s, np.a, true);
  }
  function qPrevVerse() {
    if (qStream() && !Q.tm) { try { qa.currentTime = Math.max(0, qa.currentTime - 15); } catch (e) {} return; }
    if (qStream()) { if (Q.a === qFirst(Q.sura) ? qa.currentTime > 3 : qa.currentTime - Q.tm[Q.a - qFirst(Q.sura)] > 3) { qGoto(Q.sura, Q.a, Q.playing || Q.needTap); return; } }
    else if (qa.currentTime > 3) { try { qa.currentTime = 0; } catch (e) {} return; }
    var s = Q.sura, a = Q.a - 1;
    if (a < qFirst(s)) { if (s <= 1) a = qFirst(s); else { s--; a = qCount(s); } }
    qGoto(s, a, Q.playing || Q.needTap);
  }
  function qSkipSura(d) {
    var s = Q.sura + d; if (s < 1 || s > 114) return;
    qGoto(s, qFirst(s), Q.playing || Q.needTap);
  }
  function qStartSura(n, a) {
    qLoadData(function () {
      var f = qFirst(n); qGoto(n, a == null ? f : Math.max(f, Math.min(qCount(n), a)), true);
      if (!$("qpanel").hidden) qPanelFill();
    });
  }
  function qSleep(v) {
    Q.sleepAt = 0; Q.sleepEnd = false; Q.sleepV = String(v);
    if (v === "end") Q.sleepEnd = true; else if (+v > 0) Q.sleepAt = Date.now() + (+v) * 60000;
    if (!$("qpanel").hidden) qPanelFill();
  }
  function qOurs() { return Q.active && window.QDATA && qSrcOk(qa.src); }
  qa.addEventListener("playing", function () { if (!qOurs()) return; Q.playing = true; Q.needTap = false; Q.err = ""; Q.retry = 0; qUI(); });
  qa.addEventListener("pause", function () { if (qOurs() && !qa.ended) { Q.playing = false; qUI(); } });
  qa.addEventListener("ended", function () {
    var s;
    if (!qOurs()) return;
    if (!qStream()) { qNextVerse(true); return; }
    s = Q.sura + 1;
    if (s > 114) { qPause(); return; }
    if (Q.sleepEnd) { Q.sleepEnd = false; Q.sleepV = "0"; qGoto(s, qFirst(s), false); Q.playing = false; qUI(); return; }
    qGoto(s, qFirst(s), true);
  });
  qa.addEventListener("loadedmetadata", function () { if (qOurs()) qApplySeek(); });
  qa.addEventListener("timeupdate", function () {
    var a;
    if (!qOurs() || !qStream() || Q.seekV != null || Q.seekT != null) return;
    if (Q.tm) { a = qVerseAt(qa.currentTime); if (a !== Q.a) { Q.a = a; qPersist(); qUI(); return; } }
    qBars();
  });
  qa.addEventListener("error", function () {
    if (!qOurs()) return;
    Q.playing = false;
    if (Q.retry < 3) { Q.retry++; Q.err = "Connection problem – retrying…"; setTimeout(function () { if (Q.active && !Q.playing) { if (qStream()) { Q.seekT = qa.currentTime > 1 ? qa.currentTime : null; if (Q.seekT == null) Q.seekV = Q.a; qa.src = qSurl(Q.sura); } else qa.src = qUrl(Q.sura, Q.a); qResume(); } }, 4000); }
    else { Q.err = "Can't reach the audio. Check the internet connection, then tap play."; }
    qUI();
  });
  function qTick() {
    if (Q.sleepAt && Date.now() >= Q.sleepAt) { Q.sleepAt = 0; Q.sleepV = "0"; qPause(); }
  }
  function qBars() {
    var w = Math.round(qPos() * 100) + "%", e;
    if (!Q.active) return;
    if ((e = $("qmBar"))) e.style.width = w;
    if ((e = $("qpBar"))) e.style.width = w;
  }
  function qPos() {
    var f = qFirst(Q.sura), n = qCount(Q.sura);
    if (qStream() && qa.duration > 0 && isFinite(qa.duration)) return Math.min(1, qa.currentTime / qa.duration);
    return n - f <= 0 ? 1 : (Q.a - f + 1) / (n - f + 1);
  }
  function qVerseLabel() { return qNoVerse() ? "Streaming" : Q.a === 0 ? "Bismillah" : "Verse " + Q.a + " of " + qCount(Q.sura); }
  function positionMini() {
    var m = $("qmini"), rm = $("rmini"), c = $("corner"), st = $("status"), vw = window.innerWidth, fs = vw * 0.01, cr = c.getBoundingClientRect();
    if (m.hidden && rm.hidden) {      // keep the status text from running into the buttons on the left
      st.style.maxWidth = Math.max(60, Math.round(vw - cr.right - 5.2 * fs)) + "px";
      return;
    }
    st.style.maxWidth = "";
    var sr = st.getBoundingClientRect();
    var left = Math.round(cr.right + 1.2 * fs), right = Math.round(vw - sr.left + 1.2 * fs);
    if (!(right > 0 && right < vw / 2)) right = Math.round(vw * 0.16);
    m.style.left = left + "px"; m.style.right = right + "px";
    rm.style.left = left + "px"; rm.style.right = right + "px";
  }
  function qUI() {
    syncMediaProjection();
    if (typeof publishDashboardState === "function") publishDashboardState(false);
    var b = $("qbtn"), m = $("qmini");
    b.innerHTML = ICON.book; b.className = "qbtn" + (Q.active ? " on" : "");
    document.body.classList.toggle("qon", MINI_PLAYERS && !!(Q.active || (R && R.active)));
    updateStatus();
    if (!Q.active || !window.QDATA) { m.hidden = true; document.body.classList.remove("qv"); positionMini(); qPanelLive(); cxRender(); return; }
    m.hidden = !MINI_PLAYERS;
    document.body.classList.toggle("qv", MINI_PLAYERS && Q.verses && !qNoVerse());
    $("qmPlay").innerHTML = Q.playing ? ICON.pause : ICON.play;
    $("qmT").innerHTML = esc(QDATA.s[Q.sura - 1][1]) + ' <span class="qa">· ' + esc(QDATA.s[Q.sura - 1][0]) + "</span>";
    $("qmS").textContent = Q.err || (Q.needTap ? "Tap ▶ to start the sound" : QREC[Q.rec][0] + " · " + (qNoVerse() ? "streaming" : Q.a === 0 ? "Bismillah" : Q.a + "/" + qCount(Q.sura)));
    $("qmV").textContent = Q.verses && !qNoVerse() ? qText(Q.sura, Q.a) : "";
    $("qmBar").style.width = Math.round(qPos() * 100) + "%";
    positionMini(); qPanelLive(); qReadFill(); cxRender();
  }
  function qSleepLabel() {
    if (Q.sleepEnd) return "Stops at the end of the surah";
    if (Q.sleepAt) return "Stops in " + Math.max(1, Math.ceil((Q.sleepAt - Date.now()) / 60000)) + " min";
    return "";
  }
  function qPanelLive() {
    if ($("qpanel").hidden || !window.QDATA) return;
    var s = QDATA.s[Q.sura - 1], e;
    if ((e = $("qpAr"))) e.textContent = "سورة " + s[0];
    if ((e = $("qpEn"))) e.textContent = s[1] + " · Surah " + Q.sura;
    if ((e = $("qpSub"))) e.textContent = Q.err || (Q.needTap ? "Tap ▶ to start the sound" : QREC[Q.rec][0] + " · " + s[2] + " verses");
    if ((e = $("qpPlay"))) e.innerHTML = Q.playing ? ICON.pause : ICON.play;
    if ((e = $("qpBar"))) e.style.width = Math.round(qPos() * 100) + "%";
    if ((e = $("qpL"))) e.textContent = Q.active ? qVerseLabel() : "Not playing";
    if ((e = $("qpR"))) e.textContent = qSleepLabel();
    var rows = $("qcard").querySelectorAll("[data-a=qsura]"), i;
    for (i = 0; i < rows.length; i++) rows[i].className = (+rows[i].getAttribute("data-n") === Q.sura) ? "on" : "";
    rows = $("qcard").querySelectorAll("[data-a=qrec]");
    for (i = 0; i < rows.length; i++) rows[i].className = (+rows[i].getAttribute("data-n") === Q.rec) ? "on" : "";
    var pills = $("qcard").querySelectorAll("[data-a=qsleep]");
    for (i = 0; i < pills.length; i++) pills[i].className = "sw" + (pills[i].getAttribute("data-v") === Q.sleepV ? " on" : "");
  }
  function qPanelFill() {
    if (!window.QDATA) { $("qcard").innerHTML = '<div class="ph"><span>Quran</span><button class="x" type="button" data-a="qclose" aria-label="Close">' + ICON.close + '</button></div><div class="note">' + esc(Q.dataErr || "Loading…") + "</div>"; return; }
    var h = '<div class="ph"><span>Quran</span><button class="x" type="button" data-a="qclose" aria-label="Close">' + ICON.close + "</button></div>" +
      '<div class="qnow"><div class="qart qa">&#1587;</div><div class="qinfo"><div class="ar qa" id="qpAr"></div><b id="qpEn"></b><small id="qpSub"></small></div></div>' +
      '<div class="qprog" id="qpWrap" data-a="qseek"><div class="bar"><i id="qpBar"></i></div><div class="tm"><span id="qpL"></span><span id="qpR"></span></div></div>' +
      '<div class="qctl"><button class="c" type="button" data-a="qskipb" aria-label="Previous surah">' + ICON.skipb + '</button><button class="c" type="button" data-a="qprev" aria-label="Previous verse">' + ICON.prev + '</button>' +
      '<button class="c big" id="qpPlay" type="button" data-a="qtoggle" aria-label="Play or pause"></button>' +
      '<button class="c" type="button" data-a="qnext" aria-label="Next verse">' + ICON.next + '</button><button class="c" type="button" data-a="qskipf" aria-label="Next surah">' + ICON.skipf + "</button></div>" +
      '<div class="qtog"><div><b>Show verses in the mini player</b><small>Landscape only. The reading view always shows them.</small></div><button class="sw' + (Q.verses ? " on" : "") + '" type="button" data-a="qverses">' + (Q.verses ? "On" : "Off") + "</button></div>" +
      '<div class="btns" style="margin:0 0 1vmin"><button class="btn pri" type="button" data-a="qread">Open reading view</button><button class="btn" type="button" data-a="qstop">■ Stop &amp; close player</button></div>' +
      '<div class="sec" style="margin-top:1vmin">Sleep timer</div><div class="pills">';
    [["0", "Off"], ["15", "15 min"], ["30", "30 min"], ["60", "60 min"], ["end", "End of surah"]].forEach(function (o) { h += '<button class="sw" type="button" data-a="qsleep" data-v="' + o[0] + '">' + o[1] + "</button>"; });
    h += '</div><div class="qgrid"><div><div class="sec">Reciter</div><input class="qsearch qsearch-spacer" aria-hidden="true" tabindex="-1" type="text" readonly><div class="qlist">';
    QREC.forEach(function (r, i) { h += '<div data-a="qrec" data-n="' + i + '">' + esc(r[0]) + "</div>"; });
    h += '</div></div><div><div class="sec">Surah</div><input class="qsearch" id="qfind" type="text" placeholder="Search by name or number" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"><div class="qlist" id="qlist">';
    QDATA.s.forEach(function (r, i) { h += '<div data-a="qsura" data-n="' + (i + 1) + '" data-k="' + esc((i + 1) + " " + r[1].toLowerCase() + " " + r[0]) + '"><span>' + (i + 1) + " · " + esc(r[1]) + '</span><span class="ar qa">' + esc(r[0]) + "</span></div>"; });
    h += '</div></div></div><div class="note" style="margin-top:2vmin">Audio streams from everyayah.com, so it needs internet. It pauses by itself for the adhan and carries on afterwards. Quran text: Tanzil.net (CC BY-SA 4.0). Tap once after the app opens to allow sound.</div>' +
      '<div class="btns"><button class="btn ghost" type="button" data-a="qclose">Close</button></div>';
    $("qcard").innerHTML = h;
    qPanelLive();
    var cur = $("qlist").querySelector(".on"); if (cur) $("qlist").scrollTop = Math.max(0, cur.offsetTop - 60);
  }
  function qOpenPanel() { $("qpanel").hidden = false; qPanelFill(); qLoadData(function () { qPanelFill(); qUI(); }); }
  function qReadFill() {
    var r = $("qread"); if (r.hidden || !window.QDATA) return;
    var cur = qText(Q.sura, Q.a), len = cur.length, fs = len < 60 ? 8.6 : len < 120 ? 7 : len < 220 ? 5.6 : len < 380 ? 4.4 : 3.5;
    var np = qNextPos(), pa = Q.a - 1, pv = "";
    if (pa >= qFirst(Q.sura)) pv = qText(Q.sura, pa);
    var nv = np && np.s === Q.sura ? qText(np.s, np.a) : "";
    var s = QDATA.s[Q.sura - 1];
    $("qrT").innerHTML = "<b>" + esc(s[1]) + "</b> · " + esc(QREC[Q.rec][0]);
    $("qrPrev").textContent = pv; $("qrCur").textContent = cur; $("qrCur").style.fontSize = fs + "vmin"; $("qrNext").textContent = nv;
    $("qrRef").textContent = (s[1] + " · " + (Q.a === 0 ? "Bismillah" : Q.sura + ":" + Q.a)).toUpperCase();
    $("qrBar").style.width = Math.round(qPos() * 100) + "%";
    $("qrPlay").innerHTML = Q.playing ? ICON.pause : ICON.play;
  }
  function qOpenRead() {
    qLoadData(function () {
      if (!Q.active) { Q.active = true; qGoto(Q.sura, Q.a, false); }
      var r = $("qread");
      r.innerHTML = '<div class="top"><span id="qrT"></span><button class="x" type="button" data-a="qrclose" aria-label="Close">' + ICON.close + "</button></div>" +
        '<div class="ctx qa" id="qrPrev"></div><div class="cur qa" id="qrCur"></div><div class="ctx qa" id="qrNext"></div><div class="ref" id="qrRef"></div>' +
        '<div class="dock"><div class="bar"><i id="qrBar"></i></div><div class="qctl"><button class="c" type="button" data-a="qprev" aria-label="Previous verse">' + ICON.prev + "</button>" +
        '<button class="c big" id="qrPlay" type="button" data-a="qtoggle" aria-label="Play or pause"></button><button class="c" type="button" data-a="qnext" aria-label="Next verse">' + ICON.next + "</button></div></div>";
      r.hidden = false; $("qpanel").hidden = true; qReadFill();
    });
  }
  function qClick(e) {
    var t = e.target;
    while (t && t.getAttribute && !t.getAttribute("data-a")) t = t.parentNode;
    if (!t || !t.getAttribute) return;
    var a = t.getAttribute("data-a"), n = +t.getAttribute("data-n");
    if (a === "qstop") { qStop(); $("qpanel").hidden = true; }
    else if (a === "qclose") $("qpanel").hidden = true;
    else if (a === "qrclose") { $("qread").hidden = true; }
    else if (a === "qtoggle") qToggle();
    else if (a === "qprev") qPrevVerse();
    else if (a === "qnext") qNextVerse(false);
    else if (a === "qskipb") qSkipSura(-1);
    else if (a === "qskipf") qSkipSura(1);
    else if (a === "qsura") qStartSura(n);
    else if (a === "qrec") { var was = Q.playing || Q.needTap; Q.rec = n; qPersist(); if (Q.active) qGoto(Q.sura, Q.a, was); else qPanelLive(); }
    else if (a === "qsleep") qSleep(t.getAttribute("data-v"));
    else if (a === "qverses") { Q.verses = !Q.verses; qPersist(); qPanelFill(); qUI(); }
    else if (a === "qread") qOpenRead();
    else if (a === "qseek") {
      var r = t.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), fi = qFirst(Q.sura), c = qCount(Q.sura);
      qGoto(Q.sura, fi + Math.round(f * (c - fi)), Q.playing || Q.needTap);
    }
  }
  $("qpanel").addEventListener("click", function (e) { if (e.target === $("qpanel")) { $("qpanel").hidden = true; return; } qClick(e); });
  $("qread").addEventListener("click", qClick);
  $("qpanel").addEventListener("input", function (e) {
    if (!e.target || e.target.id !== "qfind") return;
    var v = e.target.value.toLowerCase().replace(/^\s+|\s+$/g, ""), rows = $("qlist").children, i;
    for (i = 0; i < rows.length; i++) rows[i].hidden = !!v && rows[i].getAttribute("data-k").toLowerCase().indexOf(v) < 0;
  });
  $("qbtn").addEventListener("click", qOpenPanel);
  $("qmStop").addEventListener("click", function (e) { e.stopPropagation(); qStop(); });
  $("qmPlay").addEventListener("click", function (e) { e.stopPropagation(); qToggle(); });
  $("qmOpen").addEventListener("click", qOpenPanel);
  $("qmV").addEventListener("click", qOpenRead);
  window.addEventListener("resize", positionMini);
  window.addEventListener("orientationchange", function () { setTimeout(positionMini, 300); });


