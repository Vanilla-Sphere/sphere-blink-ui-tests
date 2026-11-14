import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, canvasChecksum, open, urlParams, waitViewReady } from "../helpers/app.js";
import { config } from "../config.js";
import { expect, test } from "../fixtures.js";

const HEAVY_JOBS_REASON =
  "Progressive fields start cell-cutting jobs on the server (UI precondition: an environment " +
  "where creating jobs is approved). Production and dev.vanillasphere.com share the production " +
  "backend, so the guard covers both; set TEST_ALLOW_HEAVY_JOBS=1 with BASE_URL pointing at an " +
  "approved isolated staging service to run them.";

test.describe("Bands, grouping and image math (manual cases UI-020 .. UI-026)", () => {
  // UI-020 · P0 · features.md §5
  // Expected: the chosen band is reflected in the buttons, the URL and the
  // detector chips of the frame on screen.
  test("[UI-020] Band đơn và tổ hợp", async ({ page, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-020", "P0", "features.md §5");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    expect(await advancedRail.isPicked("bands", "rgb")).toBe(true);
    expect((await urlParams(page)).det).toBeUndefined();
    await expect(viewStage.hudChannels).toContainText(/R D\d/);

    await advancedRail.pick("bands", "all");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "all" });
    await viewStage.waitForFrameReload();
    // "All bands" averages the six detectors, but the frame's chips list the
    // detectors that actually observed the target that day (often only two).
    await expect(viewStage.hudChannels).toContainText(/D\d/);

    await advancedRail.pick("bands", "rgb");
    await expect
      .poll(async () => (await urlParams(page)).det ?? "default")
      .toBe("default");

    await advancedRail.pick("bands", "5");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "5" });
    await advancedRail.pick("bands", "6");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "5,6" });
    await viewStage.waitForFrameReload();
    // The chips list the detectors that actually observed the target that day;
    // often only one of the two selected bands did. Assert no foreign detector.
    const chips = await viewStage.hudChannels.innerText();
    const shown = [...chips.matchAll(/D(\d)/g)].map((m) => Number(m[1]));
    expect(shown.length, "at least one detector chip").toBeGreaterThan(0);
    expect(shown.every((d) => d === 5 || d === 6), `chips "${chips}" must be D5/D6 only`).toBe(true);

    await advancedRail.pick("bands", "5"); // untick D5, only D6 stays
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "6" });
  });

  // UI-021 · P1 · features.md §6
  // Expected: the sequence and its metadata follow the chosen grouping; dates are UTC.
  test("[UI-021] Nhóm exposure/day/sky pass", async ({ page, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-021", "P1", "features.md §6");
    test.setTimeout(240_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    const dayTotal = (await viewStage.framePosition()).total;

    await advancedRail.pick("group", "exposure");
    await expect.poll(() => urlParams(page)).toMatchObject({ group: "exposure" });
    await viewStage.waitForFrameReload(90_000);
    const exposureTotal = (await viewStage.framePosition()).total;
    expect(exposureTotal).toBeGreaterThan(dayTotal);

    await advancedRail.pick("group", "visit");
    await expect.poll(() => urlParams(page)).toMatchObject({ group: "visit" });
    await viewStage.waitForFrameReload(90_000);
    const visitTotal = (await viewStage.framePosition()).total;
    expect(visitTotal).toBeLessThan(dayTotal);

    await advancedRail.pick("group", "day");
    await expect
      .poll(async () => (await urlParams(page)).group ?? "default")
      .toBe("default");
    await viewStage.waitForFrameReload(90_000);
    expect((await viewStage.framePosition()).total).toBe(dayTotal);
    await expect(viewStage.hud).toContainText("UTC");
  });

  // UI-022 · P0 · features.md §5,14 (EX-03)
  // Expected: a frame whose RGB channel is borrowed shows, in "This frame", the
  // source detector/date of that channel. Data-dependent: the scan skips when
  // the first frames have no borrowed channel (marked *).
  test("[UI-022] Kênh RGB mượn ngày", async ({ page, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-022", "P0", "features.md §5,14");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    const step = await viewStage.findFrameWhere(
      async () => (await viewStage.hudChannels.innerText()).includes("*"),
      14,
    );
    test.skip(step === null, "No frame with a borrowed channel (marked *) in the first 14 frames; the case is data-dependent.");

    const channels = await analysis.epochInfo.innerText();
    expect(channels).toContain("(from ");
    expect(channels).toMatch(/from \d{4}-\d{2}-\d{2}/);
    expect((await analysis.epochLabel()).length).toBeGreaterThan(0);
  });

  // UI-023 · P1 · features.md §7 (EX-02)
  // Expected: the difference modes are selected; "Use current frame" marks the
  // reference and the HUD keeps showing it while frames change.
  test("[UI-023] Median và reference", async ({ page, viewStage, advancedRail, analysis }) => {
    annotateCase(test.info(), "UI-023", "P1", "features.md §7");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page, 3);

    await advancedRail.pick("mode", "diffmed");
    await expect.poll(() => urlParams(page)).toMatchObject({ mode: "diffmed" });
    await expect(viewStage.hud).toContainText("− median");

    await advancedRail.pick("mode", "diffref");
    await expect.poll(() => urlParams(page)).toMatchObject({ mode: "diffref" });
    await expect(advancedRail.referenceRow).toBeVisible();

    const referenceLabel = await analysis.epochLabel();
    await advancedRail.setReferenceToCurrentFrame();
    await expect(advancedRail.referenceLabel).toHaveText(`${referenceLabel} UTC`);

    await viewStage.stepForward();
    expect((await viewStage.framePosition()).index).toBe(2);
    await expect(viewStage.hud).toContainText(`− ${referenceLabel}`);
  });

  // UI-024 · P1 · features.md §4,7
  // Expected: Sum all shows the stacked image; Reset returns the contrast to automatic.
  test("[UI-024] Sum và contrast reset", async ({ page, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-024", "P1", "features.md §4,7");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await advancedRail.pick("mode", "stack");
    await expect.poll(() => urlParams(page)).toMatchObject({ mode: "stack" });
    await expect(viewStage.hud).toContainText("sum of");
    expect(await viewStage.isPlaying()).toBe(false);

    await advancedRail.gainSlider.fill("100");
    await expect(advancedRail.gainSlider).toHaveValue("100");
    await advancedRail.resetGainButton.click();
    await expect(advancedRail.gainSlider).toHaveValue("0");
  });

  // UI-025 · P1 · features.md §8
  // Expected: the 3x3 progressive field shows the centre first and the wider
  // stage when done, with the cell grid overlay.
  test("[UI-025] Chuyển tiến trình 3×3", async ({ page, topBar, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-025", "P1", "features.md §8");
    test.skip(config.sharedBackend && !config.allowHeavyJobs, HEAVY_JOBS_REASON);
    test.setTimeout(420_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await topBar.chooseField("p1");
    await expect.poll(() => urlParams(page)).toMatchObject({ levels: "1" });
    await expect(advancedRail.cellGridOption).toBeVisible();
    await expect(advancedRail.cellGridCheckbox).toBeChecked();

    await expect
      .poll(() => viewStage.progressText.innerText(), { timeout: 360_000, intervals: [2_000] })
      .toMatch(/exposures in \d+s/);
    expect(await canvasChecksum(page, "#sky")).toBeGreaterThan(0);
  });

  // UI-026 · P1 · features.md §8
  // Expected: a 7x7 field loads in stages; double-clicking a cell opens it as a
  // plain 8 arcmin view at full detail.
  test("[UI-026] Drill-down 7×7", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-026", "P1", "features.md §8");
    test.skip(config.sharedBackend && !config.allowHeavyJobs, HEAVY_JOBS_REASON);
    test.setTimeout(900_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await topBar.chooseField("p3");
    await expect.poll(() => urlParams(page)).toMatchObject({ levels: "3" });
    await expect
      .poll(() => viewStage.progressText.innerText(), { timeout: 800_000, intervals: [3_000] })
      .toMatch(/exposures in \d+s/);

    const box = await viewStage.image.boundingBox();
    if (!box) throw new Error("the image canvas is not visible");
    await viewStage.image.dblclick({ position: { x: box.width / 2, y: box.height / 2 } });

    await expect
      .poll(async () => {
        const params = await urlParams(page);
        return { fov: params.fov ?? "", levels: params.levels ?? "" };
      })
      .toEqual({ fov: "8", levels: "" });
    await expect(viewStage.targetName).toHaveText(/^RA /);
  });
});
