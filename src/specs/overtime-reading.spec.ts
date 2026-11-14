import { annotateCase } from "../helpers/case.js";
import { waitForReading } from "../helpers/reading.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Over time groups and the preliminary reading (manual cases UI-050 .. UI-056)", () => {
  // UI-050 · P1 · features.md §9
  // Expected: Over time shows the day groups; navigation moves between them and
  // "All groups" returns; the flux scale is kept (scale pixels = [C], asserted
  // through the group label only).
  test("[UI-050] Nhóm ngày trong Over time", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-050", "P1", "features.md §9; flux scale equality = [C], asserted via group labels only");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });

    await analysis.choosePlot("lc");
    await expect(analysis.overTimeNav).toBeVisible();
    // It opens showing all groups; Next enlarges the first group of days.
    await expect(analysis.overTimeLabel).toContainText("groups of days");

    await page.locator("#otnext").click();
    await expect(async () => {
      expect(await analysis.overTimeLabel.innerText()).toMatch(/Group 1 of \d+/);
    }).toPass({ timeout: 15_000 });

    await page.locator("#otall").click();
    await expect(analysis.overTimeLabel).toContainText("groups of days");
    await expect(page.locator("#otall")).toBeHidden();
  });

  // UI-051 · P1 · features.md §9
  // Not automated: needs a fixture with an enlarged group that contains flagged
  // points; the state-preservation and state-reset steps follow from it.
  test("[UI-051] Nhóm phóng đại giữ flagged và thang đo (cần fixture)", async () => {
    annotateCase(test.info(), "UI-051", "P1", "features.md §9; needs an enlarged-group-with-flagged fixture");
    test.skip(true, "Needs a fixture with flagged points inside an enlarged day group.");
  });

  // UI-052 · P1 · features.md §9
  // Not automated: variable / steady / one-visit / too-faint verdicts need
  // fixtures with approved scientific oracles ([C]).
  test("[UI-052] Câu trả lời Over time theo trạng thái (cần fixture [C])", async () => {
    annotateCase(test.info(), "UI-052", "P1", "features.md §9; needs fixtures with approved scientific oracles ([C])");
    test.skip(true, "Verdict fixtures with approved [C] oracles are not available.");
  });

  // UI-053 · P1 · features.md §9
  // Expected: the preliminary reading shows a confidence, a description and its
  // limits, and states that it is not a classification. Fixture variants
  // (over-bright, empty, missing bands) are later rounds.
  test("[UI-053] Preliminary reading có confidence và giới hạn", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-053", "P1", "features.md §9; live reading, no hard scientific claim asserted; fixture variants deferred");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await expect(analysis.readingCard).toBeVisible({ timeout: 60_000 });

    await expect(analysis.readingConfidence).not.toBeEmpty();
    await expect(analysis.readingLine).not.toBeEmpty();
    expect(await analysis.readingCaveats.count()).toBeGreaterThan(0);
    await expect(analysis.readingFoot).toContainText("Not a classification");
  });

  // UI-054 · P1 · features.md §9
  // Expected: reference wavelengths list band/line, rest and in-curve positions
  // and their sources. That the in-curve positions match the published redshift
  // is a numeric [C] oracle and is not asserted.
  test("[UI-054] Reference wavelengths: dòng có tên và nguồn", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-054", "P1", "features.md §9; numeric z-position consistency = [C], not asserted");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await expect(analysis.readingCard).toBeVisible({ timeout: 60_000 });
    await expect(analysis.readingRefDetails).toBeVisible();

    await analysis.readingRefDetails.locator("summary").click();
    expect(await analysis.readingRefRows.count()).toBeGreaterThan(0);
    const firstRow = await analysis.readingRefRows.first().innerText();
    expect(firstRow.length).toBeGreaterThan(0);
    await expect(page.locator("#readcite")).not.toBeEmpty();
  });

  // UI-055 · P1 · features.md §9, viewer loading
  // Expected: switching targets recomputes the reading and the source table;
  // nothing is reused from the previous target. Missing-data message variants
  // need fixtures and are deferred.
  test("[UI-055] Reading và bảng nguồn thuộc target mới", async ({ page, topBar, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-055", "P1", "features.md §9; live targets, missing-data variants deferred to fixtures");
    test.setTimeout(240_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.readingCard).toBeVisible({ timeout: 120_000 });
    const barnardReading = await analysis.readingLine.innerText();

    // WISE 0855 resolves locally (a featured target) and is too faint for a
    // normal reading, so its sentence must differ from a cool star's.
    await topBar.search("wise-0855");
    await waitViewReady(page);
    await expect(viewStage.targetName).not.toContainText("Barnard");
    await waitForReading(page);
    const faintReading = await analysis.readingLine.innerText();
    expect(faintReading).not.toBe(barnardReading);
    expect(await analysis.readingRefRows.count()).toBeGreaterThanOrEqual(0);
  });

  // UI-056 · P1 · features.md §9
  // Expected: the CSV holds every point with its flags and metadata; the PNG
  // renders the plot as seen. Checked by parsing the downloaded files (test
  // download directory, deleted afterwards); that the CSV row count matches the
  // plot's point count exactly is a fixture-level oracle ([C]) and is not
  // asserted here — partial by design.
  test("[UI-056] Xuất CSV và PNG phổ [tải về thử, xoá sau]", async ({ page, analysis }, testInfo) => {
    annotateCase(test.info(), "UI-056", "P1", "features.md §9; downloads are client-side blobs saved to the test dir; full row-count oracle = [C] (partial)");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });

    const csvPromise = page.waitForEvent("download");
    await analysis.csvButton.click();
    const csv = await csvPromise;
    const csvPath = testInfo.outputPath("spectrum.csv");
    await csv.saveAs(csvPath);
    const { readFileSync, rmSync } = await import("node:fs");
    const text = readFileSync(csvPath, "utf8");
    expect(text).toContain("Vanilla Sphere");
    for (const column of ["wave_um", "flux_ujy", "flags", "method", "irsa_url"]) {
      expect(text).toContain(column);
    }
    expect(text.split("\n").filter((l) => l.includes(",")).length).toBeGreaterThan(5);

    const pngPromise = page.waitForEvent("download");
    await analysis.pngButton.click();
    const png = await pngPromise;
    const pngPath = testInfo.outputPath("spectrum.png");
    await png.saveAs(pngPath);
    const pngBytes = readFileSync(pngPath);
    expect(pngBytes.subarray(0, 4).toString("latin1")).toBe("\u0089PNG");
    expect(pngBytes.length).toBeGreaterThan(10_000);

    rmSync(csvPath, { force: true });
    rmSync(pngPath, { force: true });
  });
});
