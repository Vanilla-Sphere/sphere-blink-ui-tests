import { expect, test } from "../fixtures.js";
import { computedStyle, open, screen, uiMode } from "../helpers/app.js";
import { annotateCase } from "../helpers/case.js";

/* Instant checks: everything that never loads a view or cuts data on the
   server. They run first, fully parallel, before the single-flow journey. */

test.describe("Instant checks, no data fetch (manual cases UI-001 .. UI-045)", () => {
  test.afterEach(async ({ sharedPage }, testInfo) => {
    await sharedPage.unrouteAll();
    const viewport = (testInfo.project.use as { viewport?: { width: number; height: number } }).viewport ?? { width: 1280, height: 720 };
    await sharedPage.setViewportSize(viewport);
  });


  // UI-001 · P0 · features.md §1,3 (delta 0d8474f)
  // Precondition: fresh session without vs.ui. Expected: the map opens centred
  // near the galactic centre (starmap.js OPEN view, RA 266.4 Dec -29 — asserted
  // as "the map is drawn", not pixel-checked), the six feature cards are listed
  // with their destinations, the suggested targets are there, Simple is selected.
  // "Whole sky" returning to the full sky is UI-002.
  test("[UI-001] Trang chủ lần đầu @p0", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-001", "P0", "features.md §1,3; delta 0d8474f: start near the galactic centre, six feature cards, Whole sky resets");

    await open(page, "/");

    expect(await uiMode(page)).toBe("simple");
    expect(await screen(page)).toBe("map");
    await expect(page).toHaveTitle(/Vanilla Sphere/);
    await expect(mapScreen.featuredTargets).toHaveCount(5);
    await expect(mapScreen.doCards).toHaveCount(6);
    await expect(page.locator("#dolist .do .nm").first()).not.toBeEmpty();
    await expect(page.locator("#atlasnote")).toBeVisible();
    expect(await mapScreen.settledChecksum()).toBeGreaterThan(10_000);
  });


  // UI-002 · P1 · features.md §1
  // Expected: zoom in/out changes the map scale; "Whole sky" returns to the full sky.
  // The map zooms about the pointer on purpose, so zooming back out leaves the
  // centre a fraction off — an exact-pixel return is not part of the behaviour and
  // is not asserted; the reset button is asserted to leave the zoomed state.
  test("[UI-002] Phóng, thu và về toàn thiên", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-002", "P1", "features.md §1; zoom-about-pointer leaves the centre slightly off, no exact-return assertion");

    await open(page, "/");
    const whole = await mapScreen.settledChecksum();

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


  // UI-039 · P0 · features.md §1
  // Expected: a fresh session opens the map near the galactic centre (documented
  // in starmap.js, not pixel-asserted here), "Whole sky" shows the whole sky,
  // and the six feature cards are listed.
  test("[UI-039] Trang đầu: tâm Ngân Hà, Whole sky, sáu thẻ @p0", async ({ page, mapScreen }) => {
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
    const box = await mapScreen.canvas.boundingBox();
    await mapScreen.canvas.hover({ position: { x: Math.round((box?.width ?? 390) / 2), y: Math.round((box?.height ?? 500) / 2) } });
    if (await page.locator("#mapread").isVisible()) {
      await expect(page.locator("#mapread")).toContainText("°", { timeout: 15_000 });
    }
    await mapScreen.zoomIn.click(); // the map controls still answer
    await mapScreen.zoomHome.click();
  });


  // UI-034 · P1 · viewer.md §Accessibility (EX-04)
  // Expected: keyboard focus reaches the controls with a visible ring, the
  // one-line notes appear on keyboard focus, the (i) notes open on click and
  // close with Escape, icon buttons are labelled.
  test("[UI-034] Focus và tooltip", async ({ page }) => {
    annotateCase(test.info(), "UI-034", "P1", "viewer.md §Accessibility");

    await open(page, "/");

    await page.keyboard.press("Tab");
    // The note is meant to appear on keyboard focus; the generous window only
    // absorbs a slow first load of the shared site, it does not change the oracle.
    await page.waitForFunction(() => (document.getElementById("hintbox") ?? { hidden: true }).hidden === false, undefined, { timeout: 8_000 });
    const hint = await page.evaluate(() => document.getElementById("hintbox")?.textContent ?? "");
    expect(hint.length).toBeGreaterThan(0);

    // The focus ring is visible (:focus-visible outline).
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "";
      const style = getComputedStyle(el);
      return `${style.outlineStyle} ${style.outlineWidth}`;
    });
    expect(ring).toBe("solid 2px");

    // The (i) note opens on click and closes on Escape. The note also shows on
    // hover, so the pointer is moved off the control before checking that it is gone.
    await page.locator("nav.barlinks .tipbtn").click();
    await expect(page.locator("nav.barlinks .tip.open")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("nav.barlinks .tip.open")).toHaveCount(0);
    await page.mouse.move(8, 8);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("nav.barlinks .tipbody")!).visibility)).toBe("hidden");

    // Icon buttons carry accessible names.
    for (const id of ["map-in", "map-out", "map-home"]) {
      const label = await page.locator(`#${id}`).getAttribute("aria-label");
      expect(label?.length ?? 0, `#${id} needs an aria-label`).toBeGreaterThan(0);
    }
    const queryLabel = await page.locator("#q").getAttribute("aria-label");
    expect(queryLabel?.length ?? 0).toBeGreaterThan(0);
  });


  // UI-035 · P1 · viewer.md §Accessibility
  // Expected: motion is reduced under prefers-reduced-motion. Automated here as
  // the computed transition duration on a control. Reading the page with a
  // screen reader needs real assistive technology and is not covered.
  test("[UI-035] Reduced motion và screen reader", async ({ page }) => {
    annotateCase(test.info(), "UI-035", "P1", "viewer.md §Accessibility; screen-reader pass not automated");

    await open(page, "/");
    expect(await computedStyle(page, "#play", "transition-duration")).not.toBe("0s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await computedStyle(page, "#play", "transition-duration")).toBe("0s");
    expect(await computedStyle(page, "#bar", "transition-duration")).toBe("0s");
  });


  // UI-036 · P1 · viewer.md §Loading (EX-05)
  // Not automated: the case itself states that no recovery oracle has been
  // approved ("record the message, progress and recovery; do not conclude a
  // failure"). Network-fault injection needs an approved policy; observe this
  // case manually on staging per charter EX-05.
  test("[UI-036] Mất mạng khi đang tải", async () => {
    annotateCase(test.info(), "UI-036", "P1", "viewer.md §Loading; no approved recovery oracle, exploratory EX-05");
    test.skip(true, "No approved oracle for the recovery behaviour; needs fault injection on staging (EX-05).");
  });


  // UI-038 · P1 · viewer.md §Responsive (EX-04)
  // The smartphone project of this suite covers the emulated viewport
  // (390x844, touch, mobile user agent) for all other cases. Pinch, rotation
  // and layout on real hardware need a physical, approved device.
  test("[UI-038] Thiết bị chạm thật", async () => {
    annotateCase(test.info(), "UI-038", "P1", "viewer.md §Responsive; needs a real approved touch device");
    test.skip(true, "Needs a physical touch device; this suite only emulates the phone viewport (see README).");
  });


  // UI-043 · P1 · features.md §1
  // Not automated: star snapping and Alt-click precision need a geometric
  // tolerance oracle approved by product/science ([C]); the fixture values and
  // allowed deviation are not defined yet.
  test("[UI-043] Star snapping và Alt-click (oracle [C] chưa duyệt)", async () => {
    annotateCase(test.info(), "UI-043", "P1", "features.md §1; needs an approved geometric tolerance oracle ([C])");
    test.skip(true, "Star-snap tolerance is an [C] oracle: needs product/science sign-off and fixture values.");
  });
});
