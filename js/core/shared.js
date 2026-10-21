/* Shared, ES5-friendly utilities used by dashboard and remote. No build tooling required. */
(function (root) {
  "use strict";
  function hexBytes(a) { return Array.prototype.map.call(a, function (n) { return ("0" + n.toString(16)).slice(-2); }).join(""); }
  function randomHex(n) { var a = new Uint8Array(n); root.crypto.getRandomValues(a); return hexBytes(a); }
  function hmac(secret, payload) {
    if (!/^(?:[a-f0-9]{2})+$/i.test(secret)) return Promise.reject(new Error("Invalid signing secret"));
    var bytes = new Uint8Array(secret.match(/../g).map(function (h) { return parseInt(h, 16); }));
    return root.crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
      .then(function (key) { return root.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)); })
      .then(function (buffer) { return hexBytes(new Uint8Array(buffer)); });
  }
  function cleanTopic(t) { return String(t || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64); }
  function loadJSON(k) { try { return JSON.parse(root.localStorage.getItem("dash_" + k)); } catch (e) { return null; } }
  function saveJSON(k, v) { try { root.localStorage.setItem("dash_" + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  root.DashboardShared = {
    protocol: { command: "v16.1", state: "v17state", maxAgeMs: 120000 },
    hexBytes: hexBytes, randomHex: randomHex, hmac: hmac, cleanTopic: cleanTopic,
    loadJSON: loadJSON, saveJSON: saveJSON
  };
})(window);
