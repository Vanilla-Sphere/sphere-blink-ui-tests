import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, canvasChecksum, open, urlParams, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Overlays (manual case UI-027)", () => {
  // UI-027 · P1 · features.md §10,13
  // Expected: each overlay toggle is reflected in its checkbox and, where the
  // viewer keeps it in the address, in the URL; the drawn layer appears and
  // disappears (asserted on the canvas only for the crosshair, whose pixels are
  // deterministic; catalogue positions by frame date are not pixel-checked).
  // Delta 0d8474f: a "Moving objects" overlay appears contextually when the
  // field has movers — its behaviour is cases UI-067/UI-069 (later round), and
  // controls are not assumed present in every view.
  test("[UI-027] Bật tắt overlay", async ({ page, advancedRail }) => {
    annotateCase(test.info(), "UI-027", "P1", "features.md §10,13; delta 0d8474f: Moving objects overlay contextual (= UI-067/069), drawing asserted for the crosshair only");
    test.setTimeout(240_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);

    // Crosshair: drawn on the canvas, so the pixels change when it is hidden.
    const withCross = await canvasChecksum(page, "#sky");
    await advancedRail.crosshairCheckbox.uncheck();
    const withoutCross = await canvasChecksum(page, "#sky");
    expect(withoutCross).not.toBe(withCross);
    await advancedRail.crosshairCheckbox.check();
    expect(await canvasChecksum(page, "#sky")).toBe(withCross);

    // Catalogue overlays live in the URL when on.
    await advancedRail.gaiaCheckbox.check();
    await expect.poll(() => urlParams(page)).toMatchObject({ gaia: "1" });
    await advancedRail.gaiaCheckbox.uncheck();
    await expect
      .poll(async () => (await urlParams(page)).gaia ?? "off")
      .toBe("off");

    await advancedRail.catwiseCheckbox.check();
    await expect.poll(() => urlParams(page)).toMatchObject({ catwise: "1" });
    await advancedRail.catwiseCheckbox.uncheck();
    await expect
      .poll(async () => (await urlParams(page)).catwise ?? "off")
      .toBe("off");

    // Smooth pixels: state toggle only; its pixel effect is not asserted here.
    await advancedRail.smoothCheckbox.check();
    await expect(advancedRail.smoothCheckbox).toBeChecked();
    expect(await canvasChecksum(page, "#sky")).toBeGreaterThan(0);
    await advancedRail.smoothCheckbox.uncheck();

    // Measured tracks (Barnard has measurements): hidden tracks appear in the URL.
    await expect(advancedRail.tracksOption).toBeVisible();
    await advancedRail.tracksCheckbox.uncheck();
    await expect.poll(() => urlParams(page)).toMatchObject({ tracks: "0" });
    await advancedRail.tracksCheckbox.check();
    await expect
      .poll(async () => (await urlParams(page)).tracks ?? "on")
      .toBe("on");
  });
});
