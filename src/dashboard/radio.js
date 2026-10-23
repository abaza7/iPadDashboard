  // ---------- Lofi radio: live internet streams (HTTPS only), plus your own stations ----------
  var RST = DashboardCatalog.stations;
  var rcust = load("rcustom") || [];
  var rsv = load("radio") || {};
  var ra = new Audio(); ra.preload = "none"; ra.setAttribute("playsinline", "");
  var R = { active: false, playing: false, want: false, needTap: false, err: "", st: rsv.st >= 0 ? rsv.st : 0, sleepAt: 0, sleepV: "0", resumeAfter: false,
    tries: 0, server: 0, switching: false, timer: 0, lastT: -1, lastAt: 0, bad: {}, form: false };
  function rList() { return RST.concat(rcust); }
  if (R.st >= rList().length) R.st = 0;
  function rCur() { var l = rList(); return l[R.st] || l[0]; }
  function rPersist() { store("radio", { st: R.st }); }
  function rAdd(name, url) {
    name = String(name || "").replace(/^\s+|\s+$/g, "");
    if (!/^https:\/\/[^\s]+$/i.test(url || "")) return "link must start with https://";
    if (!name) return "give the station a name";
    if (rcust.length >= 10) return "too many own stations (max 10)";
    rcust.push({ n: name.slice(0, 40), s: name.slice(0, 40), d: "Your station", u: url, c: 1 });
    store("rcustom", rcust);
    return "";
  }
  function rClearTimer() { if (R.timer) { clearTimeout(R.timer); R.timer = 0; } }
  function rStart() {            // (re)join the live stream
    var st = rCur(), p;
    R.lastT = -1; R.lastAt = Date.now();
    try {
      R.switching = true;
      ra.src = R.server && st.alt ? st.alt : st.u;
      p = ra.play();
      if (p && p.catch) p.catch(function (e) {
        if (e && e.name === "NotAllowedError") { R.needTap = true; R.playing = false; R.err = "Tap ▶ to start the sound"; rUI(); }
      });
    } catch (e2) { R.err = "Can't play this station"; }
    setTimeout(function () { R.switching = false; }, 500);
  }
  function rPlay(i) {
    if (window.DashboardAzkar && window.DashboardAzkar.isPlaying()) window.DashboardAzkar.stop();
    if (Q && Q.active) qStop();
    if (i != null) { R.st = i; rPersist(); }
    R.active = true; R.want = true; R.needTap = false; R.err = ""; R.tries = 0; R.server = 0; R.bad[R.st] = false; R.resumeAfter = false; rClearTimer();
    rStart(); rUI();
  }
  function rPause() { R.want = false; R.resumeAfter = false; rClearTimer(); try { ra.pause(); } catch (e) {} R.playing = false; R.err = ""; R.needTap = false; rUI(); }
  function rStop() {
    R.want = false; R.active = false; R.playing = false; R.sleepAt = 0; R.sleepV = "0"; R.resumeAfter = false; R.err = ""; R.needTap = false; rClearTimer();
    try { ra.pause(); ra.removeAttribute("src"); ra.load(); } catch (e) {}
    rUI();
  }
  window.DashboardStopRadio = rStop;
  function rToggle() { if (R.playing || (R.want && !R.needTap)) rPause(); else rPlay(); }
  function rSleep(v) {
    R.sleepAt = 0; R.sleepV = String(v);
    if (+v > 0) R.sleepAt = Date.now() + (+v) * 60000; else R.sleepV = "0";
    rPanelLive();
  }
  function rReconnect() {
    if (!R.active || !R.want || R.needTap) return;
    R.playing = false; rClearTimer();
    R.tries++;
    if (rCur().alt && R.server === 0) { R.server = 1; R.err = "Trying backup stream…"; R.timer = setTimeout(function () { R.timer = 0; if (R.active && R.want) rStart(); }, 1000); rUI(); return; }
    if (R.tries >= 4) R.bad[R.st] = true;
    R.err = R.tries >= 4 ? "Not responding – still trying every minute" : "Connection lost – reconnecting…";
    R.timer = setTimeout(function () { R.timer = 0; if (R.active && R.want && !R.playing) { rStart(); rUI(); } }, R.tries <= 3 ? 4000 : 60000);
    rUI();
  }
  ra.addEventListener("playing", function () {
    if (!R.active) return;
    R.playing = true; R.needTap = false; R.err = ""; R.tries = 0; R.bad[R.st] = false; R.lastAt = Date.now(); rClearTimer(); rUI();
  });
  ra.addEventListener("pause", function () {
    if (!R.active || !R.want || R.switching) return;
    R.playing = false; R.want = false; rUI();      // paused from outside (call, lock-screen control)
  });
  ra.addEventListener("error", function () { if (R.active && R.want) rReconnect(); });
  ra.addEventListener("ended", function () { if (R.active && R.want) rReconnect(); });
  function rTick() {
    if (!R.active) return;
    var now = Date.now();
    if (R.sleepAt && now >= R.sleepAt) { R.sleepAt = 0; R.sleepV = "0"; rPause(); return; }
    if (R.playing && R.want) {       // watchdog: a live stream whose clock stands still has dropped
      if (ra.currentTime !== R.lastT) { R.lastT = ra.currentTime; R.lastAt = now; }
      else if (now - R.lastAt > 20000) rReconnect();
    }
  }
  function eqHTML() { return '<span class="eq"><i></i><i></i><i></i><i></i></span>'; }
  function rSubHTML(withDesc) {
    var st = rCur();
    if (R.err) return esc(R.err.indexOf("Tap") === 0 ? R.err : "⚠️ " + R.err);
    if (!R.playing) return "Paused";
    return eqHTML() + 'Live' + (withDesc ? '<span class="rl"> · ' + esc(st.d) + "</span>" : "");
  }
  function rUI() {
    syncMediaProjection();
    if (typeof publishDashboardState === "function") publishDashboardState(false);
    var b = $("rbtn"), m = $("rmini"), st = rCur();
    b.innerHTML = ICON.note; b.className = "qbtn" + (R.active ? " on" : "");
    document.body.classList.toggle("qon", !!(Q.active || R.active));
    document.body.classList.toggle("ron", !!R.active);
    updateStatus();
    if (!R.active) { m.hidden = true; positionMini(); rPanelLive(); return; }
    m.hidden = false;
    $("rmPlay").innerHTML = (R.playing || (R.want && !R.needTap)) ? ICON.pause : ICON.play;
    var parts = st.n.split(" · ");
    $("rmT").innerHTML = '<span class="rs">' + esc(parts[0]) + '</span>' + (parts[1] ? '<span class="rl"> · ' + esc(parts[1]) + "</span>" : "");
    $("rmS").innerHTML = rSubHTML(true);
    positionMini(); rPanelLive();
  }
  function rSleepLabel() { return R.sleepAt ? "Stops in " + Math.max(1, Math.ceil((R.sleepAt - Date.now()) / 60000)) + " min" : ""; }
  function rPanelLive() {
    if ($("rpanel").hidden) return;
    var e, i, rows = $("rcard").querySelectorAll("[data-a=rst]"), pills = $("rcard").querySelectorAll("[data-a=rsleep]"), st = rCur();
    if ((e = $("rpName"))) e.textContent = st.n;
    if ((e = $("rpSub"))) e.innerHTML = R.active ? rSubHTML(false) + (R.playing ? '<span class="live">LIVE</span>' : "") : esc(st.d);
    if ((e = $("rpPlay"))) e.innerHTML = (R.playing || (R.want && !R.needTap)) ? ICON.pause : ICON.play;
    if ((e = $("rpR"))) e.textContent = rSleepLabel();
    for (i = 0; i < rows.length; i++) {
      var n = +rows[i].getAttribute("data-n");
      rows[i].className = "rrow" + (R.active && n === R.st ? " on" : "") + (R.bad[n] ? " warn" : "");
    }
    for (i = 0; i < pills.length; i++) pills[i].className = "sw" + (pills[i].getAttribute("data-v") === R.sleepV ? " on" : "");
  }
  function rPanelFill() {
    var h = '<div class="ph"><span>Lofi radio</span><button class="x" type="button" data-a="rclose" aria-label="Close">' + ICON.close + "</button></div>" +
      '<div class="qgrid"><div><div class="qnow"><div class="qart rart">' + ICON.note + '</div><div class="qinfo"><b id="rpName"></b><small id="rpSub"></small></div></div>' +
      '<div class="qctl"><button class="c" type="button" data-a="rstop" aria-label="Stop">' + ICON.stop + '</button><button class="c big" id="rpPlay" type="button" data-a="rtoggle" aria-label="Play or pause"></button></div>' +
      '<div class="sec" style="margin-top:1vmin">Sleep timer <span id="rpR" style="text-transform:none;letter-spacing:0;margin-left:1vmin;color:var(--accent)"></span></div><div class="pills">';
    [["0", "Off"], ["30", "30 min"], ["60", "60 min"], ["90", "90 min"]].forEach(function (o) { h += '<button class="sw" type="button" data-a="rsleep" data-v="' + o[0] + '">' + o[1] + "</button>"; });
    h += '</div><div class="note">Volume: use the iPad\'s volume buttons. Pauses by itself for the adhan and comes back afterwards. Needs internet.</div>';
    if (R.form) h += '<div class="rform"><input class="qsearch" id="rfName" type="text" placeholder="Station name" autocomplete="off" autocorrect="off"><input class="qsearch" id="rfUrl" type="url" placeholder="https:// stream link" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"><div class="rstat" id="rfStat">Only https:// links work on this page.</div><div class="btns"><button class="btn pri" type="button" data-a="rsave">Save and play</button><button class="btn ghost" type="button" data-a="rcancel">Cancel</button></div></div>';
    h += '</div><div><div class="sec">Stations</div><div class="qlist" style="max-height:none">';
    rList().forEach(function (st, i) { h += '<div class="rrow" data-a="rst" data-n="' + i + '"><span>' + esc(st.n) + "</span><span><small>" + esc(st.d) + "</small>" + (st.c ? '<span class="rx" data-a="rdel" data-n="' + i + '">✕</span>' : "") + "</span></div>"; });
    h += '<div class="addrow" data-a="radd">＋ Add your own station</div></div></div></div><div class="btns" style="margin-top:2vmin"><button class="btn ghost" type="button" data-a="rclose">Close</button></div>';
    $("rcard").innerHTML = h;
    rPanelLive();
  }
  function rOpenPanel() { $("rpanel").hidden = false; R.form = false; rPanelFill(); }
  $("rpanel").addEventListener("click", function (e) {
    if (e.target === $("rpanel")) { $("rpanel").hidden = true; return; }
    var t = e.target;
    while (t && t.getAttribute && !t.getAttribute("data-a")) t = t.parentNode;
    if (!t || !t.getAttribute) return;
    var a = t.getAttribute("data-a"), n = +t.getAttribute("data-n"), r;
    if (a === "rclose") $("rpanel").hidden = true;
    else if (a === "rtoggle") rToggle();
    else if (a === "rstop") rStop();
    else if (a === "rst") rPlay(n);
    else if (a === "rsleep") rSleep(t.getAttribute("data-v"));
    else if (a === "radd") { R.form = true; rPanelFill(); }
    else if (a === "rcancel") { R.form = false; rPanelFill(); }
    else if (a === "rsave") {
      r = rAdd($("rfName").value, $("rfUrl").value.replace(/^\s+|\s+$/g, ""));
      if (r) { $("rfStat").textContent = "Can't save: " + r; return; }
      R.form = false; rPlay(rList().length - 1); rPanelFill();
    } else if (a === "rdel") {
      var wasCur = R.st === n;
      rcust.splice(n - RST.length, 1); store("rcustom", rcust);
      if (wasCur) { rStop(); R.st = 0; rPersist(); } else if (R.st > n) { R.st--; rPersist(); }
      R.bad = {}; rPanelFill(); rUI();
    }
    e.stopPropagation();
  });
  $("rbtn").addEventListener("click", rOpenPanel);
  $("rmPlay").addEventListener("click", function (e) { e.stopPropagation(); rToggle(); });
  $("rmOpen").addEventListener("click", rOpenPanel);
  rUI();

