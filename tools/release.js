"use strict";
const cp=require("node:child_process"), path=require("node:path"), root=path.resolve(__dirname,"..");
function run(args){cp.execFileSync(process.execPath,args,{cwd:root,stdio:"inherit"});}
run(["tools/build.js"]);
for(const test of ["regression.test.js","modules.test.js","build.test.js","controllers.test.js","migration.test.js","v185.test.js","v187.test.js","v188.test.js","v189.test.js","v190.test.js","v192.test.js","v197.test.js"])run(["tests/"+test]);
console.log("PASS: v19.7 source build + regression gate");
