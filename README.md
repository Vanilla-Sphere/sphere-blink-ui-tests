# sphere-blink-ui-tests

Playwright UI test suite for the [Vanilla Sphere](https://vanillasphere.com) viewer
([sphere-blink](https://github.com/Vanilla-Sphere/sphere-blink)), generated from a
manual UI test sheet of 76 Vietnamese cases (UI-001–UI-038 plus the delta
UI-039–UI-076). TypeScript, Page Object Model, no
test framework beyond `@playwright/test`.

Every test title carries its manual case ID (`[UI-013] …`), and every test pushes
`case`, `priority` and `trace` annotations, so the HTML report can be read next to
the manual sheet. See `docs/TRACEABILITY.md` for the full mapping.

## Requirements

- Node.js 20+
- Playwright Chromium: `npx playwright install chromium`

## Run

```bash
npm install
npx playwright install chromium

npm test               # both projects (desktop + smartphone)
npm run test:desktop   # 1280x720 Chromium
npm run test:smartphone # iPhone 13 descriptor (390x844, touch, mobile UA) on the Chromium engine
npm run report         # open the HTML report
```

The suite runs against **the live site** by default. Views are cut on demand by
the server, so a first load can take tens of seconds; cases repeat the same
Barnard view and rely on the server cache.

## Configuration (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASE_URL` | `https://vanillasphere.com/` | Target environment. |
| `TEST_ALLOW_HEAVY_JOBS` | unset | Enables UI-025/UI-026 (progressive fields start cell-cutting jobs, up to ~700 exposures for 7x7). Use only on staging where creating jobs is approved. |
| `TEST_ALLOW_MEASURE` | unset | Enables UI-037 ("Measure this object" writes measurement rows). Use only on an isolated staging service. |

UI-025/UI-026 and UI-037 skip themselves automatically when `BASE_URL` points at
the production hostname and the matching flag is not set.

## Structure

```
playwright.config.ts      two projects: desktop, smartphone (emulated iPhone 13)
src/config.ts             environment knobs and the production guard
src/fixtures.ts           page fixtures (one instance per page object, per test)
src/pages/                POM: TopBar, MapScreen, ViewStage, AdvancedRail, Analysis
src/helpers/app.ts        waiting, canvas checksums, URL/state readers
src/helpers/case.ts       traceability annotations
src/specs/                one describe block per manual-case group, one test per case
docs/manual-test-cases.json   the manual sheet as data
docs/TRACEABILITY.md      generated: case -> test file mapping
scripts/generate-traceability.mjs   regenerates the mapping, optionally merges a JSON report
```

Design notes:

- **Locators** follow the viewer's own stable hooks: element IDs from
  `web/index.html`, segmented controls by `data-v`, `aria-pressed` state,
  `role="alert"` for search errors. No text-position or pixel-coordinate
  selectors except where the case is about the canvas itself.
- **The canvas is asserted by a checksum** (sampled pixel sum), used to tell
  "redrawn differently" from "unchanged" (map zoom, overlay toggles). Pixel
  checks are not scientific correctness checks of the images.
- **Flakiness policy**: test retries are off; waits target states (frame
  counter, progress bar, `aria-pressed`), not fixed sleeps. Navigation goes
  through `open()` in `src/helpers/app.ts`, which waits out the hosting
  platform's 502/restart windows (the site itself shows "Updating the site,
  back in a moment…" for them); assertions still run only against the real app.
- **Isolation**: every test gets a fresh browser context (fresh `localStorage`),
  so mode-storage cases set their state explicitly.

Target-version note: the suite runs against the **live deployment**, last
verified at static assets `?v=50`, matching sphere-blink commit `0d8474f`
(the delta design of 2026-11-14; previously `245327b` / `?v=16`). Oracles were
verified against the live client, among them: the local "off the sky"
rejection for out-of-range coordinates (`err.range`), the client that waits
out HTTP 429/503 with `Retry-After` before showing an error, the frame chips
listing only the detectors that observed the target that day, the map zoom
that keeps the sky point under the pointer (so zooming back out leaves the
centre slightly off — no exact-pixel return is asserted), the start screen
centred near the galactic centre with six feature cards, and the plot's
"Over time" rename (button label; title "Flux over time at the crosshair").

Environment guard: **dev.vanillasphere.com shares the production backend**
(docs/environments.md), so the shared-backend guard covers production, www and
dev: cases that write data (UI-037 Measure) or start heavy server jobs
(UI-025/UI-026 progressive fields, which may trigger a blind search) stay
skipped on all of them unless `BASE_URL` points at an approved isolated
staging service and the matching `TEST_ALLOW_*` flag is set.

## Scope and honest limitations

- The **smartphone project is emulation** (viewport, touch, user agent on the
  Chromium engine). It is not a test on a physical phone; UI-038 stays skipped
  until a real, approved device is available.
- **UI-012** simulates the documented 503 name-service contract with Playwright
  route interception (client side only). It is not a staging outage.
- **UI-031** holds one response back with a route delay (client side only).
- **UI-032** checks the share links' values and hrefs but does **not** fetch the
  GIF/data endpoints, to avoid starting render jobs on the shared server.
- **UI-036** is not automated: no recovery oracle has been approved (the manual
  case itself says to record behaviour without concluding pass/fail).
- **UI-037** writes data; production-hostname guard keeps it skipped.
- UI-022/UI-029 depend on what the data happens to contain: if no borrowed
  channel or flagged frame appears in the first 14 frames, the test **skips with
  that reason** instead of failing.
- Accessibility coverage is functional (focus ring, keyboard paths, labels,
  hints, Escape, reduced motion). A screen-reader walkthrough is not automated.

## Result of the reference run (2026-11-14)

Recorded in `docs/RESULTS-2026-11-14.md` after execution: per-case outcomes for
both projects, environment, and the skipped/blocked list with reasons.
