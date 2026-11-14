import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, uiMode, urlParams, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Simple and Advanced modes (manual cases UI-013 .. UI-015)", () => {
  // UI-013 · P0 · features.md §3
  // Expected: switching keeps the target and the frame; Advanced shows the
  // display controls and the analysis panels.
  test("[UI-013] Simple sang Advanced", async ({ page, topBar, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-013", "P0", "features.md §3");

    await open(page, "/?ui=simple&target=barnard&fov=8");
    await waitViewReady(page);
    const frameBefore = await viewStage.framePosition();

    await topBar.switchTo("adv");
    expect(await uiMode(page)).toBe("adv");
    await expect(viewStage.targetName).toContainText("Barnard");
    expect(await viewStage.framePosition()).toEqual(frameBefore);

    await expect(advancedRail.bandsGroup).toBeVisible();
    await expect(advancedRail.groupGroup).toBeVisible();
    await expect(advancedRail.modeGroup).toBeVisible();
    await expect(viewStage.timeline).toBeVisible();
    await expect(viewStage.targetCard).toBeVisible();
  });

  // UI-014 · P0 · features.md §3 (EX-02)
  // Expected: bands and image math chosen in Advanced are restored when the user
  // returns to it; the target is kept.
  test("[UI-014] Khôi phục cài đặt Advanced", async ({ page, topBar, viewStage, advancedRail }) => {
    annotateCase(test.info(), "UI-014", "P0", "features.md §3");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await advancedRail.pick("bands", "5");
    await advancedRail.pick("bands", "6");
    await advancedRail.pick("mode", "diffref");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "5,6", mode: "diffref" });

    await topBar.switchTo("simple");
    expect(await uiMode(page)).toBe("simple");
    await expect(viewStage.targetName).toContainText("Barnard");

    await topBar.switchTo("adv");
    await viewStage.waitForFrameReload();
    expect(await advancedRail.isPicked("bands", "5")).toBe(true);
    expect(await advancedRail.isPicked("bands", "6")).toBe(true);
    expect(await advancedRail.isPicked("mode", "diffref")).toBe(true);
    await expect(advancedRail.referenceRow).toBeVisible();
    expect(await urlParams(page)).toMatchObject({ det: "5,6", mode: "diffref" });
  });

  // UI-015 · P1 · viewer.md §URL state
  // Expected: the ui parameter in the URL wins; a link with display parameters
  // and no ui opens Advanced; otherwise the stored choice applies. Every page
  // load stores its resolved mode, so the stored value is (re)written right
  // before each navigation that must read it.
  test("[UI-015] Ưu tiên mode trong URL", async ({ page }) => {
    annotateCase(test.info(), "UI-015", "P1", "viewer.md §URL state");

    await open(page, "/");
    await page.evaluate(() => localStorage.setItem("vs.ui", "adv"));

    await open(page, "/?ui=simple&target=barnard");
    expect(await uiMode(page)).toBe("simple"); // the URL decides over the stored choice

    await page.evaluate(() => localStorage.setItem("vs.ui", "adv")); // the load above stored "simple"
    await open(page, "/?target=barnard");
    expect(await uiMode(page)).toBe("adv"); // the stored choice applies

    await page.evaluate(() => localStorage.setItem("vs.ui", "simple"));
    await open(page, "/?target=barnard&det=5%2C6");
    expect(await uiMode(page)).toBe("adv"); // display parameters make an Advanced link

    await page.evaluate(() => localStorage.setItem("vs.ui", "simple"));
    await open(page, "/?target=barnard");
    expect(await uiMode(page)).toBe("simple");
  });
});
