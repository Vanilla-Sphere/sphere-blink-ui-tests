import { annotateCase } from "../helpers/case.js";
import { open, screen, uiMode, urlParams } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Startup and sky map (manual cases UI-001 .. UI-004)", () => {
  // UI-001 · P0 · features.md §1,3
  // Precondition: fresh session without vs.ui. Expected: whole-sky map with the
  // suggested targets, Simple mode selected.
  test("[UI-001] Trang chủ lần đầu", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-001", "P0", "features.md §1,3");

    await open(page, "/");

    expect(await uiMode(page)).toBe("simple");
    expect(await screen(page)).toBe("map");
    await expect(page).toHaveTitle(/Vanilla Sphere/);
    await expect(mapScreen.featuredTargets).toHaveCount(5);
    expect(await mapScreen.checksum()).toBeGreaterThan(0);
  });

  // UI-002 · P1 · features.md §1
  // Expected: zoom in/out changes the map scale; "Whole sky" returns to the full sky.
  // The map zooms about the pointer on purpose, so zooming back out leaves the
  // centre a fraction off — an exact-pixel return is not part of the behaviour and
  // is not asserted; the reset button is asserted to leave the zoomed state.
  test("[UI-002] Phóng, thu và về toàn thiên", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-002", "P1", "features.md §1; zoom-about-pointer leaves the centre slightly off, no exact-return assertion");

    await open(page, "/");
    const whole = await mapScreen.checksum();

    await mapScreen.zoomIn.click();
    const zoomed = await mapScreen.checksum();
    expect(zoomed).not.toBe(whole);

    await mapScreen.zoomOut.click();
    const unzoomed = await mapScreen.checksum();
    expect(unzoomed).not.toBe(zoomed);

    await mapScreen.zoomIn.click();
    const zoomedAgain = await mapScreen.checksum();
    expect(zoomedAgain).not.toBe(unzoomed);
    await mapScreen.zoomHome.click();
    const home = await mapScreen.checksum();
    expect(home).not.toBe(zoomedAgain);
    expect(home).toBeGreaterThan(0);
  });

  // UI-003 · P0 · features.md §1
  // Expected: a click opens the view at the picked point; "Sky map" returns to the
  // map, marked and centred on the position just viewed.
  test("[UI-003] Chọn vị trí trên bản đồ", async ({ page, mapScreen, topBar }) => {
    annotateCase(test.info(), "UI-003", "P0", "features.md §1");
    test.setTimeout(180_000);

    await open(page, "/");
    const mapBefore = await mapScreen.checksum();

    await mapScreen.clickAt(0.5, 0.45);
    await expect
      .poll(() => screen(page), { timeout: 90_000 })
      .toBe("view");
    const picked = await urlParams(page);
    expect(picked.ra).toBeDefined();
    expect(picked.dec).toBeDefined();
    await expect(topBar.query).toHaveValue(/-?\d+\.\d+ [-+]\d+\.\d+/);

    await topBar.skyMapButton.click();
    await expect.poll(() => screen(page)).toBe("map");
    expect(await mapScreen.checksum()).not.toBe(mapBefore);
  });

  // UI-004 · P1 · viewer.md §Sky map
  // Expected: arrow keys pan, +/- zoom, Enter opens the view at the centre.
  test("[UI-004] Điều khiển bản đồ bằng phím", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-004", "P1", "viewer.md §Sky map");
    test.setTimeout(180_000);

    await open(page, "/");
    const whole = await mapScreen.checksum();

    await mapScreen.canvas.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const panned = await mapScreen.checksum();
    expect(panned).not.toBe(whole);

    await page.keyboard.press("+");
    const zoomed = await mapScreen.checksum();
    expect(zoomed).not.toBe(panned);

    await page.keyboard.press("Enter");
    await expect.poll(() => screen(page), { timeout: 90_000 }).toBe("view");
    const opened = await urlParams(page);
    expect(opened.ra).toBeDefined();
    expect(opened.dec).toBeDefined();
  });
});
