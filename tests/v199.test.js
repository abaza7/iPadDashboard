"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ctx=read("src/dashboard/context.js"),shell=read("src/dashboard/shell-before.js"),q=read("src/dashboard/quran.js"),r=read("src/dashboard/radio.js"),html=read("index.html"),css=read("css/index.css"),built=read("js/dashboard/index.js");
assert(shell.includes('var BUILD = "2026-10-23.v19.9"'));
// arch markup keeps the weather ids and adds the badge + context host
for(const id of ["wIcon","wTemp","wDesc","wMeta","wb","cx","now"]) assert(html.includes('id="'+id+'"'),id);
assert(html.includes('class="wx"'));
// notifications: same 12 s for every priority, drain bar, stack over media, topic config untouched
assert(q.includes("var CX_NOTE_MS = 12000"));
assert(shell.includes("cxNotify(e)") && !shell.includes("showAlert(nIcon(e)"));
assert(shell.includes('load("ntopics")') && shell.includes("function notifHTML()") && shell.includes('store("ntopics", nTopics)'));
assert(ctx.includes("cx-nbar") && ctx.includes('id="cxStrip"'));
// controls inside the arch incl. stop on the Quran view
for(const a of ["qstop","qprev","qplay","qnext","rstop","rplay","rnext","ndis"]) assert(ctx.includes('"'+a+'"'),a);
// old mini players kept in code but hidden
assert(q.includes("var MINI_PLAYERS = false;") && q.includes("m.hidden = !MINI_PLAYERS") && r.includes("m.hidden = !MINI_PLAYERS"));
assert(html.includes('id="qmini"') && html.includes('id="rmini"'));
// long verses scroll instead of shrinking
assert(ctx.includes("translateY(-") && css.includes(".cx-vm.long"));
// build includes the module
assert(built.includes("function cxRender()") && built.includes("v19.9 context arch"));
// adhan untouched: arch state follows Q.active/R.active which the adhan pause/resume keeps
assert(ctx.includes("Q.active") && ctx.includes("R.active") && !ctx.includes("showAlert"));
assert(read("sw.js").includes("ipad-dashboard-v19.9"));
console.log("PASS: v19.9 context arch");
