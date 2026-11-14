import { annotateCase } from "../helpers/case.js";
import { open, urlParams, waitViewReady } from "../helpers/app.js";
import { MOVER_ID, mockMoverRoutes, moverDetail, openPinnedMover, pickBarnardExposure } from "../helpers/mover-fixture.js";
import { expect, test } from "../fixtures.js";

test.describe("Discoveries, movers, votes and following (manual cases UI-066 .. UI-071)", () => {
  // UI-066 · P1 · features.md §17
  // Expected: Discoveries lists found movers sorted fastest first; the tabs
  // filter fast (>= 20 arcsec/h) and slow (2-20); Following is per browser.
  // The list comes from a route mock ([mock]); production is never asked to
  // run a blind search.
  test("[UI-066] Discoveries: bộ lọc All/Fast/Slow/Following [mock]", async ({ page }) => {
    annotateCase(test.info(), "UI-066", "P1", "features.md §17; movers served by route mock [mock]; fast/slow boundary 20 arcsec/h asserted");

    const movers = [
      { id: "qa-slow-1", ra0: 100, dec0: 10, v_east: 3, v_north: 4, mjd0: 61000, rate_arcsec_hr: 5, pa_deg: 53, times_seen: 2, n_times: 2, times_covered: 4, known: { by: "SkyBoT", sep_arcsec: 1.2, checked: true }, votes: { real: 0, false: 0 }, my_vote: null, points: [] },
      { id: "qa-fast-1", ra0: 200, dec0: -20, v_east: 24, v_north: 18, mjd0: 61000, rate_arcsec_hr: 30, pa_deg: 37, times_seen: 4, n_times: 4, times_covered: 6, known: null, votes: { real: 2, false: 1 }, my_vote: null, points: [] },
      { id: "qa-slow-2", ra0: 300, dec0: 40, v_east: -6, v_north: -8, mjd0: 61000, rate_arcsec_hr: 10, pa_deg: 233, times_seen: 2, n_times: 2, times_covered: 3, known: null, votes: { real: 0, false: 0 }, my_vote: null, points: [] },
    ];
    // The real service returns the list sorted fastest first; the mock keeps that contract.
    const sorted = movers.slice().sort((a, b) => b.rate_arcsec_hr - a.rate_arcsec_hr);
    await page.route("**/api/movers?*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ movers: sorted, total: sorted.length }) }),
    );

    await open(page, "/");
    await page.locator('#dolist .do[data-do="movers"]').click();
    const sheet = page.locator("#discoveries");
    await expect(sheet).toBeVisible();

    // All, sorted fastest first.
    await page.locator("#logtabs button[data-v=\"all\"]").click();
    await expect(sheet.locator("#loglist li")).toHaveCount(3, { timeout: 30_000 });
    const rates = await sheet.locator("#loglist li").evaluateAll((rows) =>
      rows.map((row) => Number((/(\d+(?:\.\d+)?)″\/h/.exec(row.textContent ?? "") ?? [])[1])),
    );
    expect(rates).toEqual([30, 10, 5]);

    await page.locator('#logtabs button[data-v="fast"]').click();
    await expect(sheet.locator("#loglist li")).toHaveCount(1);
    await expect(sheet.locator("#lognote")).not.toBeEmpty();

    await page.locator('#logtabs button[data-v="slow"]').click();
    await expect(sheet.locator("#loglist li")).toHaveCount(2);

    await page.locator('#logtabs button[data-v="follow"]').click();
    await expect(sheet.locator("#loglist li")).toHaveCount(0);
    await expect(sheet.locator("#lognote")).not.toBeEmpty();
    await page.locator("#log-close").click();
    await expect(sheet).toBeHidden();
    await page.mouse.move(5, 420);
    await page.waitForTimeout(200);
  });

  // UI-067 · P0 · features.md §17
  // Expected: a mover deep link pins the object and opens its frame: URL keeps
  // mover and seen, one frame per exposure in the taken band, the card stays.
  // The mover itself is a route mock ([mock]); the opened frame is a real
  // read-only Barnard view. "Ring does not cover the object" is a pixel oracle
  // and is not asserted.
  test("[UI-067] Deep link mover/seen mở đúng frame [mock]", async ({ page, request, viewStage, extras }) => {
    annotateCase(test.info(), "UI-067", "P0", "features.md §17; mover = route mock [mock], frame = real read-only Barnard view; ring pixels not asserted");

    const epoch = await pickBarnardExposure(request);
    mockMoverRoutes(page, epoch);
    await openPinnedMover(page, epoch);

    const params = await urlParams(page);
    expect(params.mover).toBe(MOVER_ID);
    expect(params.seen).toBe(epoch.uid);
    expect(params.group).toBe("exposure");
    expect(params.det).toBe("6");

    await expect(extras.moverCard).toBeVisible();
    await expect(extras.moverList).toBeVisible();
    await expect(extras.moverList.locator("li").first()).toContainText("D6");
    // The seen exposure is the frame on screen.
    expect((await viewStage.framePosition()).index).toBe(epoch.index + 1);
  });

  // UI-068 · P0 · features.md §17
  // Not automated: "Back to the field" and the wide-field deep-link fallback
  // (group exposure -> day) both need a loaded progressive field; running one
  // against production or dev is forbidden. Waits for an approved isolated
  // staging backend.
  test("[UI-068] Back to field và fallback wide+exposure (cần staging)", async () => {
    annotateCase(test.info(), "UI-068", "P0", "features.md §17; needs a progressive field on an approved isolated staging backend");
    test.skip(true, "Both legs need a wide progressive field: forbidden on production/dev, staging not available.");
  });

  // UI-069 · P1 · features.md §17
  // Expected: with a pinned mover the overlay draws path with arrow and the
  // ring at the current frame (pixels not asserted); unticking hides it; in a
  // foreign band the card says which detector to pick. Path pixels are a [C]
  // visual oracle; the band note and the checkbox are asserted.
  test("[UI-069] Overlay mover: bật/tắt và chỉ dẫn band sai [mock, partial]", async ({ page, request, advancedRail, extras }) => {
    annotateCase(test.info(), "UI-069", "P1", "features.md §17; mover = route mock [mock]; path/ring pixels = [C] not asserted (partial)");

    const epoch = await pickBarnardExposure(request);
    mockMoverRoutes(page, epoch);
    await openPinnedMover(page, epoch);
    await expect(extras.moverCard).toBeVisible();
    await expect(extras.moverOption).toBeVisible();
    await expect(extras.moversCheckbox).toBeChecked();

    await extras.moversCheckbox.uncheck();
    await expect(extras.moversCheckbox).not.toBeChecked();
    await extras.moversCheckbox.check();

    // A band that is not the exposure's own: the card tells which detector.
    await advancedRail.pick("bands", "rgb");
    await expect(extras.moverCard).toContainText("D6");
  });

  // UI-070 · P1 · features.md §17
  // Expected: "Real motion" votes, voting again takes it back, "False alarm"
  // switches; one vote per browser. The vote endpoint is a route mock ([mock]);
  // no vote request ever reaches production or dev.
  test("[UI-070] Vote Real motion / False alarm [mock]", async ({ page, request, extras }) => {
    annotateCase(test.info(), "UI-070", "P1", "features.md §17; vote endpoint = route mock [mock], nothing reaches a real server; two-choice rule = [C]");

    const epoch = await pickBarnardExposure(request);
    mockMoverRoutes(page, epoch);
    await openPinnedMover(page, epoch);
    await expect(extras.moverCard).toBeVisible();

    const real = extras.moverCard.getByRole("button", { name: "Real motion" });
    const wrong = extras.moverCard.getByRole("button", { name: "False alarm" });

    await real.click();
    await expect(real).toHaveAttribute("aria-pressed", "true");
    await expect(extras.moverNote).toContainText("Vote counted");

    await real.click(); // voting again takes the vote back
    await expect(real).toHaveAttribute("aria-pressed", "false");
    await expect(extras.moverNote).toContainText("taken back");

    await wrong.click();
    await expect(wrong).toHaveAttribute("aria-pressed", "true");
    await expect(real).toHaveAttribute("aria-pressed", "false");
  });

  // UI-071 · P1 · features.md §17
  // Expected: Follow keeps the object in this browser across reloads; clearing
  // local data loses it; other browsers are unaffected (separate contexts by
  // construction). The list endpoint is a route mock ([mock]); Follow itself
  // is local-only.
  test("[UI-071] Follow giữ sau reload, mất khi xoá localStorage [mock]", async ({ page, request, extras }) => {
    annotateCase(test.info(), "UI-071", "P1", "features.md §17; list = route mock [mock]; Follow is localStorage-only by design");

    const epoch = await pickBarnardExposure(request);
    mockMoverRoutes(page, epoch);
    // A mock for the Discoveries list too: the followed object must appear there.
    await page.route("**/api/movers?ids=*", async (route) => {
      const ids = new URL(route.request().url()).searchParams.get("ids") ?? "";
      const detail = moverDetail(epoch);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ movers: ids.includes(MOVER_ID) ? [{ ...detail, points: undefined, votes: { real: 1, false: 0 } }] : [], total: 1 }),
      });
    });

    await openPinnedMover(page, epoch);
    await expect(extras.moverCard).toBeVisible();

    const follow = extras.moverCard.getByRole("button", { name: "Follow" });
    await follow.click();
    await expect(extras.moverCard.getByRole("button", { name: "Following" })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vs.follow") ?? "[]"))).toContain(MOVER_ID);

    await page.reload();
    await waitViewReady(page);
    await expect(extras.moverCard).toBeVisible();
    await expect(extras.moverCard.getByRole("button", { name: "Following" })).toBeVisible();

    // The Discoveries "Following" tab lists it after reload.
    await page.locator("#openlog").click();
    await expect(page.locator("#discoveries")).toBeVisible();
    await page.locator('#logtabs button[data-v="follow"]').click();
    await expect(page.locator("#loglist li").first()).toContainText("qa-mover-1");
    await page.locator("#log-close").click();

    // Clearing local data loses the follow.
    await page.evaluate(() => localStorage.removeItem("vs.follow"));
    await page.reload();
    await waitViewReady(page);
    await expect(extras.moverCard).toBeVisible();
    await expect(extras.moverCard.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(page.locator("#discoveries")).toBeHidden();
  });
});
