# v19.9 — Weather arch with context states

- The weather arch now also hosts the Quran player, the lofi radio and ntfy notifications. Idle looks as before (a little wider).
- While something is playing or a message arrives, the weather shrinks to a pill on the arch edge (temperature and condition).
- Quran: current verse with the previous/next verse faded, progress, reciter and sleep timer, with stop / previous / pause / next inside the arch. Long verses scroll slowly instead of shrinking.
- Radio: station, LIVE chip and sleep timer, with stop / pause / next station.
- Notifications from your existing ntfy topics (Settings > Notifications, unchanged) appear in the arch for 12 s with a draining bar and a Dismiss button, for every priority. Several messages queue. If media is playing, a small now-playing strip stays under the message. Any notification wakes the black night screen briefly so it can be seen.
- The adhan overlay is unchanged. The arch keeps its state while the adhan plays, and the Quran/radio resume as before.
- The old bottom mini players are hidden but still in the code (`MINI_PLAYERS` in `src/dashboard/quran.js`).
- Portrait: the arch becomes a full-width card under the weather pill.
- Includes the v19.3 reliability fixes already present in v19.8, plus `remote-check.html` (open it on the phone and iPad to see why the remote can't connect).
- Tests: `tests/v199.test.js` added. `tests/v196.test.js` was already failing in the v19.8 package (it looks for Azkar strings that moved) and is unchanged.
