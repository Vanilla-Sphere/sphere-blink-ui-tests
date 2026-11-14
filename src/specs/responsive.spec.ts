import { annotateCase } from "../helpers/case.js";
import { computedStyle, open, waitViewScreen } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

interface Boundary {
  width: number;
  selector: string;
  property: string;
  /** Expected value at width-1 (inside the media query). */
  narrow: string;
  /** Expected value at width (outside the media query). */
  wide: string;
}

/** The layout markers of viewer.md §Responsive, read from the computed styles.
    The brand label is a flex item, so outside the breakpoint its computed display is "block". */
const BOUNDARIES: Boundary[] = [
  { width: 480, selector: ".brand span", property: "display", narrow: "none", wide: "block" },
  { width: 760, selector: "aside.rail", property: "display", narrow: "contents", wide: "block" },
  { width: 1000, selector: "#search", property: "grid-row-start", narrow: "2", wide: "auto" },
  { width: 1180, selector: ".stage", property: "overflow-y", narrow: "visible", wide: "auto" },
];

test.describe("Responsive layout (manual cases UI-033, UI-038)", () => {
  // UI-033 · P1 · viewer.md §Responsive (EX-04)
  // Expected: the layout switches exactly at the documented breakpoints
  // (480/760/900/1000/1180 px). Layout markers are read as computed styles;
  // "nothing important is covered or cut" is not fully asserted by them.
  test("[UI-033] Biên breakpoint", async ({ page }) => {
    annotateCase(test.info(), "UI-033", "P1", "viewer.md §Responsive");

    await open(page, "/?ui=adv&target=barnard&fov=8");
    await waitViewScreen(page);

    for (const boundary of BOUNDARIES) {
      await page.setViewportSize({ width: boundary.width - 1, height: 800 });
      expect(
        await computedStyle(page, boundary.selector, boundary.property),
        `${boundary.selector} ${boundary.property} at ${boundary.width - 1}px`,
      ).toBe(boundary.narrow);
      await page.setViewportSize({ width: boundary.width, height: 800 });
      expect(
        await computedStyle(page, boundary.selector, boundary.property),
        `${boundary.selector} ${boundary.property} at ${boundary.width}px`,
      ).toBe(boundary.wide);
    }

    // In Simple mode the shell becomes one column below 900 px.
    await open(page, "/?ui=simple&target=barnard&fov=8");
    await waitViewScreen(page);
    await page.setViewportSize({ width: 899, height: 800 });
    expect(await computedStyle(page, ".shell", "display")).toBe("flex");
    await page.setViewportSize({ width: 900, height: 800 });
    expect(await computedStyle(page, ".shell", "display")).not.toBe("flex");
  });

  // UI-038 · P1 · viewer.md §Responsive (EX-04)
  // The smartphone project of this suite covers the emulated viewport
  // (390x844, touch, mobile user agent) for all other cases. Pinch, rotation
  // and layout on real hardware need a physical, approved device.
  test("[UI-038] Thiết bị chạm thật", async () => {
    annotateCase(test.info(), "UI-038", "P1", "viewer.md §Responsive; needs a real approved touch device");
    test.skip(true, "Needs a physical touch device; this suite only emulates the phone viewport (see README).");
  });
});
