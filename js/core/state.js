/* Dependency-free, synchronous state store for legacy Safari. */
(function(root){"use strict";
function copy(v){var o={},k;for(k in v)if(Object.prototype.hasOwnProperty.call(v,k))o[k]=v[k];return o;}
function create(initial){var value=copy(initial||{}),listeners=[];
 function notify(){var snapshot=copy(value);listeners.slice().forEach(function(item){try{if(!item.selector){item.fn(snapshot);return;}var next=item.selector(snapshot);if(next!==item.last){item.last=next;item.fn(next,snapshot);}}catch(e){/* listeners must not break playback */}});}
 return {
 get:function(){return copy(value);},
 set:function(patch){if(!patch||typeof patch!=="object")return copy(value);var next=copy(value),k,changed=false;for(k in patch)if(Object.prototype.hasOwnProperty.call(patch,k)){if(next[k]!==patch[k])changed=true;next[k]=patch[k];}if(changed){value=next;notify();}return copy(value);},
 subscribe:function(fn,selector){if(typeof fn!=="function")return function(){};var entry={fn:fn,selector:typeof selector==="function"?selector:null};if(entry.selector)entry.last=entry.selector(copy(value));listeners.push(entry);return function(){var i=listeners.indexOf(entry);if(i>=0)listeners.splice(i,1);};}
 };}
root.DashboardState={create:create};
})(window);
