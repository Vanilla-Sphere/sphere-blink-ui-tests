# Delta update run — 2026-11-14, target v50 (sphere-blink `0d8474f`)

Second authoritative run of the suite, after applying the delta test design
("Sửa các case hiện có") for the existing manual cases UI-001–UI-038. The
HEAD of sphere-blink main was re-checked immediately before the run:
`0d8474f0e95b9d8c86f9f805d7187b1439b758e2`, and the live site served static
assets `?v=50`, matching that commit. Raw report: `docs/run-2026-11-14-v50.json`;
per-case mapping with outcomes: `docs/TRACEABILITY.md`. The previous run
(target `?v=21`) is documented in `RESULTS-2026-11-14.md`.

## Environment

Same as the previous run (Windows 11, Playwright Chromium, `workers: 1`,
`retries: 0`): `desktop` 1280x720; `smartphone` = iPhone 13 descriptor
(390x844, DPR 3, touch, mobile UA) on the Chromium engine — emulation, not a
physical phone. All flows ran **live and read-only against
https://vanillasphere.com**; no mocks were needed this round, and no vote,
measurement, or heavy job was started. The two client-side simulations stay
marked: UI-012 (route-fulfilled 503 contract) and UI-031 (route-held response).

## Outcome

| Project | Passed | Skipped | Failed |
| --- | --- | --- | --- |
| desktop | 33 | 5 | 0 |
| smartphone | 33 | 5 | 0 |
| **total** | **66** | **10** | **0** |

## What changed in the suite (delta "Sửa các case hiện có")

- **UI-001**: start screen now asserts the six feature cards (`#dolist`,
  `data-do` blink/movers/spectrum/time/depth/data), the 2MASS atlas note, and
  a fully settled first paint. The galactic-centre start (starmap.js `OPEN`
  view, RA 266.4 Dec −29) is documented, not pixel-asserted; "Whole sky"
  reset remains UI-002.
- **UI-028**: "Light curve" → button **"Over time"**, title **"Flux over time
  at the crosshair"**; the day-group navigation (`#otnav`) is asserted
  visible for Barnard. Full group/flagged/reading/export flows are
  UI-047–UI-056 (later round) — **presence only here**.
- **UI-032**: now also asserts the **CSV/PNG export buttons** of the spectrum
  panel. Download content checks are UI-056 — **partially covered by design**.
- **Environment guard**: `dev.vanillasphere.com` proxies to the production
  backend (docs/environments.md), so the shared-backend guard now covers
  production, www and dev for UI-025/UI-026 (heavy progressive-field jobs)
  and UI-037 (Measure writes). Skips list unchanged: UI-025, UI-026, UI-036
  (no approved oracle), UI-037, UI-038 (real device).
- **UI-020/UI-029/UI-027/UI-031**: already matched the delta from the first
  round (chips reflect the detectors that observed the epoch; bright-core
  flags are presentation-only in the plot; overlays contextual; mover/seen
  URL flows annotated as UI-067/UI-076). Annotations now say so explicitly.
- **Canvas checksum**: sums every pixel (small drawn marks, e.g. the
  crosshair on a 390px canvas, no longer slip between samples), and the map
  tests wait for the first full paint including the async 2MASS atlas
  backdrop (`awaitMapSettled`).

## During-development findings on v50

- The first arrow-key pan read a checksum identical to the pre-pan map when
  the read happened before the atlas backdrop finished loading; fixed by the
  settled-read above (behaviour itself was verified working by probe).
- The crosshair toggle assertion needed the full-pixel checksum on the
  smartphone viewport (mark smaller than the old sampling stride).
- One transient UI-029 failure in an intermediate run; green on every
  dedicated re-run and in the authoritative run.

## Remaining after this round (not claimed as done)

- **UI-039–UI-076 are not implemented yet** (38 new cases of the delta;
  explicitly out of scope for this round). Several need an isolated staging
  backend (movers, votes, progressive fields), approved scientific fixtures
  ([C] oracles), or real-device/screen-reader sessions.
- Partial cases by design: UI-028 (presence only), UI-032 (exports present,
  not downloaded), UI-029 (card display only), UI-027 (Moving objects overlay
  deferred to UI-067/069).
