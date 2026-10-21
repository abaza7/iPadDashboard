/* Lightweight shared DOM helpers. Plain JavaScript, no framework. */
(function (root) { "use strict";
  function text(node, value) { if (node) node.textContent = value == null ? "" : String(value); return node; }
  function visible(node, show) { if (node) node.hidden = !show; return node; }
  function busy(node, isBusy) { if (node) { node.disabled = !!isBusy; node.setAttribute("aria-busy", isBusy ? "true" : "false"); } return node; }
  function status(node, label, kind) { if (node) { text(node,label); node.setAttribute("data-status",kind || "info"); } return node; }
  function escapeHTML(input) { return String(input == null ? "" : input).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  // Only a caller-owned, static action template may be passed as `actionHTML`.
  function settingsRow(title, subtitle, actionHTML) {
    return '<div class="srow"><div class="sl"><b>' + escapeHTML(title) + '</b><small>' + escapeHTML(subtitle) + '</small></div>' + (actionHTML ? '<div class="sb">' + actionHTML + '</div>' : '') + '</div>';
  }
  root.DashboardComponents = {text:text, visible:visible, busy:busy, status:status, escapeHTML:escapeHTML, settingsRow:settingsRow};
})(window);
