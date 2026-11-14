import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { config } from "../config.js";
import { expect, test } from "../fixtures.js";

const MEASURE_REASON =
  '"Measure this object" starts a measurement job and stores its rows on the server. ' +
  "Per the agreed rule it is not run against a shared backend: production and " +
  "dev.vanillasphere.com both use it (docs/environments.md). Point BASE_URL at an isolated " +
  "staging service and set TEST_ALLOW_MEASURE=1 to enable it.";

test.describe("Analysis panels (manual cases UI-028, UI-029, UI-037)", () => {
  // UI-028 · P1 · features.md §9 (delta 0d8474f)
  // Expected: the plot switches between Spectrum and Over time; title, legend
  // and units follow the selection. The delta renamed "Light curve" to
  // "Over time" and added day groups, the flagged toggle, the preliminary
  // reading and the CSV/PNG exports; their full flows are cases UI-047..UI-056
  // (later round), so here the presence and labels are asserted only.
  test("[UI-028] Spectrum và Over time", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-028", "P1", "features.md §9; delta 0d8474f: Over time, day groups, flagged toggle, reading, exports — presence only (full flows = UI-047..056)");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });

    await expect(analysis.spectrumTitle).toHaveText("Spectrum at the crosshair");
    await expect(analysis.spectrumLegend).toContainText("pass");
    await expect(analysis.spectrumModeButtons.locator('button[data-v="lc"]')).toHaveText("Over time");

    await analysis.choosePlot("lc");
    await expect(analysis.spectrumTitle).toHaveText("Flux over time at the crosshair");
    await expect(analysis.spectrumLegend).toContainText("D1");
    await expect(analysis.spectrumLegend).toContainText("D6");
    // Barnard spans several sky passes, so the day-group navigation appears.
    await expect(analysis.overTimeNav).toBeVisible();
    await expect(analysis.overTimeNav).toContainText("group");

    await analysis.choosePlot("spec");
    await expect(analysis.spectrumTitle).toHaveText("Spectrum at the crosshair");
    await expect(analysis.spectrumLegend).toContainText("pass");
  });

  // UI-029 · P1 · features.md §14 (EX-03)
  // Expected: "This frame" shows UTC date, detectors, exposure count, coverage
  // and the quality flags at the target; saturation warnings where present.
  // Delta 0d8474f: bright-core flags (OVERFLOW, TRANSIENT, SUR_ERROR, BLOOM)
  // are presentation-only in the plot; this case still checks the card's
  // provenance display, not the plot's point selection (UI-049 later round).
  // Data-dependent: skips when no flagged frame appears in the first frames.
  test("[UI-029] This frame và saturation", async ({ page, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-029", "P1", "features.md §14; delta 0d8474f: bright-core flags are not plot exclusions (point selection = UI-049)");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    const step = await viewStage.findFrameWhere(
      async () => (await analysis.epochInfo.locator(".flag:not(.ok)").count()) > 0,
      14,
    );
    test.skip(step === null, "No flagged frame in the first 14 frames; the case is data-dependent.");

    await expect(analysis.epochCard).toBeVisible();
    await expect(analysis.epochInfo).toContainText("Date (UTC)");
    await expect(analysis.epochInfo).toContainText("Detectors");
    await expect(analysis.epochInfo).toContainText("Exposures");
    await expect(analysis.epochInfo).toContainText("Coverage");
    await expect(analysis.epochInfo).toContainText("Flags at target");

    const chip = analysis.epochInfo.locator(".flag:not(.ok)").first();
    expect(((await chip.textContent()) ?? "").trim()).not.toBe("");
  });

  // UI-037 · P1 · features.md §12
  // Expected (on an approved staging environment): "Measure this object" shows
  // progress and then the result. Never run against production: it writes data.
  test("[UI-037] Measure this object (chỉ staging được phép)", async ({ page, topBar, analysis }) => {
    annotateCase(test.info(), "UI-037", "P1", "features.md §12");
    test.skip(config.sharedBackend || !config.allowMeasure, MEASURE_REASON);
    test.setTimeout(480_000);

    // An unmeasured position, so the measure row is offered.
    await open(page, "/?ui=adv");
    await topBar.search("269.4486 +4.7387");
    await waitViewReady(page);
    await expect(analysis.measureRow).toBeVisible({ timeout: 60_000 });

    await analysis.measureButton.click();
    await expect
      .poll(() => analysis.measureStatus.innerText(), { timeout: 420_000, intervals: [3_000] })
      .toMatch(/Measured\.|Nothing bright enough|Could not measure/);
  });
});
