  // ---------- ?debug=1 shows screen measurements (for layout problems on a real iPad) ----------
  var dbgTimer = null;
  function showDebug() {
    if (document.getElementById("dbgbox")) return;
    var dbg = document.createElement("div"); dbg.id = "dbgbox";
    dbg.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99;background:rgba(0,0,0,.85);color:#9f9;font:16px/1.4 monospace;padding:12px;white-space:pre;-webkit-user-select:text;user-select:text;";
    document.body.appendChild(dbg);
    var dbgUpdate = function () {
      var vv = window.visualViewport, sl = $("sleep").getBoundingClientRect();
      dbg.textContent = "inner " + innerWidth + "x" + innerHeight + "\nouter " + outerWidth + "x" + outerHeight +
        "\nscreen " + screen.width + "x" + screen.height + "\nclient " + document.documentElement.clientWidth + "x" + document.documentElement.clientHeight +
        "\nvisual " + (vv ? Math.round(vv.width) + "x" + Math.round(vv.height) + " @" + Math.round(vv.offsetTop) : "n/a") +
        "\nstandalone " + navigator.standalone + "  dpr " + devicePixelRatio + "\nbody " + Math.round(document.body.getBoundingClientRect().height) + "  orient " + (innerWidth > innerHeight ? "landscape" : "portrait") + "\nsleep rect top " + Math.round(sl.top) + " bottom " + Math.round(sl.bottom) + "\n(tap to close)";
    };
    dbg.addEventListener("click", function (e) { e.stopPropagation(); dbg.remove(); clearInterval(dbgTimer); });
    dbgUpdate(); dbgTimer = setInterval(dbgUpdate, 2000);
  }
  if (q.debug === "1") showDebug();

  // ---------- start-up ----------
  prunePrayerDays();
  setRemote(q.remote || load("remote") || "");
  if (nTopics.length) { nConnect(); setTimeout(nPoll, 2000); }
  var rn = load("reloadnote");
  if (rn) {
    store("reloadnote", null);
    if (Date.now() - rn < 5 * 60000) setTimeout(function () { if (remoteTopic) remoteSend("ack: weekly refresh done – tap the iPad once to re-enable adhan sound"); }, 4000);
  }
  applyTheme();
  var cw = load("weather"); if (cw) renderWeather(cw);
  var cf = load("fx"); if (cf) renderFX(cf);
  buildPrayer();
  applyTheme();
  updateChip();
  qUI();
  cxRender();
  loadSounds();

  renderClock();
  var lastDay = dmy(new Date()), lastClockTick = Date.now();
  var prayerJob;
  setInterval(function () {
    var d = new Date();
    var jump = Date.now() - lastClockTick;
    lastClockTick = Date.now();
    if (jump > ADHAN_WINDOW_MS + 5000 || jump < -5000) diag("clock resume", "Time jump " + Math.round(jump / 1000) + "s; old prayer alerts will not auto-play");
    renderClock();
    applyTheme();
    checkAdhan(d);
    maybeAutoRefresh(d);
    maybeWeekly(d);
    qTick();
    rTick();
    cxTick();
    if (dmy(d) !== lastDay) {          // new day: rebuild rows from cache, then refresh
      lastDay = dmy(d);
      buildPrayer();
      if (prayerJob) prayerJob.run();
    }
  }, 1000);
  setInterval(tickPrayer, 15000);

  addJob("weather", fetchWeather, 30 * 60 * 1000).run();
  if (CFG.fx) addJob("rates", fetchFX, 6 * 60 * 60 * 1000).run();
  if (CFG.prayer) { prayerJob = addJob("prayer times", fetchPrayer, 6 * 60 * 60 * 1000); prayerJob.run(); }

  // offline start: cache the page (and adhan files) with a service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
