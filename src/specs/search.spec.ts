import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, urlParams, waitViewReady, waitViewScreen } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

const UNKNOWN_NAME = "zzzzzzz-not-a-real-star-123456";

test.describe("Search (manual cases UI-005 .. UI-012)", () => {
  // UI-005 · P0 · features.md §2,16
  // Expected: choosing the suggested target opens its view with images and the
  // target in the URL.
  test("[UI-005] Mở mục tiêu gợi ý", async ({ page, mapScreen, viewStage }) => {
    annotateCase(test.info(), "UI-005", "P0", "features.md §2,16");

    await open(page, "/");
    // The target list is built from /api/featured, which can be slow when the
    // shared service is busy.
    await expect(mapScreen.featuredTargets).toHaveCount(5, { timeout: 60_000 });
    await mapScreen.openTarget("Barnard");
    await waitViewReady(page);

    expect(await urlParams(page)).toMatchObject({ target: "barnard" });
    await expect(viewStage.simpleName).toContainText("Barnard");
    await expect(page).toHaveTitle(/Barnard/);
    await expect(viewStage.statusCount).toHaveText(/Photo 1 of \d+/);
  });

  // UI-006 · P0 · features.md §2
  // Expected: a valid alias resolves and opens the target's view.
  test("[UI-006] Tìm tên hợp lệ", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-006", "P0", "features.md §2");

    await open(page, "/");
    await topBar.search("barnard");
    await waitViewReady(page);

    expect(await urlParams(page)).toMatchObject({ target: "barnard" });
    await expect(viewStage.simpleName).toContainText("Barnard");
  });

  // UI-007 · P0 · features.md §2
  // Expected: decimal degrees resolve; the displayed position matches the input.
  test("[UI-007] Tọa độ thập phân", async ({ page, topBar, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-007", "P0", "features.md §2");

    await open(page, "/?ui=adv");
    await topBar.search("269.4486 +4.7387");
    await waitViewScreen(page);

    await expect(viewStage.targetName).toHaveText(/^RA /);
    await expect(analysis.decimalPosition).toHaveText("269.44860° +4.73870°");
    await expect(viewStage.targetCoords).toHaveText("269.44860° +4.73870°");
  });

  // UI-008 · P1 · features.md §2
  // Expected: sexagesimal input resolves consistently (08h55m10.831s -07d14m42.53s
  // is RA 133.79513 deg, Dec -7.24515 deg).
  test("[UI-008] Tọa độ sexagesimal", async ({ page, topBar, analysis }) => {
    annotateCase(test.info(), "UI-008", "P1", "features.md §2");

    await open(page, "/?ui=adv");
    await topBar.search("08h55m10.831s -07d14m42.53s");
    await waitViewScreen(page);

    const text = await analysis.decimalPosition.textContent();
    const match = /(\d+\.\d+)°\s*([+−-])\s*(\d+\.\d+)°/.exec(text ?? "");
    expect(match, `decimal position "${text}" should parse`).not.toBeNull();
    const ra = Number(match![1]);
    const dec = Number(match![3]) * (match![2] === "+" ? 1 : -1);
    expect(Math.abs(ra - 133.79513)).toBeLessThan(0.02);
    expect(Math.abs(dec - -7.24515)).toBeLessThan(0.02);
  });

  // UI-009 · P0 · features.md §2 (EX-01)
  // Expected: an unknown name shows an alert and keeps the previous view and URL.
  test("[UI-009] Tên không tồn tại giữ view", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-009", "P0", "features.md §2");
    test.setTimeout(180_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    const counterBefore = await viewStage.counterText();

    await topBar.search(UNKNOWN_NAME);
    await expect(topBar.searchError).toBeVisible({ timeout: 60_000 });
    await expect(topBar.searchError).toContainText(UNKNOWN_NAME);
    await expect(topBar.searchError).toContainText("No object called");

    expect((await urlParams(page)).target).toBe("barnard");
    await expect(viewStage.targetName).toContainText("Barnard");
    expect(await viewStage.counterText()).toBe(counterBefore);
  });

  // UI-010 · P1 · features.md §2 (EX-01)
  // Expected: typing clears the old warning; a corrected search opens the view.
  test("[UI-010] Sửa lại tìm kiếm sau lỗi", async ({ page, topBar }) => {
    annotateCase(test.info(), "UI-010", "P1", "features.md §2");
    test.setTimeout(180_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await topBar.search(UNKNOWN_NAME);
    await expect(topBar.searchError).toBeVisible({ timeout: 60_000 });

    await topBar.query.fill("b");
    await expect(topBar.searchError).toBeHidden();

    await topBar.search("barnard");
    await waitViewReady(page);
    await expect(topBar.searchError).toBeHidden();
  });

  // UI-011 · P1 · features.md §2 (EX-01)
  // Expected: RA belongs to [0,360) and Dec to [-90,90]; out-of-domain input is
  // rejected locally with the "off the sky" message (no request is sent). The
  // display at the poles is observed.
  test("[UI-011] Biên tọa độ", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-011", "P1", "features.md §2");
    test.setTimeout(360_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    for (const bad of ["361 +4.7387", "-0.5 +4.7387", "269.4486 +90.5", "269.4486 -90.5"]) {
      await topBar.search(bad);
      await expect(topBar.searchError).toBeVisible({ timeout: 30_000 });
      await expect(topBar.searchError).toContainText("off the sky");
      expect((await urlParams(page)).target, `input "${bad}" must not change the view`).toBe("barnard");
    }

    // In-range edge values are accepted; the view resolves to the entered position.
    await topBar.search("0 +4.7387");
    await expect(viewStage.targetName).toHaveText(/^RA /, { timeout: 90_000 });
    await expect(viewStage.targetCoords).toContainText("0.00000°");

    await topBar.search("269.4486 +90");
    await expect(viewStage.targetCoords).toContainText("90.00000°", { timeout: 90_000 });

    await topBar.search("269.4486 -90");
    await expect(viewStage.targetCoords).toContainText("−90.00000°", { timeout: 90_000 });
  });

  // UI-012 · P1 · features.md §2
  // Expected: an unreachable name service gives a service error message that is
  // different from "not found", and keeps the current view.
  // Simulated here by fulfilling the view request with the documented 503
  // contract (Playwright route interception, client side only). On a staging
  // environment the same test runs against a real broken name service.
  test("[UI-012] Dịch vụ tên không khả dụng (mô phỏng hợp đồng 503)", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-012", "P1", "features.md §2; simulated via route interception");

    const serviceMessage = "the name service did not answer; try again shortly or give coordinates";
    await page.route("**/api/view?*target=svc-outage-xyz*", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: serviceMessage }) }),
    );

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await topBar.search("svc-outage-xyz");
    await expect(topBar.searchError).toBeVisible({ timeout: 30_000 });
    await expect(topBar.searchError).toHaveText(serviceMessage);
    await expect(topBar.searchError).not.toContainText("No object called");

    expect((await urlParams(page)).target).toBe("barnard");
    await expect(viewStage.targetName).toContainText("Barnard");
  });
});
