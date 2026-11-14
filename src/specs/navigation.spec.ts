import { annotateCase } from "../helpers/case.js";
import { open, screen, uiMode, urlParams, waitMapScreen, waitViewReady, waitViewScreen } from "../helpers/app.js";
import { AdvancedRail } from "../pages/AdvancedRail.js";
import { ViewStage } from "../pages/ViewStage.js";
import { expect, test } from "../fixtures.js";

test.describe("Navigation and URL state (manual cases UI-030, UI-031)", () => {
  // UI-030 · P0 · viewer.md §URL state
  // Expected: a copied URL reproduces the view in a new session; Back/Forward
  // moves between the map and the view.
  test("[UI-030] URL và Back/Forward", async ({ page, advancedRail }) => {
    annotateCase(test.info(), "UI-030", "P0", "viewer.md §URL state");

    await open(page, "/?ui=adv&target=barnard&fov=8");
    await waitViewReady(page);
    await advancedRail.pick("bands", "5");
    await advancedRail.pick("bands", "6");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "5,6" });

    const sharedUrl = page.url();
    const second = await page.context().newPage();
    await open(second, sharedUrl);
    const secondRail = new AdvancedRail(second);
    const secondStage = new ViewStage(second);
    expect(await uiMode(second)).toBe("adv");
    expect(await secondRail.isPicked("bands", "5")).toBe(true);
    expect(await secondRail.isPicked("bands", "6")).toBe(true);
    await expect(secondStage.targetName).toContainText("Barnard");
    await second.close();

    await page.locator("#tomap").click();
    await waitMapScreen(page);

    await page.goBack();
    await expect.poll(() => screen(page)).toBe("view");
    expect(await urlParams(page)).toMatchObject({ target: "barnard", det: "5,6" });

    await page.goForward();
    await waitMapScreen(page);
    expect(await screen(page)).toBe("map");
  });

  // UI-031 · P1 · viewer.md §Loading a view (EX-02)
  // Expected: opening B while A is still loading leaves the last view as B;
  // title, URL and frames never fall back to A. Barnard's view request is held
  // back by six seconds (client-side route delay) to make the overlap deterministic.
  test("[UI-031] Phản hồi cũ không ghi đè", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-031", "P1", "viewer.md §Loading a view; simulated slow network via route delay");
    test.setTimeout(180_000);

    await page.route("**/api/view?*target=barnard*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 6_000));
      await route.continue();
    });

    await open(page, "/?ui=adv");
    await topBar.search("barnard");
    await page.waitForTimeout(1_500); // A is in flight, held by the route delay

    await page.locator("#featured .target").filter({ hasText: "Epsilon" }).first().click();
    await waitViewScreen(page);
    await expect(viewStage.targetName).toHaveText("Epsilon Indi B", { timeout: 60_000 });
    expect(await urlParams(page)).toMatchObject({ target: "eps-indi-b" });

    // Wait past the moment the late response of A arrives; it must be discarded.
    await page.waitForTimeout(6_500);
    await expect(viewStage.targetName).toHaveText("Epsilon Indi B");
    expect(await urlParams(page)).toMatchObject({ target: "eps-indi-b" });
    expect(await screen(page)).toBe("view");
  });
});
