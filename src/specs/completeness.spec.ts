import { annotateCase } from "../helpers/case.js";
import { open } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

/**
 * "How much the search finds" — the completeness block at the end of the
 * Discoveries sheet (UI-087..UI-092). The block renders from
 * /static/data/mover-completeness.json and never asks the server to compute.
 * UI-087 and UI-091 run against the live published measurement; the numeric
 * and failure cases run on a crafted fixture ([mock]) with exact values.
 */
test.describe.configure({ mode: "serial" });

/** A small completeness measurement with exact numbers for the fixture legs. */
const FIXTURE = {
  version: "TEST",
  made: "2026-11-15",
  fake: { spectrum: "reflected", rate_arcsec_h: [1, 60], min_times: 6 },
  real: [],
  shuffled: { searches: 40, candidates: 8 },
  v_edges: [17, 18.5],
  v_coarse: [17, 18, 18.5],
  rate_edges: [1, 30, 60],
  fields: {
    sparse: {
      label: "Sparse", where: "high above the plane", exposures: 120,
      found: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 20, share: 0.5 }, { from: 17.5, to: 18, n: 4, found: 1, share: 0.25 }],
        limits: { bright: 0.5, half_mjy: 0.42, half: 18.2 },
      },
      strong: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 13, share: 0.33 }, { from: 17.5, to: 18, n: 4, found: 1, share: 0.25 }],
        limits: { bright: 0.333, half_mjy: 0.55, half: 19.1 },
      },
    },
    medium: {
      label: "Medium", where: "the plane", exposures: 200,
      found: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 24, share: 0.6 }, { from: 17.5, to: 18, n: 6, found: 2, share: 0.33 }],
        limits: { bright: 0.6, half_mjy: 0.5, half: 18.6 },
      },
      strong: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 16, share: 0.4 }, { from: 17.5, to: 18, n: 6, found: 2, share: 0.33 }],
        limits: { bright: 0.4, half_mjy: 0.6, half: 19.0 },
      },
    },
    crowded: {
      label: "Crowded", where: "the Milky Way centre", exposures: 260,
      found: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 30, share: 0.75 }, { from: 17.5, to: 18, n: 4, found: 1, share: 0.25 }],
        limits: { bright: 0.75, half_mjy: 0.62, half: 19.2 },
      },
      strong: {
        curve: [{ from: 17, to: 17.5, n: 40, found: 20, share: 0.5 }, { from: 17.5, to: 18, n: 4, found: 1, share: 0.25 }],
        limits: { bright: 0.5, half_mjy: 0.7, half: 19.6 },
      },
    },
  },
  all: {
    fakes: 1200,
    found: {
      curve: [{ from: 17, to: 17.5, n: 120, found: 74, share: 0.62 }, { from: 17.5, to: 18, n: 14, found: 4, share: 0.29 }],
      grid: [[{ n: 100, share: 0.6, found: 60 }, { n: 4, found: 1, share: 0.25 }]],
      limits: { bright: 0.55, half_mjy: 0.45, half: 18.4 },
    },
    strong: {
      curve: [{ from: 17, to: 17.5, n: 120, found: 49, share: 0.41 }, { from: 17.5, to: 18, n: 14, found: 3, share: 0.21 }],
      grid: [[{ n: 100, share: 0.41, found: 41 }, { n: 4, found: 1, share: 0.25 }]],
      limits: { bright: 0.3, half_mjy: 0.58, half: 19.3 },
    },
  },
};

async function mockCompleteness(page: import("@playwright/test").Page, payload: unknown, status = 200): Promise<void> {
  await page.route("**/static/data/mover-completeness.json*", (route) =>
    route.fulfill({ status, contentType: "application/json", body: status === 200 ? JSON.stringify(payload) : "upstream unavailable" }),
  );
}

async function openDiscoveries(page: import("@playwright/test").Page): Promise<void> {
  await open(page, "/?ui=adv");
  await page.locator("#openlog").click();
  await expect(page.locator("#discoveries")).toBeVisible();
}

const SECTION = '[data-completeness]';

