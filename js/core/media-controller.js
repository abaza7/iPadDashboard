/* Pure media state transitions, ES5 compatible; no Audio or DOM access. */
(function (root) { "use strict";
  function normalize(input) {
    input = input || {};
    var active = !!input.active, playing = active && !!input.playing;
    return {active: active, playing: playing, paused: active && !playing,
      error: String(input.error || ""), position: typeof input.position === "number" && isFinite(input.position) && input.position >= 0 ? input.position : 0};
  }
  function transition(previous, action) {
    var before = normalize(previous), next = {active: before.active, playing: before.playing, error: before.error, position: before.position};
    switch (action && action.type) {
      case "PLAY": next.active = true; next.playing = true; next.error = ""; break;
      case "PAUSE": if (next.active) next.playing = false; break;
      case "STOP": next.active = false; next.playing = false; next.position = 0; next.error = ""; break;
      case "ERROR": next.playing = false; next.error = String(action.message || "Playback error"); break;
      case "POSITION": if (typeof action.value === "number" && isFinite(action.value) && action.value >= 0) next.position = action.value; break;
      default: throw new Error("Unknown media transition");
    }
    return normalize(next);
  }
  root.DashboardMediaController = {normalize: normalize, transition: transition};
})(window);
