import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, canvasChecksum, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Image zoom and flagged points (manual cases UI-046 .. UI-049)", () => {
  // UI-046 · P1 · features.md §4
  // Expected: the image zooms in and out (buttons), the reset returns to the
  // whole image, a new target starts whole again. Pixel-level overlay alignment
  // is an [C] threshold and is not asserted.
  test("[UI-046] Zoom ảnh và đặt lại khi đổi mục tiêu", async ({ page, topBar, analysis }) => {
    annotateCase(test.info(), "UI-046", "P1", "features.md §4; overlay alignment threshold = [C], not asserted");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.zoomOut).toBeDisabled();

    await analysis.zoomIn.click();
    await expect(analysis.zoomOut).toBeEnabled();
    await expect(analysis.zoomReset).toBeVisible();
    const zoomed = await canvasChecksum(page, "#sky");
    expect(zoomed).toBeGreaterThan(0);

    await analysis.zoomReset.click();
    await expect(analysis.zoomOut).toBeDisabled();

    // A new target starts with the whole image again.
    await topBar.search("eps-indi-b");
    await waitViewReady(page);
    await expect(analysis.zoomOut).toBeDisabled();
  });

  // UI-047 · P0 · features.md §9
  // Expected: flagged points are hidden by default; "Show N flagged" reveals
  // them ("Hide N flagged" after); toggling again hides them. The count itself
  // depends on the served data and is not hard-asserted.
  test("[UI-047] Show/Hide flagged points", async ({ page, analysis }) => {
    annotateCase(test.info(), "UI-047", "P0", "features.md §9; count is data-dependent, not hard-asserted");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await expect(analysis.flaggedToggle).toBeVisible();
    await expect(analysis.flaggedToggle).toContainText("Show");
    await expect(analysis.flaggedToggle).toHaveAttribute("aria-pressed", "false");

    await analysis.flaggedToggle.click();
    await expect(analysis.flaggedToggle).toHaveAttribute("aria-pressed", "true");
    await expect(analysis.flaggedToggle).toContainText("Hide");

    await analysis.flaggedToggle.click();
    await expect(analysis.flaggedToggle).toContainText("Show");
    await expect(analysis.flaggedToggle).toHaveAttribute("aria-pressed", "false");
  });

  // UI-048 · P1 · features.md §9
  // Not automated: needs a fixture whose spectrum holds only flagged points,
  // so the plot still shows something instead of going empty. Requires the
  // approved isolated staging backend with scientific fixtures.
  test("[UI-048] Chỉ có điểm flagged vẫn hiển thị (cần fixture)", async () => {
    annotateCase(test.info(), "UI-048", "P1", "features.md §9; needs a flagged-only spectrum fixture on an approved backend");
    test.skip(true, "Needs an isolated backend with a flagged-only spectrum fixture.");
  });

  // UI-049 · P1 · features.md §9, imaging-engine
  // Not automated: the hide/show decision must be checked against the
  // documented algorithm with fixtures that separate PARTIAL/HOT from the
  // bright-core flags OVERFLOW/TRANSIENT/SUR_ERROR/BLOOM — fixture work with
  // an approved oracle.
  test("[UI-049] Phân biệt cờ lõi sáng và cờ lỗi (cần fixture)", async () => {
    annotateCase(test.info(), "UI-049", "P1", "features.md §9, imaging-engine; needs flag-separating fixtures and an approved algorithm oracle");
    test.skip(true, "Needs fixtures separating bright-core flags from defect flags on an approved backend.");
  });
});
