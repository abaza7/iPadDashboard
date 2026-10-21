/* Namespaced, failure-tolerant storage gateway. Preserves all existing dash_* values. */
(function(root){"use strict";
 function validKey(k){return typeof k === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(k);}
 function key(k){if(!validKey(k))throw new Error("Invalid storage key");return "dash_"+k;}
 function read(k){try{var raw=root.localStorage.getItem(key(k));return raw===null?null:JSON.parse(raw);}catch(e){return null;}}
 function write(k,v){try{var k2=key(k),json=JSON.stringify(v);if(typeof json!=="string")return false;root.localStorage.setItem(k2,json);return true;}catch(e){return false;}}
 function remove(k){try{root.localStorage.removeItem(key(k));return true;}catch(e){return false;}}
 function readValidated(k,validate,fallback){var value=read(k);return (typeof validate==="function" && validate(value))?value:fallback;}
 function migrate(k,version,transform){if(!Number.isInteger(version)||version<1||typeof transform!=="function")return false;
  var mk=k+"_schema",existing=readValidated(mk,function(v){return Number.isInteger(v)&&v>=0;},0);
  if(existing>=version)return true;
  var previous=read(k),next;try{next=transform(previous,existing,version);}catch(e){return false;}
  if(!write(k,next))return false;
  return write(mk,version);
 }
 root.DashboardStorage={read:read,write:write,remove:remove,readValidated:readValidated,migrate:migrate,validKey:validKey};
})(window);
