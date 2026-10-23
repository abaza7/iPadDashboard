
  // ---------- v19.9 context arch: the weather arch also hosts the Quran player, the radio and ntfy notifications ----------
  // Idle: full weather. Playing or notified: weather shrinks to a pill on the arch edge and the arch shows the content.
  function cxBtn(act, label, icon, cls) {
    return '<button class="cb' + (cls ? " " + cls : "") + '" type="button" data-cx="' + act + '" aria-label="' + label + '">' + icon + "</button>";
  }
  function cxBuild() {
    var el = $("cx");
    if (!el || el.firstChild) return;
    el.innerHTML =
      '<div class="cx-p" id="cxQ" hidden>' +
        '<div class="cx-lab" id="cxQLab" data-cx="qopen"></div>' +
        '<div class="cx-v1" id="cxQPrev"></div>' +
        '<div class="cx-vm" id="cxQVm" data-cx="qread"><div class="cx-vin" id="cxQIn"></div></div>' +
        '<div class="cx-v1" id="cxQNext"></div>' +
        '<div class="cx-bar"><i id="cxQBar"></i></div>' +
        '<div class="cx-sub" id="cxQSub"></div>' +
        '<div class="cx-ctl">' + cxBtn("qstop", "Stop Quran", ICON.stop) + cxBtn("qprev", "Previous verse", ICON.prev) +
          cxBtn("qplay", "Play or pause", "", "pri") + cxBtn("qnext", "Next verse", ICON.next) + "</div>" +
      "</div>" +
      '<div class="cx-p" id="cxR" hidden>' +
        '<div class="cx-lab" data-cx="ropen">Lofi radio</div>' +
        '<div class="cx-art" data-cx="ropen">' + ICON.note + "</div>" +
        '<div class="cx-name" id="cxRName" data-cx="ropen"></div>' +
        '<div class="cx-sd" id="cxRDesc"></div>' +
        '<div class="cx-st" id="cxRSt"></div>' +
        '<div class="cx-ctl">' + cxBtn("rstop", "Stop radio", ICON.stop) + cxBtn("rplay", "Play or pause", "", "pri") +
          cxBtn("rnext", "Next station", ICON.next) + "</div>" +
      "</div>" +
      '<div class="cx-p cx-np" id="cxN" hidden>' +
        '<div class="cx-nh"><span>NEW MESSAGE</span><small id="cxNTime"></small></div>' +
        '<div class="cx-ns" id="cxNSrc"></div>' +
        '<div class="cx-nt" id="cxNTitle"></div>' +
        '<div class="cx-nb" id="cxNBody"></div>' +
        '<div class="cx-nbar"><i id="cxNBar"></i></div>' +
        '<div class="cx-nrow"><small id="cxNLeft"></small><button class="cx-dis" type="button" data-cx="ndis" aria-label="Dismiss">Dismiss</button></div>' +
        '<div class="cx-strip" id="cxStrip" hidden><span class="si" id="cxSI"></span><b id="cxSN"></b><span class="sc" id="cxSC"></span>' +
          '<button class="cb pri" type="button" data-cx="splay" aria-label="Play or pause" id="cxSP"></button></div>' +
      "</div>";
    el.addEventListener("click", cxClick);
  }
  function cxMedia() { return (typeof Q !== "undefined" && Q.active && window.QDATA) ? "q" : (typeof R !== "undefined" && R.active) ? "r" : ""; }
  function cxRPlaying() { return !!(R.playing || (R.want && !R.needTap)); }
  function cxClick(ev) {
    var t = ev.target, a;
    while (t && t !== $("cx") && !(t.getAttribute && t.getAttribute("data-cx"))) t = t.parentNode;
    if (!t || !t.getAttribute) return;
    a = t.getAttribute("data-cx");
    if (!a) return;
    ev.stopPropagation();
    if (a === "qstop") qStop();
    else if (a === "qprev") qPrevVerse();
    else if (a === "qplay") qToggle();
    else if (a === "qnext") qNextVerse(false);
    else if (a === "qopen") qOpenPanel();
    else if (a === "qread") { if (Q.verses && !qNoVerse()) qOpenRead(); else qOpenPanel(); }
    else if (a === "rstop") rStop();
    else if (a === "rplay") rToggle();
    else if (a === "rnext") rPlay((R.st + 1) % rList().length);
    else if (a === "ropen") rOpenPanel();
    else if (a === "ndis") cxDismiss();
    else if (a === "splay") { if (cxMedia() === "q") qToggle(); else rToggle(); }
  }
  // weather pill shown on the arch edge while the arch is showing something else
  function cxBadge() {
    var i = $("wbI"), t = $("wbT"), d = $("wbD");
    if (!i) return;
    i.innerHTML = $("wIcon").innerHTML;
    t.textContent = ($("wTemp").textContent || "").replace(/[CF]$/, "");
    d.textContent = ($("wDesc").textContent || "").split(" · ")[0];
  }
  function cxVerse(s, a) {
    var key = s + ":" + a, vm = $("cxQVm"), inn = $("cxQIn"), txt, secs, over;
    if (CX.verseKey === key && inn.textContent) return;
    CX.verseKey = key;
    txt = qText(s, a);
    inn.textContent = txt;
    inn.style.transition = "none"; inn.style.webkitTransition = "none";
    inn.style.transform = "translateY(0)"; inn.style.webkitTransform = "translateY(0)";
    vm.className = "cx-vm";
    void inn.offsetHeight;
    over = inn.scrollHeight - vm.clientHeight;
    if (over > 2) {            // a long verse scrolls slowly instead of shrinking
      vm.className = "cx-vm long";
      secs = (!qStream() && qa.duration > 0 && isFinite(qa.duration)) ? qa.duration : Math.max(8, txt.length * 0.1);
      secs = Math.max(5, secs - 3);
      void inn.offsetHeight;
      var tr = "transform " + secs + "s linear 1.8s", tf = "translateY(-" + over + "px)";
      inn.style.transition = tr; inn.style.webkitTransition = "-webkit-transform " + secs + "s linear 1.8s";
      inn.style.transform = tf; inn.style.webkitTransform = tf;
    }
  }
  function cxQFill() {
    var s = Q.sura, a = Q.a, nv = !Q.verses || qNoVerse(), n = qCount(s), nm = QDATA.s[s - 1], sub;
    $("cxQLab").textContent = (nm[1] + " · " + (qNoVerse() ? "streaming" : a === 0 ? "Bismillah" : a + "/" + n)).toUpperCase();
    if (nv) {
      $("cxQPrev").textContent = ""; $("cxQNext").textContent = "";
      var inn = $("cxQIn"); if (CX.verseKey !== "s" + s) { CX.verseKey = "s" + s; inn.textContent = nm[0]; inn.style.transition = "none"; inn.style.transform = "none"; $("cxQVm").className = "cx-vm"; }
    } else {
      $("cxQPrev").textContent = a > 0 ? qText(s, a - 1) : "";
      $("cxQNext").textContent = a < n ? qText(s, a + 1) : "";
      cxVerse(s, a);
    }
    sub = Q.err || (Q.needTap ? "Tap ▶ to start the sound" : QREC[Q.rec][0] + (qSleepLabel() ? " · " + qSleepLabel() : ""));
    $("cxQSub").textContent = sub;
    $("cxQBar").style.width = Math.round(qPos() * 100) + "%";
    cxSetPlay("qplay", !!Q.playing);
  }
  function cxSetPlay(act, playing) {
    var b = $("cx").querySelector('[data-cx="' + act + '"]');
    if (b) { var h = playing ? ICON.pause : ICON.play; if (b.getAttribute("data-i") !== (playing ? "p" : "a")) { b.innerHTML = h; b.setAttribute("data-i", playing ? "p" : "a"); } }
  }
  function cxRFill() {
    var st = rCur(), parts = st.n.split(" · "), pl = cxRPlaying(), h;
    $("cxRName").textContent = parts[0];
    $("cxRDesc").textContent = parts[1] || st.d;
    if (R.err) h = esc(R.err.indexOf("Tap") === 0 ? R.err : "⚠️ " + R.err);
    else if (!R.playing) h = "Paused";
    else h = eqHTML() + '<span class="cx-chip">LIVE</span>';
    if (R.sleepAt) h += '<span class="cx-sl"> · ' + esc(rSleepLabel()) + "</span>";
    if ($("cxRSt").getAttribute("data-h") !== h) { $("cxRSt").innerHTML = h; $("cxRSt").setAttribute("data-h", h); }
    cxSetPlay("rplay", pl);
  }
  function cxNFill() {
    var e = CX.cur, med = cxMedia(), t;
    if (!e) return;
    if (CX.nKey !== e.t + e.title + e.msg) {
      CX.nKey = e.t + e.title + e.msg;
      $("cxNTime").textContent = hhmm(new Date(e.t));
      $("cxNSrc").textContent = e.topic || "ntfy";
      $("cxNTitle").textContent = nIcon(e) + " " + (e.title || "Notification");
      $("cxNBody").textContent = e.msg;
      var bar = $("cxNBar");
      bar.style.transition = "none"; bar.style.webkitTransition = "none"; bar.style.width = "100%";
      void bar.offsetWidth;
      bar.style.transition = "width " + (CX_NOTE_MS / 1000) + "s linear"; bar.style.webkitTransition = "width " + (CX_NOTE_MS / 1000) + "s linear";
      bar.style.width = "0%";
    }
    t = Math.max(1, Math.ceil((CX.until - Date.now()) / 1000));
    $("cxNLeft").textContent = "Hides in " + t + "s" + (CX.queue.length ? " · " + CX.queue.length + " more" : "");
    $("cxStrip").hidden = !med;
    $("cxN").className = "cx-p cx-np" + (med ? " withmedia" : "");
    if (med) {
      var q = med === "q", pl = q ? !!Q.playing : cxRPlaying();
      $("cxSI").innerHTML = q ? ICON.book : ICON.note;
      $("cxSN").textContent = q ? QDATA.s[Q.sura - 1][1] : rCur().n.split(" · ")[0];
      $("cxSC").textContent = pl ? (q ? "Playing" : "LIVE") : "Paused";
      $("cxSP").innerHTML = pl ? ICON.pause : ICON.play;
    }
  }
  // decide what the arch shows
  function cxRender() {
    var now = $("now"), med, mode;
    if (!now) return;
    cxBuild();
    med = cxMedia();
    mode = CX.cur ? "n" : med;
    CX.mode = mode;
    now.className = "now" + (mode ? " cx-on cx-" + mode : "");
    document.body.classList.toggle("cxon", !!mode);
    $("cx").hidden = !mode;
    $("cxQ").hidden = mode !== "q"; $("cxR").hidden = mode !== "r"; $("cxN").hidden = mode !== "n";
    if (mode === "q") cxQFill(); else if (mode === "r") cxRFill(); else if (mode === "n") cxNFill();
    if (mode !== "q") CX.verseKey = "";
    if (mode !== "n") CX.nKey = "";
  }
  function cxTick() {
    if (CX.cur && Date.now() >= CX.until) { cxNext(); return; }
    if (CX.mode === "q") { $("cxQBar").style.width = Math.round(qPos() * 100) + "%"; $("cxQSub").textContent = Q.err || (Q.needTap ? "Tap ▶ to start the sound" : QREC[Q.rec][0] + (qSleepLabel() ? " · " + qSleepLabel() : "")); }
    else if (CX.mode === "r") cxRFill();
    else if (CX.mode === "n") cxNFill();
  }
  function cxNext() {
    CX.cur = null; CX.nKey = "";
    if (CX.queue.length) { CX.cur = CX.queue.shift(); CX.until = Date.now() + CX_NOTE_MS; }
    cxRender();
  }
  function cxDismiss() { nUnread = 0; updateChip(); cxNext(); }
  function cxNotify(e) {
    if (CX.cur) { if (CX.queue.length < 5) CX.queue.push(e); cxRender(); return; }
    CX.cur = e; CX.until = Date.now() + CX_NOTE_MS; CX.nKey = "";
    cxRender();
  }
