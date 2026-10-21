/* Pure status projection for UI and remote; browser ES5 compatible. */
(function(root){"use strict";
function finiteNumber(value){return typeof value === "number" && isFinite(value) && value >= 0 ? Math.round(value) : 0;}
function project(input){
 input=input||{};var q=input.quran||{},r=input.radio||{},qOn=!!q.active,rOn=!!r.active;
 var medium=qOn?"quran":rOn?"radio":"none";
 return {version:input.version||"",theme:input.theme||"",screen:input.screen||"normal",audioReady:!!input.audioReady,transport:input.transport||"off",updated:finiteNumber(input.updated),media:medium,
 playing:medium==="quran"?!!q.playing:medium==="radio"?!!r.playing:false,
 buffering:medium==="quran"?!!q.loading:medium==="radio"?!!(r.want&&!r.playing&&!r.needTap):false,
 quran:{surah:q.surah||1,name:q.name||"",reciter:q.reciter||"",reciterIndex:q.reciterIndex||1,verse:q.verse||1,verseCount:q.verseCount||0,elapsed:finiteNumber(q.elapsed),duration:finiteNumber(q.duration),sleepAt:q.sleepAt||0},
 radio:{station:r.station||"",stationIndex:r.stationIndex||1,sleepAt:r.sleepAt||0,error:r.error||"",server:r.server||"primary"}};
}
root.DashboardStatusProjection={project:project};
})(window);
