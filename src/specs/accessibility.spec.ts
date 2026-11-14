import { annotateCase } from "../helpers/case.js";
import { computedStyle, open } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Accessibility (manual cases UI-034, UI-035)", () => {
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
    await page.waitForTimeout(200);
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
});
