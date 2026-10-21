"use strict";
const fs=require("node:fs"), path=require("node:path"), root=path.resolve(__dirname,"..");
const chunks=["shell-before.js","quran.js","radio.js","shell-after.js"].map(name=>fs.readFileSync(path.join(root,"src/dashboard",name),"utf8"));
const output=chunks.join("");
if(!output.startsWith("(function () {\n") || !output.trimEnd().endsWith("})();")) throw new Error("Invalid dashboard entrypoint");
fs.writeFileSync(path.join(root,"js/dashboard/index.js"), output);
console.log("Built dashboard script from 4 source units");
