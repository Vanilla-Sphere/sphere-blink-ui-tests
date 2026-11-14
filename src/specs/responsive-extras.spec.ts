import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, screen, urlParams, waitViewReady, waitViewScreen } from "../helpers/app.js";
import { mockMoverRoutes, openPinnedMover, pickBarnardExposure } from "../helpers/mover-fixture.js";
import { waitForReading } from "../helpers/reading.js";
import { computedStyle } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("New routes responsive and combined flows (manual cases UI-074 .. UI-076)", () => {
  // UI-074 · P1 · viewer responsive
  // Expected: at the 480 and 760 boundaries the new elements keep working — the
  // card row scrolls horizontally on phones, the controls keep their enlarged
  // touch height. The 200% browser zoom and the formal accessibility standard
  // ([C]) are not covered by automation here.
  test("[UI-074] Biên 480/760 cho thẻ và controls mới", async ({ page }) => {
    annotateCase(test.info(), "UI-074", "P1", "viewer.md §Responsive; build v54 note: touch height is pointer:coarse-driven, 200% zoom and the a11y standard = [C]");

    await open(page, "/");
    for (const width of [479, 480, 481]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(150);
      await expect(page.locator("#dolist .do").first()).toBeVisible();
      const overflow = await computedStyle(page, "#dolist", "overflow-x");
      expect(overflow, `dolist overflow at ${width}px`).toBe("auto");
    }

    // Width markers of the deployed build (v54): the search row drops to its
    // own line at 1000 px, and the Advanced rail collapses into the flow at 760 px.
    await open(page, "/?ui=adv&target=barnard&fov=8");
    await waitViewScreen(page);
    for (const width of [759, 760, 761]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(150);
      const rail = await computedStyle(page, "aside.rail", "display");
      if (width <= 759) expect(rail, `rail display at ${width}px`).toBe("contents");
      else expect(rail, `rail display at ${width}px`).toBe("block");
    }
    for (const width of [999, 1000, 1001]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(150);
      const row = await computedStyle(page, "#search", "grid-row-start");
      if (width <= 999) expect(row, `search row at ${width}px`).toBe("2");
      else expect(row, `search row at ${width}px`).toBe("auto");
    }

    // The touch-enlarged controls are pointer-driven since build v54: on a
    // coarse pointer the controls keep 40 px at any width, on a fine pointer
    // (desktop project) they do not.
    const coarse = await page.evaluate(() => matchMedia("(pointer:coarse)").matches);
    const minHeight = await computedStyle(page, "#go", "min-height");
    if (coarse) expect(minHeight, "touch height under a coarse pointer").toBe("40px");
    else expect(minHeight === "40px", "no forced touch height under a fine pointer").toBe(false);
  });

  // UI-075 · P1 · features.md §9, viewer loading
  // Expected: with an enlarged Over-time group and flagged points shown,
  // switching targets on a slow network leaves the state with the NEW target;
  // the old responses never overwrite it. The slowness is simulated by a
  // client-side route delay ([mock]).
  test("[UI-075] Đổi target khi mạng chậm: trạng thái thuộc target mới [mock]", async ({ page, topBar, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-075", "P1", "features.md §9, viewer loading; slow network simulated by route delay [mock]");
    test.setTimeout(480_000);

    await page.route("**/api/view?*target=wise-0855*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4_000));
      await route.continue();
    });

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    // The reading goes with the Spectrum plot (app.js hides it in Over time),
    // so Barnard's reading is captured here, before switching the plot.
    const reading = analysis.readingLine;
    await expect(reading).not.toBeEmpty({ timeout: 120_000 });
    const barnardReading = await reading.innerText();

    await analysis.choosePlot("lc");
    await expect(analysis.overTimeNav).toBeVisible();
    await page.locator("#otnext").click(); // an enlarged group

    await topBar.search("wise-0855");
    await waitViewScreen(page);
    // The new target's state is fresh: the group navigation is gone until its
    // own plot is built, and the reading belongs to WISE 0855.
    await expect(analysis.overTimeNav).toBeHidden();
    await waitViewReady(page);
    await expect(viewStage.targetName).not.toContainText("Barnard");
    // Back to Spectrum: the reading belongs to that plot.
    await analysis.choosePlot("spec");
    await waitForReading(page);
    expect(await reading.innerText()).not.toBe(barnardReading);

    // Past the delayed response, nothing has fallen back to Barnard.
    await page.waitForTimeout(5_000);
    expect((await urlParams(page)).target).toBe("wise-0855");
    expect(await screen(page)).toBe("view");
  });

  // UI-076 · P1 · features.md §17, viewer URL
  // Expected: mover -> exposure frame -> reload / deep link / Back-Forward keep
  // the object and epoch consistent. The field leg (Back to field) needs a
  // progressive field on an approved staging backend and is deferred — the
  // mover leg runs on a route mock ([mock]) over a real, read-only view.
  test("[UI-076] Mover/exposure qua reload và Back/Forward [mock, partial]", async ({ page, request, extras }) => {
    annotateCase(test.info(), "UI-076", "P1", "features.md §17, viewer URL; mover leg = route mock [mock]; field leg needs staging (partial)");
    test.setTimeout(240_000);

    const epoch = await pickBarnardExposure(request);
    mockMoverRoutes(page, epoch);
    await openPinnedMover(page, epoch);

    // Reload keeps the pinned object and the frame.
    await page.reload();
    await waitViewReady(page);
    await expect(extras.moverCard).toBeVisible();
    expect((await urlParams(page)).seen).toBe(epoch.uid);

    // Back to the map and forward again to the mover view.
    await page.locator("#tomap").click();
    await expect.poll(() => screen(page)).toBe("map");
    await page.goBack();
    await expect.poll(() => screen(page), { timeout: 60_000 }).toBe("view");
    expect((await urlParams(page)).mover).toBe("qa-mover-1");
    await page.goForward();
    await expect.poll(() => screen(page)).toBe("map");
  });
});
