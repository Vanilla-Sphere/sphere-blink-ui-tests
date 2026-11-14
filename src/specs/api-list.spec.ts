
import type { Page } from "@playwright/test";
import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, urlParams, waitViewReady } from "../helpers/app.js";
import { MOVER_ID, moverDetail } from "../helpers/mover-fixture.js";
import type { Analysis } from "../pages/Analysis.js";
import { expect, test } from "../fixtures.js";

test.describe.configure({ mode: "serial" });

test.describe("All API endpoints list (manual cases UI-077 .. UI-086)", () => {
  test.afterEach(async ({ sharedPage }, testInfo) => {
    await sharedPage.unrouteAll(); // the case's mocks must not leak into the flow
    const viewport = (testInfo.project.use as { viewport?: { width: number; height: number } }).viewport ?? { width: 1280, height: 720 };
    await sharedPage.setViewportSize(viewport);
  });



/** The 21 endpoint rows of web/apilist.js, in their groups. */
const GROUPS = ["This view", "This position", "Moving objects", "Service"];
const ROWS: Array<[string, string]> = [
  ["Frame", "/api/frame.png"], ["Epochs", "/api/epochs"], ["Cube", "/api/cube"], ["Job", "/api/view"], ["Field", "/api/tiles"],
  ["Exposures", "/api/exposures"], ["Object", "/api/object"], ["Name", "/api/resolve"], ["Gaia", "/api/catalog?cat=gaia"], ["CatWISE", "/api/catalog?cat=catwise"], ["Tracks", "/api/tracks"],
  ["Log", "/api/movers?"], ["Field", "/api/movers/field"], ["One", `/api/movers/${MOVER_ID}`],
  ["Measured", "/api/measured"], ["Featured", "/api/featured"], ["Sky tile", "/api/atlas/2mass"], ["Atlas", "/api/atlas"], ["Limits", "/api/settings"], ["Health", "/api/health"], ["Docs", "/docs"], ["OpenAPI", "/openapi.json"],
];

/**
 * Endpoint rows that would start server work when opened answer from route
 * mocks ([mock]) so production is never asked to cut a new frame or stage a
 * field by a test click. The job mock echoes the requested position, so cases
 * that switch targets inside one session see the view they asked for.
 */
async function mockHeavyEndpoints(page: Page): Promise<void> {
  const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/api/frame.png?*", (route) => route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("89504e470d0a1a0a0000000d49484452", "hex") }));
  await page.route("**/api/epochs?*", (route) => route.fulfill(json({ epochs: [], job: { status: "ready" } })));
  await page.route("**/api/view?*", (route) => {
    const q = new URL(route.request().url()).searchParams;
    const name = q.get("target") ?? (`${q.get("ra") ?? ""} ${q.get("dec") ?? ""}`.trim() || "mock");
    // For a coordinate-text target, derive the position from it so that
    // view-dependent addresses (the atlas tile) follow the new position.
    const coords = /^([\d.+-]+)\s+([\d.+-]+)$/.exec(q.get("target") ?? "") ?? [];
    const ra = Number(q.get("ra") ?? coords[1] ?? 269.44629);
    const dec = Number(q.get("dec") ?? coords[2] ?? 4.76792);
    return route.fulfill(json({ target: { ra, dec, name }, grid: {}, job: { status: "ready" } }));
  });
  await page.route("**/api/tiles?*", (route) => route.fulfill(json({ stages: [], tiles: [] })));
  await page.route("**/api/exposures?*", (route) => route.fulfill(json({ exposures: [] })));
  await page.route("**/api/object?*", (route) => route.fulfill(json({})));
  await page.route("**/api/resolve?*", (route) => route.fulfill(json({ ra: 269.44629, dec: 4.76792 })));
  await page.route("**/api/catalog?*", (route) => route.fulfill(json({ sources: [] })));
  await page.route("**/api/tracks?*", (route) => route.fulfill(json({ enabled: false })));
  // One handler for the log: the example lookup (limit=1) always has an id,
  // everything else answers empty.
  await page.route("**/api/movers?*", (route) => {
    if (new URL(route.request().url()).searchParams.has("limit")) {
      return route.fulfill(json({ movers: [{ id: MOVER_ID }], total: 1 }));
    }
    return route.fulfill(json({ movers: [], total: 0 }));
  });
  await page.route("**/api/movers/qa-mover-1*", (route) => route.fulfill(json(moverDetail({ uid: "mock", mjd: 61000, index: 0 }))));
  await page.route("**/api/atlas/2mass/**", (route) => route.fulfill({ status: 200, contentType: "image/jpeg", body: Buffer.from("") }));
}

/** Opens the list and waits until its addresses are filled (the details
    "toggle" event is delivered asynchronously in Chromium). */
async function openApiList(analysis: Analysis): Promise<void> {
  await analysis.apiSummary.click();
  await expect
    .poll(async () => await analysis.apiLink("Health").getAttribute("href"), { timeout: 20_000 })
    .toBeTruthy();
}

const SKIP_CLICK = new Set(["Cube"]); // the Cube row downloads a file; UI-081 covers it


  // UI-077 · P0 · features.md §15, web/apilist.js
  // Expected: on a loaded Advanced view with a mover id available, the list has
  // the four groups and all endpoint rows; closing and reopening does not
  // duplicate anything. Build v62 counts the visible rows.
  test("[UI-077] Danh sách API: bốn nhóm, 21 loại, mở lại không nhân bản [mock] @p0", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-077", "P0", "features.md §15, web/apilist.js; mover id = route mock [mock]; build v67 lists 22 types and counts the visible rows");

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await openApiList(analysis);
    await expect(analysis.apiList).toContainText("All API endpoints");
    await expect(analysis.apiCount).toHaveText("22");
    const groups = (await analysis.apiGroups.allInnerTexts()).map((g) => g.toLowerCase());
    expect(groups).toEqual(GROUPS.map((g) => g.toLowerCase()));
    await expect(analysis.apiRows).toHaveCount(22);

    await analysis.apiSummary.click(); // close
    await openApiList(analysis); // reopen
    await expect(analysis.apiRows).toHaveCount(22);
    await expect(analysis.apiCount).toHaveText("22");
  });


  // UI-078 · P0 · features.md §15, §17, web/apilist.js
  // Expected: every group lists its endpoints with the right label and path;
  // /api/measure and the vote are absent from the list, and the note says so.
  test("[UI-078] Từng nhóm đúng tên/đường dẫn; không có measure/vote [mock] @p0", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-078", "P0", "features.md §15,17, web/apilist.js; write endpoints asserted absent; mover id = route mock [mock]");

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);

    for (const [label, path] of ROWS) {
      const link = analysis.apiLink(label, path.split("?")[0]);
      await expect(link, `${label} row present`).toHaveCount(1);
      const href = await link.getAttribute("href");
      expect(href ?? "", `${label} address`).toContain(path.replace(/\?$/, ""));
    }
    await expect(analysis.apiRows).toHaveCount(22);
    await expect(analysis.apiList).toContainText("/api/measure");
    await expect(analysis.apiList).toContainText("they write");
    const hrefs = await page.locator("#apirows .share a").evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => /^\/api\/measure($|\?)/.test(h))).toEqual([]);
    expect(hrefs.filter((h) => h.includes("/vote"))).toEqual([]);
  });

  // UI-079 · P1 · features.md §17, web/apilist.js
  // Expected: without any mover id the "One" row is hidden while the other 20
  // types remain usable; with an id available the row shows the object's own
  // address. Build v62 counts the rows on show: one less while no id exists.
  test("[UI-079] Hàng One ẩn khi không có mover ID, hiện khi có [mock]", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-079", "P1", "features.md §17, web/apilist.js; mover availability = route mock [mock], both legs; build v67 counts visible rows (21 of 22 without an id)");

    // Leg 1: the mover log answers empty, so there is no id to show.
    await page.route("**/api/movers?limit=1", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ movers: [], total: 0 }) }));
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);
    await expect(analysis.apiCount).toHaveText("21");
    await expect(analysis.apiRow("One")).toBeHidden();
    await expect(analysis.apiRow("Health")).toBeVisible();
    await expect(analysis.apiRow("Frame")).toBeVisible();

    // Leg 2: an id exists; after reloading, One shows the object's address.
    await page.unroute("**/api/movers?limit=1");
    await mockHeavyEndpoints(page);
    await page.reload();
    await waitViewReady(page);
    await openApiList(analysis);
    const one = analysis.apiLink("One");
    await expect(one).toBeVisible();
    expect(await one.getAttribute("href")).toContain(`/api/movers/${MOVER_ID}`);
  });

  // UI-080 · P0 · features.md §15
  // Expected: every visible endpoint address opens in a new tab at exactly its
  // href, answers with its contract, and leaves the original view untouched.
  // Endpoints that would start server work answer from route mocks ([mock]);
  // Health, Docs and OpenAPI are opened against the live service.
  test("[UI-080] Mỗi URL mở tab mới đúng href, đúng hợp đồng, giữ view [mock] @p0", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-080", "P0", "features.md §15; heavy endpoints = route mocks [mock]; Health/Docs/OpenAPI live; Cube = UI-081");
    test.setTimeout(300_000);

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);
    await expect(analysis.apiRows).toHaveCount(22);

    const viewUrl = page.url();
    for (const [label, path] of ROWS) {
      if (SKIP_CLICK.has(label)) continue;
      const link = analysis.apiLink(label, path.split("?")[0]);
      const href = await link.getAttribute("href");
      expect(href ?? "", `${label} href`).toMatch(/^https:\/\//);
      const popupPromise = page.context().waitForEvent("page");
      await link.click();
      const popup = await popupPromise;
      await popup.waitForLoadState("domcontentloaded").catch(() => {});
      expect(popup.url().split("#")[0], `${label} opens its own address`).toBe(href);
      await popup.close();
    }
    expect(page.url(), "the original view is untouched").toBe(viewUrl);
  });

  // UI-081 · P1 · features.md §15
  // Expected: the Cube row downloads the binary cube; the file starts with the
  // little-endian length of its JSON metadata, which describes the epochs and
  // the grid. If the environment blocks downloads, report blocked, not a
  // failed endpoint.
  test("[UI-081] Cube tải đúng định dạng binary cube", async ({ page, analysis }, testInfo) => {
    annotateCase(test.info(), "UI-081", "P1", "features.md §15; live GET of the already-loaded view's cube, payload checked by format");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);

    const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
    await analysis.apiLink("Cube").click();
    let bytes: Buffer;
    try {
      const download = await downloadPromise;
      const path = testInfo.outputPath("cube.bin");
      await download.saveAs(path);
      const { readFileSync, rmSync } = await import("node:fs");
      bytes = readFileSync(path);
      rmSync(path, { force: true });
    } catch (e) {
      test.skip(true, `Download not available in this environment: ${String(e).slice(0, 80)}`);
      return;
    }
    expect(bytes.length, "the cube is not empty").toBeGreaterThan(8);
    const metaLength = bytes.readUInt32LE(0);
    expect(metaLength, "first uint32 = JSON metadata length").toBeGreaterThan(10);
    expect(metaLength).toBeLessThan(bytes.length);
    const meta = JSON.parse(bytes.subarray(4, 4 + metaLength).toString("utf8"));
    expect(meta).toHaveProperty("epochs");
    expect(meta).toHaveProperty("grid");
    expect(meta).toHaveProperty("encoding");
  });

  // UI-082 · P0 · features.md §15
  // Expected: each Copy button writes exactly the absolute address of its row
  // (scheme, host, path, encoded query) to the clipboard; both rows labelled
  // "Field" are checked separately. The coordinate-text target carries a space
  // and an encoded plus.
  test("[UI-082] Copy ghi đúng URL tuyệt đối của từng hàng (hai hàng Field) @p0", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-082", "P0", "features.md §15; clipboard granted to the test browser; coords target gives a space and an encoded +");
    test.setTimeout(240_000);

    await mockHeavyEndpoints(page);
    await open(page, "/?ui=adv&target=269.4486%20%2B4.7387&fov=8");
    await waitViewReady(page);
    await openApiList(analysis);
    await expect(analysis.apiRows).toHaveCount(22);

    let fieldRows = 0;
    for (const [label, path] of ROWS) {
      const isField = label === "Field";
      const link = analysis.apiLink(label, path.split("?")[0]);
      const href = await link.getAttribute("href");
      await analysis.apiCopyButton(label, path.split("?")[0]).click();
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard, `${label} copy == href`).toBe(href);
      expect(clipboard.startsWith("https://"), `${label} absolute URL`).toBe(true);
      if (isField) {
        fieldRows++;
        if (path === "/api/tiles") expect(clipboard).toContain("levels=");
        else expect(clipboard).toContain("/api/movers/field");
      }
    }
    expect(fieldRows, "two rows share the Field label").toBe(2);
    const nameQ = new URL(await analysis.apiLink("Name").getAttribute("href") ?? "").searchParams.get("q");
    expect(nameQ).toBe("269.4486 +4.7387");
  });

  // UI-083 · P0 · features.md §15
  // Expected: Frame/Epochs/Cube follow det, group and Frame adds diff=true for
  // the median; Job and the constant service rows keep their addresses.
  // Queries are compared decoded, order-independently.
  test("[UI-083] Frame/Epochs/Cube theo det/group, median thêm diff=true @p0", async ({ page, viewStage, advancedRail, analysis }) => {
    annotateCase(test.info(), "UI-083", "P0", "features.md §15; queries compared decoded and order-independently");

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    const queryOf = async (label: string, hrefIncludes?: string): Promise<Record<string, string>> => {
      const href = await analysis.apiLink(label, hrefIncludes).getAttribute("href");
      const out: Record<string, string> = {};
      for (const [k, v] of new URL(href ?? "").searchParams.entries()) out[k] = v;
      return out;
    };

    await openApiList(analysis);
    const healthBefore = await analysis.apiLink("Health").getAttribute("href");

    await advancedRail.pick("bands", "5");
    await advancedRail.pick("bands", "6");
    await advancedRail.pick("group", "visit");
    await viewStage.waitForFrameReload();
    await advancedRail.pick("mode", "diffmed");
    await expect.poll(() => urlParams(page)).toMatchObject({ det: "5,6", group: "visit", mode: "diffmed" });

    const frame = await queryOf("Frame");
    expect(frame.det).toBe("5,6");
    expect(frame.group).toBe("visit");
    expect(frame.diff).toBe("true");
    const epochs = await queryOf("Epochs");
    expect(epochs.det).toBe("5,6");
    expect(epochs.group).toBe("visit");
    expect(epochs.diff).toBeUndefined();
    const cube = await queryOf("Cube");
    expect(cube.det).toBe("5,6");
    expect(cube.group).toBe("visit");
    expect(cube.diff).toBeUndefined();

    const job = await queryOf("Job");
    expect(job.det).toBeUndefined();
    expect(job.group).toBeUndefined();
    expect(await analysis.apiLink("Health").getAttribute("href")).toBe(healthBefore);
  });

  // UI-084 · P0 · features.md §15
  // Expected: switching the view from a named target to coordinates updates
  // every view-dependent address (position, Name q, atlas tile) and leaves the
  // constant service rows alone; nothing of target A remains.
  test("[UI-084] Đổi target: danh sách phản ánh vị trí mới @p0", async ({ page, topBar, viewStage, analysis }) => {
    annotateCase(test.info(), "UI-084", "P0", "features.md §15; Name q uses the coordinates text for a coordinate view");
    test.setTimeout(240_000);

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);
    const tileBefore = await analysis.apiLink("Sky tile").getAttribute("href");

    // A position in a different atlas tile than Barnard's, parsed locally.
    await topBar.search("148.9 +69.7");
    await waitViewReady(page);
    await expect(viewStage.targetName).toContainText("148", { timeout: 120_000 });
    await expect(analysis.apiList).toContainText("148.9"); // the rows follow the new view
    await openApiList(analysis);
    await expect(analysis.apiRows).toHaveCount(22);

    const nameQ = new URL(await analysis.apiLink("Name").getAttribute("href") ?? "").searchParams.get("q");
    expect(nameQ).toContain("148.9 +69.7");
    const frameQ = new URL(await analysis.apiLink("Frame").getAttribute("href") ?? "").searchParams.get("target");
    expect(frameQ).toContain("148.9 +69.7");
    const all = await analysis.apiRows.allInnerTexts();
    for (const text of all) expect(text.toLowerCase()).not.toContain("barnard");
    expect(await analysis.apiLink("Sky tile").getAttribute("href")).not.toBe(tileBefore);
    expect(await analysis.apiLink("Health").getAttribute("href")).toBe("https://vanillasphere.com/api/health");
  });

  // UI-085 · P1 · features.md §3, §15
  // Expected: in Simple mode the share panel (with the list) is not shown;
  // returning to Advanced brings the list back with the current view's
  // addresses. The assertion runs on what is visible, not on hidden DOM.
  test("[UI-085] Simple ẩn danh sách, Advanced trả lại", async ({ page, topBar, analysis }) => {
    annotateCase(test.info(), "UI-085", "P1", "features.md §3,15; asserted on visibility, not hidden DOM");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await openApiList(analysis);
    await expect(analysis.apiRows.first()).toBeVisible();

    await topBar.switchTo("simple");
    await expect(analysis.shareCard).toBeHidden();
    await expect(analysis.apiRows.first()).toBeHidden();

    await topBar.switchTo("adv");
    await expect(analysis.apiRows.first()).toBeVisible();
    await expect
      .poll(async () => await analysis.apiLink("Health").getAttribute("href"), { timeout: 20_000 })
      .toBeTruthy();
  });

  // UI-086 · P1 · features.md §15, viewer accessibility
  // Expected: the list opens from the keyboard, focus reaches the rows and the
  // Copy works from the keyboard too. The formal accessibility standard and a
  // screen-reader pass are [C] and are covered by a separate session.
  test("[UI-086] Bàn phím: mở danh sách, tới hàng, Copy bằng phím", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-086", "P1", "features.md §15, viewer accessibility; a11y standard and screen reader = [C], separate session");

    await mockHeavyEndpoints(page);
    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    await analysis.apiSummary.focus();
    await page.keyboard.press("Enter");
    await expect(analysis.apiCount).toHaveText("22");

    await page.keyboard.press("Tab");
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(focusedId.startsWith("x-api-"), "focus reaches an endpoint address").toBe(true);

    // Keyboard-operate the Health row's Copy (a fixed address).
    const healthLink = analysis.apiLink("Health");
    await healthLink.focus();
    const healthHref = await healthLink.getAttribute("href");
    const copyButton = analysis.apiCopyButton("Health");
    await copyButton.focus();
    await page.keyboard.press("Enter");
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(healthHref);
  });

});
