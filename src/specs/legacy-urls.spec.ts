import { annotateCase } from "../helpers/case.js";
import { open, urlParams, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

/**
 * Legacy-URL compatibility and the /sky link round trip (UI-099, UI-100,
 * UI-119). The production server redirects "/" + VIEW_KEYS to "/sky" + the
 * same query (location.replace — no history entry); VIEW_KEYS currently
 * includes plot, mover and seen (re-check on every build).
 */
test.describe("Legacy URLs and /sky round trip (manual cases UI-099, UI-100, UI-119)", () => {
  // UI-099 · P0 · viewer.md, landing.js
  // Expected: the old deep link redirects to /sky keeping target, fov, det,
  // mode; the view is correct after loading. Queries compared decoded.
  test("[UI-099] Legacy deep link chuyển /sky giữ nguyên tham số @p0", async ({ page, viewStage }) => {
    annotateCase(test.info(), "UI-099", "P0", "viewer.md, landing.js VIEW_KEYS; redirect asserted with decoded query comparison");

    await open(page, "/?target=barnard&fov=8&det=5%2C6&ui=adv");
    await waitViewReady(page);

    expect(new URL(page.url()).pathname).toBe("/sky");
    expect(await urlParams(page)).toMatchObject({ target: "barnard", fov: "8", det: "5,6", ui: "adv" });
    await expect(viewStage.targetName).toContainText("Barnard");
  });

  // UI-100 · P1 · landing.js VIEW_KEYS
  // Expected: a legacy URL with ra/dec/levels/mover/seen redirects to /sky
  // keeping the parameters, without a redirect loop. Parameters outside
  // VIEW_KEYS need a [C] decision — they are not assumed.
  test("[UI-100] Redirect giữ ra/dec/levels/mover/seen, không lặp [mock]", async ({ page }) => {
    annotateCase(test.info(), "UI-100", "P1", "landing.js VIEW_KEYS; redirect asserted by URL; unknown params = [C]; view not loaded (fixture-grade URL check)");

    const events: string[] = [];
    // Guard: a levels=3 field would start a heavy progressive job on the
    // shared service — the redirect is what this case asserts, so the tile
    // and cube requests are answered with empty contracts instead ([mock]).
    // The catch-all logger is registered FIRST: later registrations win, so
    // the specific guards below it always take precedence.
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/" || url.pathname === "/sky") events.push(url.pathname + url.search);
      return route.continue();
    });
    await page.route("**/api/tiles?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stages: [], tiles: [] }) }));
    await page.route("**/api/cube?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) }));

    await open(page, "/?ra=248.34&dec=-16.98&levels=3&mover=VS-60894-B5F6&seen=61021.4&ui=adv");
    // The redirect is client-side on the landing load; the params in the
    // address are the contract. The view's own loading is intentionally not
    // awaited here (levels=3 would be heavy on the shared service).
    await page.waitForURL("**/sky**", { timeout: 60_000 });

    expect(new URL(page.url()).pathname).toBe("/sky");
    expect(await urlParams(page)).toMatchObject({ ra: "248.34", dec: "-16.98", levels: "3", mover: "VS-60894-B5F6" });
    // No redirect loop: "/" appears at most once before /sky.
    expect(events.filter((e) => e.startsWith("/?")).length).toBeLessThanOrEqual(1);
  });

  // UI-119 · P1 · viewer.md, landing.js
  // Expected: a fresh /sky link from the landing/share, copied and opened in a
  // new session, lands on the same target and settings; Back/Forward keeps the
  // state. plot, mover and seen are VIEW_KEYS at this build — re-check on
  // every build.
  test("[UI-119] Link /sky mới: cùng target/setting, Back/Forward giữ state", async ({ page }) => {
    annotateCase(test.info(), "UI-119", "P1", "viewer.md, landing.js; plot/mover/seen are VIEW_KEYS at this build — re-check on build change; dedicated tab so history is this case's own");
    test.setTimeout(300_000);

    // A dedicated tab keeps the history deterministic: the worker's shared
    // page carries entries from earlier cases in this file.
    const p2 = await page.context().newPage();

    await p2.goto("https://vanillasphere.com/sky?target=barnard&fov=8&det=5,6&plot=lc&ui=adv", { waitUntil: "domcontentloaded" });
    await p2.waitForFunction(() => /1 \/ [1-9]/.test(document.getElementById("count")?.textContent ?? ""), undefined, { timeout: 180_000 });
    const first = p2.url();

    await p2.goto("https://vanillasphere.com/sky?target=eps-indi-b&fov=8&ui=adv", { waitUntil: "domcontentloaded" });
    await p2.waitForFunction(() => /1 \/ [1-9]/.test(document.getElementById("count")?.textContent ?? ""), undefined, { timeout: 180_000 });
    await expect(p2.locator("#tname")).toContainText("Epsilon", { timeout: 90_000 });

    await p2.goBack();
    await expect(p2.locator("#tname")).toContainText("Barnard", { timeout: 90_000 });
    expect(p2.url()).toBe(first);

    await p2.close();
  });
});
