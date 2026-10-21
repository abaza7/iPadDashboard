/* Bounded, private, in-memory diagnostics buffer. Never log credentials or payloads. */
(function (root) { "use strict";
 function create(limit, seed) {
   var entries=[], cap=Math.max(1, Math.min(200, Number(limit)||50));
   if (seed && seed.forEach) seed.forEach(function (item) {
     if (!item || !isFinite(Number(item.time))) return;
     entries.push({time:Number(item.time),category:String(item.category || item.kind || "unknown").slice(0,32),code:String(item.code || item.detail || "").slice(0,160)});
   });
   if (entries.length > cap) entries.length = cap;
   return {
     add:function(category, code) { entries.unshift({time:Date.now(),category:String(category).slice(0,32),code:String(code).slice(0,160)}); if(entries.length>cap) entries.length=cap; },
     list:function(){return entries.map(function(x){return {time:x.time,category:x.category,code:x.code};});},
     count:function(){return entries.length;},
     clear:function(){entries.length=0;}
   };
 }
 root.DashboardDiagnostics={create:create};
})(window);
