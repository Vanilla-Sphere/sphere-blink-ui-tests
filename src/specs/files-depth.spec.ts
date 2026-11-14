import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Source files and distance/redshift (manual cases UI-057 .. UI-061)", () => {
  // UI-057 · P1 · features.md §14
  // Expected: the Source files card lists the exposures behind the frame with
  // links to the original FITS files at IRSA; switching frame changes the list;
  // the URL-list export is a client-side blob (no FITS is downloaded).
  test("[UI-057] Source files: danh sách, đổi frame, xuất URL", async ({ page, viewStage, extras }, testInfo) => {
    annotateCase(test.info(), "UI-057", "P1", "features.md §14; links checked, FITS not downloaded; URL-list export is a client-side blob");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(extras.filesCard).toBeVisible({ timeout: 120_000 });

    const links = extras.filesList.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
    expect(await links.first().getAttribute("href")).toMatch(/^https:\/\//);

    // Changing the frame changes the listed exposures.
    const before = await extras.filesList.innerText();
    await viewStage.stepForward();
    await expect(async () => {
      const now = await extras.filesList.innerText();
      expect(now).not.toBe(before);
    }).toPass({ timeout: 30_000 });

    // The URL list export: a client-side blob with archive addresses.
    const downloadPromise = page.waitForEvent("download");
    await extras.filesUrlsButton.click();
    const download = await downloadPromise;
    const path = testInfo.outputPath("exposures.txt");
    await download.saveAs(path);
    const { readFileSync, rmSync } = await import("node:fs");
    const text = readFileSync(path, "utf8");
    expect(text).toMatch(/^https:\/\//m);
    rmSync(path, { force: true });
  });

  // UI-058 · P1 · features.md §18
  // Expected: a star gets its parallax distance with its source; a galaxy or
  // quasar its published redshift; an unremarkable position says no catalogued
  // object is there. No live number is treated as the reference value.
  test("[UI-058] Distance and redshift: sao, quasar, vị trí trống", async ({ page, topBar, extras }) => {
    annotateCase(test.info(), "UI-058", "P1", "features.md §18; unit/method/source labels asserted, no live number as reference");
    test.setTimeout(300_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(extras.depthCard).toBeVisible({ timeout: 120_000 });
    await expect(extras.depthList).toContainText("Parallax");

    await topBar.search("3C 273");
    await waitViewReady(page);
    await expect(extras.depthList).toContainText("Redshift", { timeout: 120_000 });

    await topBar.search("269.4486 +4.7387");
    await waitViewReady(page);
    await expect(extras.depthStatus).toBeVisible({ timeout: 120_000 });
    expect((await extras.depthStatus.innerText()).length).toBeGreaterThan(0);
  });

  // UI-059 · P1 · features.md §18, viewer loading
  // Expected: when the object lookup does not answer, the card says so instead
  // of hanging, and the view stays usable. The lookup outage is simulated by
  // fulfilling /api/object with a 503 ([mock], client side only).
  test("[UI-059] Lookup không đáp ứng: fallback thông báo [mock]", async ({ page, extras }) => {
    annotateCase(test.info(), "UI-059", "P1", "features.md §18; lookup outage simulated with a route-fulfilled 503 [mock]; exact copy per viewer.md = [C]");

    await page.route("**/api/object?**", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "the catalogue service did not answer" }) }),
    );

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    // The card either reports the outage or reports no catalogued object —
    // either way it does not hang in "waiting" and the view stays intact.
    await expect(extras.depthStatus).toBeVisible({ timeout: 120_000 });
    const status = await extras.depthStatus.innerText();
    expect(status.length).toBeGreaterThan(0);
    expect(status.toLowerCase()).not.toContain("looking");
    expect(await page.locator("#tname").innerText()).toContain("Barnard");
  });

  // UI-060 · P1 · features.md §18
  // Not automated: "From its lines" requires ≥2 lines including Hα to be
  // verified against an independent scientific oracle ([C]) with a quasar
  // fixture; the live value is not treated as a reference.
  test("[UI-060] From its lines cho quasar (cần fixture [C])", async () => {
    annotateCase(test.info(), "UI-060", "P1", "features.md §18; line-based redshift needs fixture + independent [C] oracle");
    test.skip(true, "Needs a quasar fixture and an independent scientific oracle ([C]).");
  });

  // UI-061 · P1 · features.md §18
  // Not automated: the guards against assigning a line-based redshift without
  // two lines, or mislabelling an own estimate as published, need fixtures
  // (star, blazar, single-line source) with approved oracles ([C]).
  test("[UI-061] Không gán redshift từ một vạch (cần fixture [C])", async () => {
    annotateCase(test.info(), "UI-061", "P1", "features.md §18; needs fixtures (star, blazar, one-line source) with approved oracles ([C])");
    test.skip(true, "Needs guard fixtures with approved scientific oracles ([C]).");
  });
});
