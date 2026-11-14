import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Measured-track display (manual cases UI-072, UI-073)", () => {
  // UI-072 · P1 · features.md §12
  // Expected: the Measured card shows the fitted motion with its components and
  // uncertainty next to the catalogue value; upper-limit (below 3 sigma) and
  // no-source wording need fixtures with approved scientific oracles ([C]) and
  // are deferred — partial by design.
  test("[UI-072] Measured: hướng, thành phần, catalogue (partial)", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-072", "P1", "features.md §12; live Barnard fit; upper-limit/no-source wording needs fixtures + [C] oracles (partial)");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.trackCard).toBeVisible({ timeout: 120_000 });

    const motion = analysis.trackList.locator("dd").filter({ hasText: "Motion" }).first();
    await expect(motion).toBeVisible();
    const text = await motion.innerText();
    expect(text).toMatch(/±/); // fitted value with its uncertainty
    expect(text).toMatch(/σ|″\/yr/);
    await expect(analysis.trackList).toContainText("Catalogue");
  });

  // UI-073 · P2 · features.md §12
  // Expected: the motion (i) opens a small chart of the measured positions with
  // the fitted and catalogue arrows, by mouse and by keyboard, closing with
  // Escape. The chart's geometric correctness is a [C] oracle; presence and
  // keyboard operation are asserted.
  test("[UI-073] Biểu đồ motion: mở bằng chuột và phím, đóng Escape", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-073", "P2", "features.md §12; chart geometry = [C], presence + keyboard operation asserted");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.trackCard).toBeVisible({ timeout: 120_000 });
    await expect(analysis.trackTipButtons.first()).toBeVisible();

    // By mouse.
    await analysis.trackTipButtons.first().click();
    const tipBody = page.locator("#tracklist .tip.open .tipbody");
    await expect(tipBody).toBeVisible();
    await expect(tipBody.locator("svg")).toBeVisible();

    // By keyboard, closed with Escape.
    await page.keyboard.press("Escape");
    await page.mouse.move(8, 8);
    await expect(page.locator("#tracklist .tip.open")).toHaveCount(0);
    await analysis.trackTipButtons.first().focus();
    await page.waitForTimeout(600); // the hint may appear; the tip needs the key press
    await page.keyboard.press("Enter");
    await expect(page.locator("#tracklist .tip.open .tipbody")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#tracklist .tip.open")).toHaveCount(0);
  });
});
