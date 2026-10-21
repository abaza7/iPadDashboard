# iPad Dashboard v18.8 — Status projection and regression tests

This maintenance release extracts the dashboard/remote status projection into an ES5-compatible pure helper. The existing Quran and radio audio engines remain authoritative; there are no intentional UI or pairing changes.

## Changes
- Added `js/core/status-projection.js` for media priority, progress, buffering, and idle-state normalization.
- Dashboard status messages and the shared read-only state now use the same projection.
- Added `tests/v188.test.js` for paused, stopped, playing, and buffering cases.
- Updated offline cache and build number to v18.8.

## Validation
Run `node tools/release.js` for source checks, and `python3 tools/browser_e2e.py` for optional browser testing. Browser audio and iPadOS 15 tests remain required before production promotion.

Deploy the entire ZIP, and keep v18.7 available for rollback.


## v18.9 — Storage and reusable settings
- Introduces `js/core/storage.js` with namespaced, failure-tolerant JSON read/write, key validation, validated reads, and opt-in versioned migrations. The existing `dash_*` keys and values are preserved.
- Main dashboard persistence goes through this gateway; existing remote persistence stays unchanged in this release.
- Settings backup row now uses the reusable settings component.
- Adds storage behavior, migration, and markup regression tests.
- Audio engines, adhan, and phone protocol remain unchanged.
- Browser/iPadOS 15 runtime regression is still required.


## v19.0 — Final maintainability milestone (current pause point)
- State snapshots are defensive; updates only notify on changed top-level values, and subscription failures are isolated. Optional selectors reduce unnecessary UI work.
- Dashboard media projections now normalize each player once per update. Audio engines remain the playback authority for reliability.
- Remote storage is extracted without changing the existing `remote_topic` key or signed protocol.
- A dedicated behavioral unit test checks state isolation, selectors, broken listeners, diagnostics bounds, and remote preference compatibility.
- Offline cache includes the new remote storage module and is bumped to v19.0.
- All deployment assets are built with `node tools/release.js`, then `python3 tools/package.py`.
- The browser runner requires a permissive Chromium environment; real iPadOS 15 testing cannot be replaced by source tests.
- Further refactoring is paused after this release. The audio engine is deliberately authoritative: replacing it with a new state driver without device-level testing is unsafe.
