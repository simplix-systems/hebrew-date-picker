// Deprecated. The canonical tests now live in `calendar.test.mjs` and
// `events.test.mjs` and run against the real compiled library via `npm test`
// (which first compiles src/core to lib-cjs). Run them with:
//
//   npm test            # any timezone
//   npm run test:tz     # forces TZ=Asia/Jerusalem (DST regression guard)
//
console.log('Run `npm test` — see calendar.test.mjs / events.test.mjs');
