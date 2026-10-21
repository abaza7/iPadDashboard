/* JSON request helper: preserves v18 timeout and late-result behavior. */
(function(root){ "use strict";
function getJSON(url,timeoutMs){return new Promise(function(resolve,reject){
 var done=false;var t=setTimeout(function(){if(!done){done=true;reject(new Error("timeout"));}},timeoutMs || 15000);
 fetch(url).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}).then(function(j){if(!done){done=true;clearTimeout(t);resolve(j);}},function(e){if(!done){done=true;clearTimeout(t);reject(e);}});
});}
root.DashboardNetwork={getJSON:getJSON};
})(window);