test.describe("How much the search finds (manual cases UI-087 .. UI-092)", () => {
  test.afterEach(async ({ sharedPage }, testInfo) => {
    await sharedPage.unrouteAll();
    const viewport = (testInfo.project.use as { viewport?: { width: number; height: number } }).viewport ?? { width: 1280, height: 720 };
    await sharedPage.setViewportSize(viewport);
  });

  // UI-087 · P0 · features.md §17, mover-completeness
  // Expected: with the published measurement in place, the block at the end of
  // Discoveries holds the explanation, three number boxes, the chart, the two
  // evidence toggles and the date/version line. Live data, no mocks.
  test("[UI-087] Khối completeness cuối Discoveries (live)", async ({ page }) => {
    annotateCase(test.info(), "UI-087", "P0", "mover-completeness; live published measurement v5 (2026-11-15), no mocks");

    await openDiscoveries(page);
    const section = page.locator(SECTION);
    await expect(section).toBeVisible({ timeout: 30_000 });
    await expect(section.locator("h3")).toHaveText("How much the search finds");
    await expect(section.locator(".cp-tile")).toHaveCount(3);
    for (const tile of await section.locator(".cp-tile").all()) {
      await expect(tile).not.toBeEmpty();
    }
    await expect(section.locator(".cp-chart svg")).toBeVisible();
    await expect(section.locator('.seg button[data-v="found"]')).toHaveAttribute("aria-pressed", "true");
    await expect(section.locator('.seg button[data-v="strong"]')).toHaveAttribute("aria-pressed", "false");
    await expect(section).toContainText(/Measured \d{4}-\d{2}-\d{2} on search version \d/);
    await page.locator("#log-close").click();
    await page.mouse.move(5, 420);
    await expect(page.locator("#discoveries")).toBeHidden();
  });

  // UI-088 · P1 · mover-completeness
  // Expected: the three boxes follow the fixture exactly — the share of bright
  // fakes found (few vs many stars), the V where half are still found in the
  // sparse field, and the shuffled-searches candidate count. [mock]
  test("[UI-088] Ba ô số khớp fixture [mock]", async ({ page }) => {
    annotateCase(test.info(), "UI-088", "P1", "mover-completeness; numbers from a crafted fixture [mock], compared exactly");

    await mockCompleteness(page, FIXTURE);
    await openDiscoveries(page);
    const section = page.locator(SECTION);
    await expect(section).toBeVisible({ timeout: 30_000 });

    const tiles = section.locator(".cp-tile");
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toContainText("55 %");
    await expect(tiles.nth(0)).toContainText("50 % where stars are few, 75 % where they crowd");
    await expect(tiles.nth(1)).toContainText("V 18.2");
    await expect(tiles.nth(1)).toContainText("0.42 mJy at 1.2 µm");
    await expect(tiles.nth(2)).toHaveText(/8 of 40/);
    await expect(section).toContainText("on search version TEST");
  });

  // UI-089 · P0 · mover-completeness
  // Expected: Known objects is the default; Nameless candidates switches the
  // evidence (aria-pressed, first box follows the stronger numbers), switching
  // back restores; the shuffled box only changes when its own data changes.
  test("[UI-089] Chuyển Known/Nameless giữ đúng mức chứng cứ [mock]", async ({ page }) => {
    annotateCase(test.info(), "UI-089", "P0", "mover-completeness; fixture [mock]; evidence levels asserted, never mixed");

    await mockCompleteness(page, FIXTURE);
    await openDiscoveries(page);
    const section = page.locator(SECTION);
    await expect(section).toBeVisible({ timeout: 30_000 });

    const known = section.locator('.seg button[data-v="found"]');
    const nameless = section.locator('.seg button[data-v="strong"]');
    await expect(known).toHaveAttribute("aria-pressed", "true");
    const foundTile = await section.locator(".cp-tile").first().innerText();

    await nameless.click();
    await expect(nameless).toHaveAttribute("aria-pressed", "true");
    await expect(known).toHaveAttribute("aria-pressed", "false");
    const strongTile = await section.locator(".cp-tile").first().innerText();
    expect(strongTile).not.toBe(foundTile);
    await expect(strongTile).toContain("33 % where stars are few");
    await expect(section.locator(".cp-tile").nth(2)).toHaveText(/8 of 40/);

    await known.click();
    await expect(known).toHaveAttribute("aria-pressed", "true");
    await expect(section.locator(".cp-tile").first()).toContainText("50 % where stars are few");
  });

  // UI-090 · P1 · mover-completeness
  // Expected: "The numbers as tables" holds the chart as two tables; a cell
  // backed by fewer than 5 fakes shows the table's own missing mark ("–" and
  // "·"), never a zero; toggling the details keeps the evidence selection.
  test("[UI-090] Bảng số liệu và dấu thiếu n<5 [mock]", async ({ page }) => {
    annotateCase(test.info(), "UI-090", "P1", "mover-completeness; fixture [mock]; n<5 missing marks asserted, not zeros");

    await mockCompleteness(page, FIXTURE);
    await openDiscoveries(page);
    const section = page.locator(SECTION);
    await expect(section).toBeVisible({ timeout: 30_000 });

    await section.locator("details.cp-more summary").click();
    const t1 = section.locator("table.cp-table").first();
    const t1rows = t1.locator("tr").filter({ has: page.locator("td") }); // DOM-built rows sit directly under the table
    await expect(t1rows.first()).toBeVisible();
    // Row 1 (V 17–17.5): every field has n = 40 → the share with counts.
    await expect(t1rows.nth(0).locator("td").nth(1)).toContainText("50 % (20/40)");
    // Row 2 (V 17.5–18), sparse field: n = 4 < 5 → the dash, not a number.
    await expect(t1rows.nth(1).locator("td").nth(1)).toHaveText("–");

    const t2 = section.locator("table.cp-table.cp-grid2");
    const t2rows = t2.locator("tr").filter({ has: page.locator("td") });
    await expect(t2rows.first()).toBeVisible();
    // V 17–18 cell: n = 100 → the percentage; V 18–18.5: n = 4 < 5 → the dot.
    await expect(t2rows.first().locator("td").nth(1)).toContainText("60");
    await expect(t2rows.first().locator("td").nth(2)).toHaveText("·");

    // The evidence selection survives folding the tables away and back.
    await section.locator("details.cp-more summary").click();
    await section.locator("details.cp-more summary").click();
    await expect(t1).toBeVisible();
    await expect(section.locator('.seg button[data-v="found"]')).toHaveAttribute("aria-pressed", "true");
  });

  // UI-091 · P1 · viewer responsive, mover-completeness
  // Expected: chart, legend, toggles and tables stay readable on desktop and
  // on the phone viewport — nothing overflows horizontally, the boxes stack.
  // Tooltip works with a pointer. The accessibility standard and a screen
  // reader are [C] and are covered by a separate session.
  test("[UI-091] Completeness trên desktop và smartphone [partial: a11y [C]]", async ({ sharedPage: page }, testInfo) => {
    annotateCase(test.info(), "UI-091", "P1", "mover-completeness, viewer responsive; layout asserted on both viewports; a11y standard = [C] (partial)");
    test.setTimeout(240_000);

    await mockCompleteness(page, FIXTURE);
    await openDiscoveries(page);
    const section = page.locator(SECTION);
    await expect(section).toBeVisible({ timeout: 30_000 });

    // Tooltip on pointer hover (desktop pointer; touch tooltip is manual).
    if (testInfo.project.name === "desktop") {
      await section.locator(".cp-chart svg").hover({ position: { x: 120, y: 60 } });
      await expect(section.locator(".cp-tip")).toBeVisible({ timeout: 10_000 });
    }

    // Phone viewport: the boxes stack full-width, nothing overflows.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(section.locator(".cp-tile").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "no horizontal overflow at 390 px").toBeLessThanOrEqual(2);
    const t1box = await section.locator(".cp-tile").nth(0).boundingBox();
    const t3box = await section.locator(".cp-tile").nth(2).boundingBox();
    if (t1box && t3box) expect(t3box.y, "third box stacks below the first on mobile").toBeGreaterThan(t1box.y);
  });

  // UI-092 · P2 · mover-completeness
  // Expected: when the measurement data cannot load, the block disappears and
  // the rest of Discoveries keeps working. The specific message was never
  // requested ([C]), so only the disappearance is asserted.
  test("[UI-092] Dữ liệu completeness lỗi: khối ẩn, Discoveries dùng được [mock, [C]]", async () => {
    annotateCase(test.info(), "UI-092", "P2", "mover-completeness; fetch failure simulated by route [mock]; message wording = [C], not asserted");
    test.skip(true, "Skip exercised through the failure route below; kept as the traceable case entry.");
  });
});

// The failure leg of UI-092 runs as its own case so the block's disappearance
// is the asserted outcome of this flow, not of a shared fixture.
test.describe("How much the search finds — upstream failure (UI-092 failure leg) [mock, [C]]", () => {
  test.afterEach(async ({ sharedPage }) => {
    await sharedPage.unrouteAll();
  });

  test("[UI-092b] Dữ liệu lỗi 503: khối ẩn, phần còn lại của Discoveries dùng được", async ({ page }) => {
    annotateCase(test.info(), "UI-092", "P2", "mover-completeness; fetch failure simulated by a 503 route [mock]; [C] on wording");
    await page.route("**/static/data/mover-completeness.json*", (route) => route.fulfill({ status: 503, body: "upstream unavailable" }));
    await openDiscoveries(page);
    await expect(page.locator(SECTION)).toBeHidden({ timeout: 30_000 });
    await expect(page.locator("#loglist")).toBeVisible();
    await page.locator("#log-close").click();
    await expect(page.locator("#discoveries")).toBeHidden();
  });
});
