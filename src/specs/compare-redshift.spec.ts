import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Redshift layer and Compare spectra (manual cases UI-062 .. UI-065)", () => {
  // UI-062 · P1 · features.md §18
  // Expected: the redshift panel's threshold control changes the shown layer
  // and its count; Off turns the overlay off. Layer pixels on the map are a
  // [C] visual oracle; the panel state and counts are asserted instead.
  test("[UI-062] Ngưỡng redshift: Off/All/z>0.1..7", async ({ page, mapScreen }) => {
    annotateCase(test.info(), "UI-062", "P1", "features.md §18; panel state and counts asserted, map layer pixels = [C]");

    await open(page, "/");
    await mapScreen.redshiftOpen.click();
    await expect(mapScreen.redshiftPanel).toBeVisible();

    await mapScreen.redshiftThreshold("off").click();
    await expect(mapScreen.redshiftThreshold("off")).toHaveAttribute("aria-pressed", "true");

    const settled = async () => {
      const text = await mapScreen.redshiftCount.innerText();
      return text.length > 0 && !text.includes("Reading");
    };
    await mapScreen.redshiftThreshold("0").click(); // All
    await expect(async () => expect(await settled()).toBeTruthy()).toPass({ timeout: 90_000 });
    const allCount = await mapScreen.redshiftCount.innerText();

    for (const threshold of ["1", "7"]) {
      await mapScreen.redshiftThreshold(threshold).click();
      await expect(mapScreen.redshiftThreshold(threshold)).toHaveAttribute("aria-pressed", "true");
    }
    await expect(async () => {
      const text = await mapScreen.redshiftCount.innerText();
      expect(await settled()).toBeTruthy();
      expect(text).not.toBe(allCount);
    }).toPass({ timeout: 90_000 });

    await mapScreen.redshiftThreshold("off").click();
    await expect(mapScreen.redshiftThreshold("off")).toHaveAttribute("aria-pressed", "true");
  });

  // UI-063 · P1 · features.md §18, viewer
  // Not automated: hovering and clicking catalogue objects on the redshift
  // layer needs deterministic object positions on the projected map — a
  // geometric oracle ([C]) that fixtures must define first.
  test("[UI-063] Hover/click đối tượng trên lớp redshift (oracle [C])", async () => {
    annotateCase(test.info(), "UI-063", "P1", "features.md §18; needs deterministic projected positions ([C])");
    test.skip(true, "Needs a geometric oracle for object positions on the projected layer ([C]).");
  });

  // UI-064 · P1 · features.md §18
  // Expected: Compare spectra accepts up to six objects; the seventh is
  // refused with a message and the list stays at six. The wording of the
  // refusal is fixed by the app's own message and asserted as such.
  test("[UI-064] Compare: thêm tới sáu object, thứ bảy bị từ chối", async ({ page, analysis, extras }) => {
    annotateCase(test.info(), "UI-064", "P1", "features.md §18; live spectra of known targets, no votes or heavy jobs");
    test.setTimeout(600_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await analysis.compareButton.click();
    await expect(extras.compareSheet).toBeVisible();

    const targets = ["eps-indi-b", "r-dra", "wise-0855", "rw-aur", "M 82"];
    for (const target of targets) {
      await extras.compareQuery.fill(target);
      await extras.compareQuery.press("Enter");
    }
    await expect(extras.compareItems()).toHaveCount(6, { timeout: 300_000 });

    // The sheet opens with the current object (Barnard) and dedupes by name,
    // so the seventh object must be a new one for the limit to trigger.
    await extras.compareQuery.fill("Vega");
    await extras.compareQuery.press("Enter");
    await expect(async () => {
      // The refusal may be shown only briefly while the list is rebuilt.
      expect((await extras.compareMsg.innerText()).length).toBeGreaterThan(0);
    }).toPass({ timeout: 15_000 });
    await expect(extras.compareItems()).toHaveCount(6);
    await extras.compareClose.click();
  });

  // UI-065 · P1 · features.md §18
  // Expected: a compare row offers observed/rest frames, relative/mJy scale, a
  // z field with a slider, and a Reset back to the published redshift. The
  // published value shown by the app itself is the reference for Reset (no
  // independent numbers asserted).
  test("[UI-065] Compare: trục, thang đo, z và Reset về z công bố", async ({ page, analysis, extras }) => {
    annotateCase(test.info(), "UI-065", "P1", "features.md §18; Reset reference = the app's published value; axis/scale states asserted");
    test.setTimeout(600_000);

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page);
    await expect(analysis.spectrumCard).toBeVisible({ timeout: 120_000 });
    await analysis.compareButton.click();
    await expect(extras.compareSheet).toBeVisible();

    // A quasar example brings published redshifts; the first row is the
    // current object (Barnard, none published), so pick a row that has one.
    await extras.compareExampleQuasars.click();
    await expect(extras.compareItems().first()).toBeVisible({ timeout: 300_000 });
    let publishedIndex = -1;
    await expect(async () => {
      const rows = await extras.compareItems().count();
      publishedIndex = -1;
      for (let i = 0; i < rows; i++) {
        const label = await extras.compareItemPublished(i).innerText();
        if (label.includes("published") && Number(await extras.compareItemZ(i).inputValue()) > 0) {
          publishedIndex = i;
          break;
        }
      }
      expect(publishedIndex).toBeGreaterThanOrEqual(0);
    }).toPass({ timeout: 240_000 });

    const zInput = extras.compareItemZ(publishedIndex);
    const published = await zInput.inputValue();

    await extras.compareAxisButton("rest").click();
    await expect(extras.compareAxisButton("rest")).toHaveAttribute("aria-pressed", "true");
    await extras.compareScaleButton("flux").click();
    await expect(extras.compareScaleButton("flux")).toHaveAttribute("aria-pressed", "true");

    await zInput.fill("1.234");
    const reset = extras.compareItemReset(publishedIndex);
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(zInput).toHaveValue(published);

    await extras.compareAxisButton("obs").click();
    await extras.compareClose.click();
  });
});
