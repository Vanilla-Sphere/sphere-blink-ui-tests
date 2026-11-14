import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Sharing (manual case UI-032)", () => {
  // UI-032 · P2 · features.md §15 (delta 0d8474f)
  // Expected: the Page/GIF/Data links point at the current view and its
  // resources; the spectrum panel offers CSV and PNG exports. The GIF/data
  // endpoints are NOT fetched here and the export downloads are not exercised:
  // they start render jobs / downloads whose content check is UI-056 (later
  // round) — this case is partially covered by design.
  test("[UI-032] Liên kết GIF, Page, Data", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-032", "P2", "features.md §15; delta 0d8474f: CSV/PNG exports present, download flow = UI-056 (partial)");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await expect(analysis.csvButton).toBeVisible();
    await expect(analysis.pngButton).toBeVisible();

    const pageUrl = new URL(await analysis.pageLinkInput.inputValue());
    expect(pageUrl.origin).toBe("https://vanillasphere.com");
    expect(pageUrl.searchParams.get("target")).toBe("barnard");
    expect(pageUrl.searchParams.get("ui")).toBe("adv");

    const gifUrl = new URL(await analysis.gifLinkInput.inputValue());
    expect(gifUrl.pathname).toBe("/api/movie.gif");
    expect(gifUrl.searchParams.get("target")).toBe("barnard");
    expect(gifUrl.searchParams.get("fov")).toBe("8");
    expect(gifUrl.searchParams.get("det")).not.toBeNull();
    expect(gifUrl.searchParams.get("group")).not.toBeNull();
    expect(await analysis.gifLinkInput.inputValue()).toBe(await page.locator("#sgif").getAttribute("href"));

    const apiUrl = new URL(await analysis.apiLinkInput.inputValue());
    expect(apiUrl.pathname).toBe("/api/spectrum");
    expect(apiUrl.searchParams.get("target")).toBe("barnard");
    expect(apiUrl.searchParams.get("wait")).toBe("60");

    const simbad = new URL(await analysis.simbadLink.getAttribute("href") ?? "");
    expect(simbad.hostname).toBe("simbad.cds.unistra.fr");
    expect(simbad.searchParams.get("Coord")).not.toBeNull();
    expect(await analysis.wiseViewLink.getAttribute("href")).toContain("byw.tools/wiseview");
    const aladin = new URL(await analysis.aladinLink.getAttribute("href") ?? "");
    expect(aladin.hostname).toBe("aladin.cds.unistra.fr");
  });
});
