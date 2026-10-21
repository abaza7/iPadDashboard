/* Remote-only preferences. Preserves historical un-prefixed keys. */
(function(root){"use strict";
function get(key){try{return root.localStorage.getItem(key)||"";}catch(e){return "";}}
function put(key,value){try{root.localStorage.setItem(key,String(value));return true;}catch(e){return false;}}
root.DashboardRemoteStorage={get:get,put:put};
})(window);
