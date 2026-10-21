/* HTML escaping and date formatting; safe for older iPad Safari. */
(function(root){ "use strict";
function escapeHTML(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function pad(n){return n < 10 ? "0"+n : ""+n;}
function dmy(d){return pad(d.getDate())+"-"+pad(d.getMonth()+1)+"-"+d.getFullYear();}
function hhmm(d){return pad(d.getHours())+":"+pad(d.getMinutes());}
function friendlyAge(ts,now){if(!ts)return "Never";var minutes=Math.max(0,Math.floor(((now==null?Date.now():now)-ts)/60000));return minutes<1?"Just now":minutes<60?minutes+"m ago":Math.floor(minutes/60)+"h ago";}
root.DashboardUI={escapeHTML:escapeHTML,pad:pad,dmy:dmy,hhmm:hhmm,friendlyAge:friendlyAge};
})(window);
