/* npm-free Node regression suite; run from any directory. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
for (const name of ['index.html','remote.html']) {
  const html = read(name);
  assert(!/<style\b/i.test(html), `${name} retains inline CSS`);
  assert(!/<script>/.test(html), `${name} retains inline app JS`);
  const refs = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)].map(x => x[1]);
  for (const ref of refs) if (!/^(https?:|data:|#)/.test(ref)) assert(fs.existsSync(path.join(root,ref)), `${name} missing ${ref}`);
  const shared = html.indexOf('js/core/shared.js'); const app = html.indexOf(`js/${name === 'index.html' ? 'dashboard/index' : 'remote/remote'}.js`);
  assert(shared > 0 && app > shared, 'Shared script must load first');
}
for (const f of ['js/core/shared.js','js/core/catalog.js','js/core/ui.js','js/core/network.js','js/core/state.js','js/core/media-controller.js','js/core/components.js','js/core/diagnostics.js','js/dashboard/index.js','js/remote/remote.js','sw.js']) new vm.Script(read(f), { filename:f });
const sw = read('sw.js');
for(const f of ['./css/index.css','./css/remote.css','./js/core/shared.js','./js/core/catalog.js','./js/core/ui.js','./js/core/network.js','./js/core/state.js','./js/core/media-controller.js','./js/core/components.js','./js/core/diagnostics.js','./js/dashboard/index.js','./js/remote/remote.js']) assert(sw.includes(`"${f}"`),`Cache missing ${f}`);
assert(sw.includes('ipad-dashboard-v19.0'));
const data = {};
const storage = { getItem:k => data[k] ?? null, setItem:(k,v)=>{data[k]=v;} };
const context={window:{localStorage:storage,crypto:{getRandomValues: a=>crypto.randomFillSync(a),subtle:crypto.webcrypto.subtle}},crypto:crypto.webcrypto,TextEncoder,Promise,Uint8Array};
vm.runInNewContext(read('js/core/shared.js'), context);
const s=context.window.DashboardShared;
assert.equal(s.cleanTopic('foo?bar /abc'),'foobarabc');
assert.equal(s.cleanTopic('x'.repeat(70)).length,64);
assert(s.randomHex(16).match(/^[a-f0-9]{32}$/));
s.saveJSON('prefs',{theme:'boho-light'});
assert.equal(s.loadJSON('prefs').theme,'boho-light');
assert(data.dash_prefs);
data.dash_invalid='{';assert.equal(s.loadJSON('invalid'),null);
assert.equal(s.protocol.command,'v16.1');
assert.equal(s.protocol.state,'v17state');
(async()=>{
const got=await s.hmac('00'.repeat(32),'v16.1|123|abcd|radio play');
const expect=crypto.createHmac('sha256',Buffer.alloc(32)).update('v16.1|123|abcd|radio play').digest('hex');
assert.equal(got,expect);
await assert.rejects(s.hmac('broken','abc'));
const dash=read('js/dashboard/index.js');const remote=read('js/remote/remote.js');
assert(dash.includes('v17state|') && remote.includes('v17state|'));
assert(dash.includes('function qStop()') && remote.includes('liveStop'));
assert(read('js/core/catalog.js').includes('ice5.somafm.com'));
console.log('PASS: assets, script order, JS syntax, shared crypto, storage, radio, Quran, offline manifest');
})().catch(e=>{console.error(e);process.exitCode=1});
