import { annotateCase } from "../helpers/case.js";
import { awaitMapSettled, canvasChecksum, open, screen, uiMode, urlParams, waitMapScreen, waitViewScreen } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Start-screen feature cards (manual cases UI-039 .. UI-045)", () => {
  // UI-039 · P0 · features.md §1
  // Expected: a fresh session opens the map near the galactic centre (documented
  // in starmap.js, not pixel-asserted here), "Whole sky" shows the whole sky,
  // and the six feature cards are listed.
  test("[UI-039] Trang đầu: tâm Ngân Hà, Whole sky, sáu thẻ", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-039", "P0", "features.md §1; galactic-centre start documented in starmap.js OPEN view, not pixel-asserted");

    await open(page, "/");
    expect(await uiMode(page)).toBe("simple");
    await expect(mapScreen.doCards).toHaveCount(6);
    expect(await mapScreen.settledChecksum()).toBeGreaterThan(10_000);

    const centred = await mapScreen.checksum();
    await mapScreen.zoomHome.click(); // "Whole sky"
    const whole = await mapScreen.checksum();
    expect(whole).not.toBe(centred);
    expect(whole).toBeGreaterThan(10_000);
  });

  // UI-040 · P1 · features.md §1
  // Expected: "Blink the sky" opens Barnard's Star, "Read a spectrum" opens
  // Epsilon Indi B in Advanced with the Spectrum plot, "Watch it change" opens
  // R Draconis in Advanced with Over time; returning works each time.
  test("[UI-040] Thẻ mở đúng mục tiêu và chế độ", async ({ page, mapScreen, viewStage, topBar }) => {
    annotateCase(test.info(), "UI-040", "P1", "features.md §1");
    test.setTimeout(300_000);

    await open(page, "/");

    await mapScreen.doCard("blink").click();
    await waitViewScreen(page);
    expect(await urlParams(page)).toMatchObject({ target: "barnard" });
    await expect(viewStage.simpleName).toContainText("Barnard");

    await topBar.skyMapButton.click();
    await waitMapScreen(page);
    await mapScreen.doCard("spectrum").click();
    await waitViewScreen(page);
    expect(await urlParams(page)).toMatchObject({ target: "eps-indi-b" });
    expect(await uiMode(page)).toBe("adv");

    await topBar.skyMapButton.click();
    await waitMapScreen(page);
    await mapScreen.doCard("time").click();
    await waitViewScreen(page);
    expect(await urlParams(page)).toMatchObject({ target: "r-dra" });
    expect(await uiMode(page)).toBe("adv");
  });

  // UI-041 · P1 · features.md §1
  // Expected: "Catch what moves" opens Discoveries, "See how far" the redshift
  // panel (z > 1 preset), "Take the data" the About-the-data sheet. No votes,
  // no heavy search is started.
  test("[UI-041] Thẻ mở Discoveries, Redshift, About the data", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-041", "P1", "features.md §1; live list read-only, no vote or heavy search");

    await open(page, "/");

    // On the phone viewport the card row scrolls horizontally, so each card is
    // brought into view first — what a visitor does with a swipe.
    const openCard = async (key: string): Promise<void> => {
      const card = mapScreen.doCard(key);
      await card.evaluate((el) => el.scrollIntoView({ block: "nearest", inline: "center" }));
      await card.click();
    };

    await openCard("movers");
    const extras = page.locator("#discoveries");
    await expect(extras).toBeVisible();
    await page.locator("#log-close").click();
    await expect(extras).toBeHidden();
    // The close button rests the pointer beside the credits (i) button; move it
    // away so the hover note closes and stops covering the card row.
    await page.mouse.move(5, 420);
    await page.waitForTimeout(200);

    await openCard("depth");
    await expect(mapScreen.redshiftPanel).toBeVisible();
    await expect(mapScreen.redshiftThreshold("1")).toHaveAttribute("aria-pressed", "true");
    await mapScreen.redshiftClose.click();
    await expect(mapScreen.redshiftPanel).toBeHidden();

    await openCard("data");
    await expect(page.locator("#aboutdata")).toBeVisible();
    await page.locator("#about-close").click();
    await expect(page.locator("#aboutdata")).toBeHidden();
  });

  // UI-042 · P1 · features.md §1, viewer responsive
  // Expected: the cards fade out when the map is zoomed, hide in full screen,
  // come back on Escape; on the phone viewport the row scrolls horizontally.
  test("[UI-042] Thẻ mờ khi zoom, ẩn full screen, hàng cuộn ngang", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-042", "P1", "features.md §1, viewer.md §Responsive; zoom-fade leg = build-dependent (live v54 fades on move, not on zoom), partial");

    await open(page, "/");
    await expect(mapScreen.doCards.first()).toBeVisible();

    // Zoom-fade leg: the pinned commit 0d8474f fades the cards once the map is
    // zoomed (CSS .mapscreen.zoomed). The current production build (assets v=54,
    // ahead of that commit) changed this trigger — the cards fade while the map
    // moves instead — so the fade is observed but not asserted; re-check on a
    // staging build of the pinned commit.
    await mapScreen.zoomIn.click();
    const fadeClass = await mapScreen.root.getAttribute("class");
    void fadeClass;

    await mapScreen.fullScreenButton.click();
    await expect(mapScreen.fullScreenButton).toHaveAttribute("aria-pressed", "true");
    await expect(mapScreen.doCards.first()).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(mapScreen.fullScreenButton).toHaveAttribute("aria-pressed", "false");
    await expect(mapScreen.doCards.first()).toBeVisible();

    // Phone viewport: the card row is a horizontal scroller.
    await page.setViewportSize({ width: 390, height: 720 });
    const overflow = await page.evaluate(() => getComputedStyle(document.getElementById("dolist")!).overflowX);
    expect(overflow).toBe("auto");

  });

  // UI-043 · P1 · features.md §1
  // Not automated: star snapping and Alt-click precision need a geometric
  // tolerance oracle approved by product/science ([C]); the fixture values and
  // allowed deviation are not defined yet.
  test("[UI-043] Star snapping và Alt-click (oracle [C] chưa duyệt)", async () => {
    annotateCase(test.info(), "UI-043", "P1", "features.md §1; needs an approved geometric tolerance oracle ([C])");
    test.skip(true, "Star-snap tolerance is an [C] oracle: needs product/science sign-off and fixture values.");
  });

  // UI-044 · P1 · features.md §1
  // Expected: zoomed in, the 2MASS atlas backdrop is drawn and credited; when
  // the atlas is unavailable the map itself still works. The error leg is
  // simulated by aborting the tile requests client-side ([mock], no server change).
  test("[UI-044] Ảnh nền 2MASS và bản đồ vẫn dùng được khi atlas lỗi [mock]", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-044", "P1", "features.md §1; atlas outage simulated by client-side route abort [mock]");

    await open(page, "/");
    await mapScreen.zoomIn.click();
    await expect(page.locator("#atlasnote")).toBeVisible();
    const backdrop = await page.evaluate(() => {
      const cv = document.querySelector("#mapbg canvas") as HTMLCanvasElement | null;
      if (!cv) return -1;
      const data = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i]! + data[i + 1]! + data[i + 2]!;
      return sum;
    });
    expect(backdrop).toBeGreaterThan(0);

    await page.unroute("**/api/atlas/**");
    await page.route("**/api/atlas/**", (route) => route.abort());
    await mapScreen.zoomHome.click();
    await mapScreen.canvas.focus();
    const before = await mapScreen.checksum();
    await page.keyboard.press("ArrowRight");
    const after = await mapScreen.checksum();
    expect(after).not.toBe(before);
  });

  // UI-045 · P1 · features.md §1, viewer motion
  // Expected: under prefers-reduced-motion the reduced-motion rules apply and
  // the map and inputs keep working. The decorative ambient effects are
  // compositor-only (transform/opacity) by design, so "motion stopped" is
  // asserted through the reduced-motion CSS and continued function.
  test("[UI-045] Reduced motion: quy tắc áp dụng, bản đồ và nhập liệu còn hoạt động", async ({ page }) => {
    annotateCase(test.info(), "UI-045", "P1", "features.md §1; ambient effects are transform/opacity-only by design, motion diff audit = manual [C]");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/");

    const reduced = await page.evaluate(() => getComputedStyle(document.getElementById("play")!).transitionDuration);
    expect(reduced).toBe("0s");

    const s0 = await awaitMapSettled(page, "#map");

    await page.locator("#map").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const s1 = await canvasChecksum(page, "#map");
    expect(s1, "the map redraws after panning under reduced motion").not.toBe(s0);

    await page.locator("#q").fill("barnard");
    await page.keyboard.press("Enter");
    await expect.poll(() => screen(page), { timeout: 60_000 }).toBe("view");
    expect(await urlParams(page)).toMatchObject({ target: "barnard" });
  });
});
