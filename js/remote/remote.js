(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var topic = "", secret = "";
  var clean = DashboardShared.cleanTopic;
  function get() { return DashboardRemoteStorage.get("remote_topic"); }
  function put(t) { DashboardRemoteStorage.put("remote_topic", t); }

  // Authenticated v16.1 relay commands. Secrets remain in the URL fragment and local storage.
  // Shared, tested crypto helpers; pairing and message wire format are unchanged.
  var hexBytes = DashboardShared.hexBytes;
  var randomHex = DashboardShared.randomHex;
  var hmac = DashboardShared.hmac;

  var es = null, seen = {}, pending = null, pollN = 0;
  var isApp = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches));

  function status(t, err) { var e = $("st"); e.textContent = t; e.className = err ? "err" : ""; }
  function ipad(t, cls) { var e = $("ipad"); e.hidden = !t; e.textContent = t || ""; e.className = "ipad " + (cls || ""); }

  var liveState = null, liveSeen = 0, liveSequence = -1, liveMessageIds = {}, liveBoot = "", ackAt = 0, commandAt = 0;
  function updateLive() {
    var age = liveSeen ? Math.round((Date.now() - liveSeen) / 1000) : -1;
    $("liveBadge").textContent = age < 0 ? "Waiting…" : age < 55 ? "● Online" : age < 120 ? "● Stale" : "● No recent heartbeat";
    if (!liveState) return;
    var st = liveState, q = st.quran || {}, r = st.radio || {};
    $("liveMeta").textContent = "Theme: " + (st.theme || "—") + " · Screen: " + (st.screen || "—") + " · " + (st.version || "") + " · Audio: " + (st.audioReady ? "ready" : "needs tap");
    var medium = st.media, playing = st.playing, control = medium === "quran" ? "quran" : "radio";
    if (medium === "quran") {
      $("nowPlaying").textContent = (playing ? "▶ " : "❚❚ ") + (q.name || "Quran") + " · " + (q.reciter || "") + " · Verse " + q.verse + "/" + (q.verseCount || "?");
      $("liveProgress").hidden = false; $("liveTime").hidden = false;
      var pct = q.verseCount ? Math.max(0, Math.min(100, Math.round((q.verse / q.verseCount) * 100))) : 0;
      $("liveFill").style.width = pct + "%";
      $("liveTime").textContent = "Surah progress " + pct + "% · Verse audio " + (q.elapsed || 0) + "s" + (q.duration ? " / " + q.duration + "s" : "");
      if (q.reciterIndex) $("qr").value = String(q.reciterIndex);
    } else if (medium === "radio") {
      $("nowPlaying").textContent = (playing ? "● LIVE · " : "Paused · ") + (r.station || "Radio") + (r.error ? " · " + r.error : "");
      $("liveProgress").hidden = true; $("liveTime").hidden = false; $("liveTime").textContent = "Live stream · " + (r.server || "primary") + " server";
    } else { $("nowPlaying").textContent = "Nothing playing"; $("liveProgress").hidden = true; $("liveTime").hidden = true; }
    $("livePrev").disabled = medium !== "quran";
    $("liveToggle").textContent = playing ? "❚❚ Pause" : "▶ Play";
    $("liveToggle").disabled = medium === "none";
    $("liveStop").disabled = medium === "none";
    $("liveDiag").textContent = "Last status: " + (age < 0 ? "never" : age + "s ago") + " · Last response: " + (ackAt ? Math.round((Date.now()-ackAt)/1000) + "s ago" : "none") + (commandAt && ackAt >= commandAt ? " · Round trip: " + (ackAt-commandAt) + "ms" : "");
  }
  function onState(m) {
    if (!m || !m.message || m.message.indexOf("v17state|") !== 0 || !secret) return;
    if (m.id && liveMessageIds[m.id]) return;
    var p = m.message.split("|");
    if (p.length !== 6 || !/^\d{13}$/.test(p[1]) || !/^[a-f0-9]{32}$/.test(p[2]) || !/^[a-f0-9]{64}$/.test(p[5]) || Math.abs(Date.now()-Number(p[1])) > 120000) return;
    var message = p.slice(0, 5).join("|");
    hmac(secret, message).then(function (signature) {
      if (signature !== p[5] || (m.id && liveMessageIds[m.id])) return;
      var state; try { state = JSON.parse(decodeURIComponent(p[4])); } catch (e) { return; }
      if (!state || Math.abs(Date.now()-state.updated) > 120000) return;
      if (liveState && state.updated < liveState.updated) return;
      if (m.id) { liveMessageIds[m.id] = true; if (Object.keys(liveMessageIds).length > 100) liveMessageIds = {}; }
      liveState = state; liveSeen = Date.now(); updateLive();
    }).catch(function () {});
  }
  setInterval(updateLive, 5000);
  $("liveRefresh").addEventListener("click", function () { send("state"); });
  $("livePrev").addEventListener("click", function () { if (liveState && liveState.media === "quran") send("quran prev"); });
  $("liveToggle").addEventListener("click", function () { if (liveState && liveState.media !== "none") send(liveState.media + (liveState.playing ? " pause" : " play")); });
  $("liveStop").addEventListener("click", function () { if (liveState && liveState.media !== "none") send(liveState.media + " stop"); });
  function onAck(m) {
    if (!m || !m.message || !/^ack: /.test(m.message)) return;
    if (m.id) { if (seen[m.id]) return; seen[m.id] = 1; }
    if (m.time && pending && m.time * 1000 < pending.t - 3000) return;      // an old reply
    var txt = m.message.slice(5);
    status("iPad: ✓ " + txt);
    ipad("iPad answered: " + txt, "ok");
    pending = null; ackAt = Date.now(); updateLive();
  }

  function poll() {
    if (!topic) return;
    fetch("https://ntfy.sh/" + topic + "/json?poll=1&since=1m").then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (t) {
      t.split("\n").forEach(function (l) { if (!l) return; try { var msg = JSON.parse(l); onAck(msg); onState(msg); } catch (x) {} });
    }).catch(function () {});
  }

  function waitForAck(what) {
    pending = { t: Date.now(), what: what };
    pollN = 0;
    var timer = setInterval(function () {
      if (!pending) { clearInterval(timer); return; }
      pollN++;
      poll();
      if (pollN >= 5) {
        clearInterval(timer);
        if (pending) {
          pending = null;
          status("Sent, but the iPad didn't answer.", true);
          ipad("No answer from the iPad. Check that the dashboard is open and awake, that Settings → Remote control is on with this same code, and that it has internet.", "bad");
        }
      }
    }, 2500);
  }

  function send(cmd, quiet) {
    if (!quiet) status("Sending…"); commandAt = Date.now();
    if (!secret || !crypto.subtle) { status("Remote needs a new v16.1 pairing link from iPad Settings.", true); return Promise.resolve(); }
    var payload = "v16.1|" + Date.now() + "|" + randomHex(16) + "|" + cmd;
    return hmac(secret, payload).then(function (sig) {
      return fetch("https://ntfy.sh/" + topic, { method: "POST", body: payload + "|" + sig });
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      if (!quiet) status("Sent: " + cmd + " – waiting for the iPad…");
      waitForAck(cmd);
    }).catch(function (e) {
      status("Couldn't send (" + (e && e.message || "no internet") + "). Check this phone's connection.", true);
      ipad("Can't reach the relay (ntfy.sh) from this phone.", "bad");
    });
  }

  function listen() {
    if (es) { try { es.close(); } catch (e) {} }
    if (!window.EventSource) return;
    es = new EventSource("https://ntfy.sh/" + topic + "/sse");
    es.addEventListener("message", function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (x) { return; }
      onAck(m); onState(m);
    });
  }

  function show() {
    var pairing = location.hash.slice(1) || get();
    var match = /^([A-Za-z0-9_-]{1,64})\.([a-f0-9]{64})$/.exec(pairing);
    topic = match ? match[1] : "";
    secret = match ? match[2] : "";
    if (location.hash) {
      if (match) put(pairing);
      // In the browser keep the code in the address, so "Add to Home Screen" saves a link that opens already connected.
      if (isApp) { try { history.replaceState(null, "", location.pathname); } catch (e) {} }
    }
    $("appHelp").hidden = isApp;
    var has = !!topic;
    $("setup").hidden = has; $("main").hidden = !has;
    $("where").textContent = has ? "Connected to code " + topic.slice(0, 4) + "-…" : "";
    if (has) { listen(); ipad("Checking the iPad…"); send("state", true); }
  }

  var names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"], box = $("alerts");
  names.forEach(function (n) {
    var d = document.createElement("div"); d.className = "pr";
    d.innerHTML = "<b>" + n + "</b><button data-c=\"alert " + n.toLowerCase() + " on\">🔔 On</button><button data-c=\"alert " + n.toLowerCase() + " off\">🔕 Off</button>";
    box.appendChild(d);
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document && !(t.getAttribute && t.getAttribute("data-c"))) t = t.parentNode;
    if (t && t !== document) {
      if (t.getAttribute("data-confirm") && !window.confirm("Reload the dashboard? It will need a tap on the iPad to re-enable sound.")) return;
      send(t.getAttribute("data-c"));
    }
  });
  $("qr").addEventListener("change", function () {
    var n = parseInt($("qr").value, 10);
    if (n >= 1) send("quran reciter " + n);
  });
  $("rgo").addEventListener("click", function () {
    var n = $("rn").value.replace(/^\s+|\s+$/g, ""), u = $("ru").value.replace(/^\s+|\s+$/g, "");
    if (!n || !/^https:\/\/\S+$/i.test(u)) { status("Enter a name and an https:// link.", true); return; }
    send("radio add " + u + " " + n);
    $("rn").value = ""; $("ru").value = "";
  });
  var SURAHS = [[1,"Al-Fatihah","الفاتحة"],[2,"Al-Baqarah","البقرة"],[3,"Ali 'Imran","آل عمران"],[4,"An-Nisa","النساء"],[5,"Al-Ma'idah","المائدة"],[6,"Al-An'am","الأنعام"],[7,"Al-A'raf","الأعراف"],[8,"Al-Anfal","الأنفال"],[9,"At-Tawbah","التوبة"],[10,"Yunus","يونس"],[11,"Hud","هود"],[12,"Yusuf","يوسف"],[13,"Ar-Ra'd","الرعد"],[14,"Ibrahim","ابراهيم"],[15,"Al-Hijr","الحجر"],[16,"An-Nahl","النحل"],[17,"Al-Isra","الإسراء"],[18,"Al-Kahf","الكهف"],[19,"Maryam","مريم"],[20,"Taha","طه"],[21,"Al-Anbya","الأنبياء"],[22,"Al-Hajj","الحج"],[23,"Al-Mu'minun","المؤمنون"],[24,"An-Nur","النور"],[25,"Al-Furqan","الفرقان"],[26,"Ash-Shu'ara","الشعراء"],[27,"An-Naml","النمل"],[28,"Al-Qasas","القصص"],[29,"Al-'Ankabut","العنكبوت"],[30,"Ar-Rum","الروم"],[31,"Luqman","لقمان"],[32,"As-Sajdah","السجدة"],[33,"Al-Ahzab","الأحزاب"],[34,"Saba","سبإ"],[35,"Fatir","فاطر"],[36,"Ya-Sin","يس"],[37,"As-Saffat","الصافات"],[38,"Sad","ص"],[39,"Az-Zumar","الزمر"],[40,"Ghafir","غافر"],[41,"Fussilat","فصلت"],[42,"Ash-Shuraa","الشورى"],[43,"Az-Zukhruf","الزخرف"],[44,"Ad-Dukhan","الدخان"],[45,"Al-Jathiyah","الجاثية"],[46,"Al-Ahqaf","الأحقاف"],[47,"Muhammad","محمد"],[48,"Al-Fath","الفتح"],[49,"Al-Hujurat","الحجرات"],[50,"Qaf","ق"],[51,"Adh-Dhariyat","الذاريات"],[52,"At-Tur","الطور"],[53,"An-Najm","النجم"],[54,"Al-Qamar","القمر"],[55,"Ar-Rahman","الرحمن"],[56,"Al-Waqi'ah","الواقعة"],[57,"Al-Hadid","الحديد"],[58,"Al-Mujadila","المجادلة"],[59,"Al-Hashr","الحشر"],[60,"Al-Mumtahanah","الممتحنة"],[61,"As-Saf","الصف"],[62,"Al-Jumu'ah","الجمعة"],[63,"Al-Munafiqun","المنافقون"],[64,"At-Taghabun","التغابن"],[65,"At-Talaq","الطلاق"],[66,"At-Tahrim","التحريم"],[67,"Al-Mulk","الملك"],[68,"Al-Qalam","القلم"],[69,"Al-Haqqah","الحاقة"],[70,"Al-Ma'arij","المعارج"],[71,"Nuh","نوح"],[72,"Al-Jinn","الجن"],[73,"Al-Muzzammil","المزمل"],[74,"Al-Muddaththir","المدثر"],[75,"Al-Qiyamah","القيامة"],[76,"Al-Insan","الانسان"],[77,"Al-Mursalat","المرسلات"],[78,"An-Naba","النبإ"],[79,"An-Nazi'at","النازعات"],[80,"'Abasa","عبس"],[81,"At-Takwir","التكوير"],[82,"Al-Infitar","الإنفطار"],[83,"Al-Mutaffifin","المطففين"],[84,"Al-Inshiqaq","الإنشقاق"],[85,"Al-Buruj","البروج"],[86,"At-Tariq","الطارق"],[87,"Al-A'la","الأعلى"],[88,"Al-Ghashiyah","الغاشية"],[89,"Al-Fajr","الفجر"],[90,"Al-Balad","البلد"],[91,"Ash-Shams","الشمس"],[92,"Al-Layl","الليل"],[93,"Ad-Duhaa","الضحى"],[94,"Ash-Sharh","الشرح"],[95,"At-Tin","التين"],[96,"Al-'Alaq","العلق"],[97,"Al-Qadr","القدر"],[98,"Al-Bayyinah","البينة"],[99,"Az-Zalzalah","الزلزلة"],[100,"Al-'Adiyat","العاديات"],[101,"Al-Qari'ah","القارعة"],[102,"At-Takathur","التكاثر"],[103,"Al-'Asr","العصر"],[104,"Al-Humazah","الهمزة"],[105,"Al-Fil","الفيل"],[106,"Quraysh","قريش"],[107,"Al-Ma'un","الماعون"],[108,"Al-Kawthar","الكوثر"],[109,"Al-Kafirun","الكافرون"],[110,"An-Nasr","النصر"],[111,"Al-Masad","المسد"],[112,"Al-Ikhlas","الإخلاص"],[113,"Al-Falaq","الفلق"],[114,"An-Nas","الناس"]];
  function norm(x) {
    return String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\u064b-\u0652\u0670\u06d6-\u06ed\u0640]/g, "")
      .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627").replace(/\u0649/g, "\u064a").replace(/\u0629/g, "\u0647").replace(/[^a-z0-9\u0621-\u064a]/g, "");
  }
  SURAHS.forEach(function (r) { r.k = norm(r[1]) + "|" + norm(r[2]); });
  function matches(q) {
    var n = norm(q), out = [], i;
    if (!n) return SURAHS.slice();
    if (/^[0-9]+$/.test(n)) {
      for (i = 0; i < SURAHS.length; i++) if (String(SURAHS[i][0]) === n) out.push(SURAHS[i]);
      for (i = 0; i < SURAHS.length; i++) if (String(SURAHS[i][0]) !== n && String(SURAHS[i][0]).indexOf(n) === 0) out.push(SURAHS[i]);
      return out;
    }
    for (i = 0; i < SURAHS.length; i++) if (SURAHS[i].k.indexOf(n) >= 0) out.push(SURAHS[i]);
    out.sort(function (a, b) { return (a.k.indexOf(n) > a.k.indexOf("|") ? 1 : 0) - (b.k.indexOf(n) > b.k.indexOf("|") ? 1 : 0) || a[0] - b[0]; });
    return out;
  }
  function drawList() {
    var m = matches($("qn").value), h = "", i, box = $("ql");
    for (i = 0; i < m.length; i++) h += '<div data-n="' + m[i][0] + '"><i>' + m[i][0] + "</i><b>" + m[i][1] + "</b><span>" + m[i][2] + "</span></div>";
    box.innerHTML = h || '<div style="color:var(--dim)">No surah matches “' + $("qn").value.replace(/[<>&]/g, "") + '”</div>';
    box.hidden = false;
  }
  function playSurah(n) {
    var r = SURAHS[n - 1];
    $("qn").value = r[1]; $("ql").hidden = true; $("qn").blur();
    send("quran surah " + n);
  }
  $("qn").addEventListener("focus", drawList);
  $("qn").addEventListener("input", drawList);
  $("qn").addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== $("qn")) $("ql").hidden = true; }, 250); });
  $("qn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("qgo").click(); } });
  $("ql").addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== this && !(t.getAttribute && t.getAttribute("data-n"))) t = t.parentNode;
    if (t && t !== this) playSurah(+t.getAttribute("data-n"));
  });
  $("qgo").addEventListener("click", function () {
    var m = matches($("qn").value);
    if ($("qn").value.replace(/\s/g, "") && m.length && m.length < SURAHS.length) playSurah(m[0][0]);
    else { status("Type a surah name or number (1–114), or pick one from the list.", true); $("qn").focus(); }
  });
  $("save").addEventListener("click", function () {
    var t = $("code").value.trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,64}\.[a-f0-9]{64}$/.test(t)) { status("Enter the complete v16.1 pairing code from iPad Settings.", true); return; }
    if (t.length < 8) { $("code").focus(); return; }
    put(t); show();
  });
  $("forget").addEventListener("click", function () { put(""); location.hash = ""; show(); });
  window.addEventListener("hashchange", show);
  show();
})();
