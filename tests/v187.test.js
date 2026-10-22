"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const smoke=fs.readFileSync(path.join(root,"tools/browser_e2e.py"),"utf8");
for(const term of ["index.html","remote.html","qbtn","rbtn","qmStop","service_workers","pageerror"]) assert(smoke.includes(term),term);
assert(fs.readFileSync(path.join(root,"sw.js"),"utf8").includes("ipad-dashboard-v19.3"));
console.log("PASS: v18.7 browser suite and release assets");
