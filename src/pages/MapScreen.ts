import { type Locator, type Page } from "@playwright/test";
import { stableCanvasChecksum } from "../helpers/app.js";

/** The whole-sky map screen: canvas, zoom buttons, challenge-target list. */
export class MapScreen {
  readonly page: Page;
  readonly root: Locator;
  readonly canvas: Locator;
  readonly zoomIn: Locator;
  readonly zoomOut: Locator;
  readonly zoomHome: Locator;
  readonly featuredTargets: Locator;
  readonly pointerReadout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator("#mapscreen");
    this.canvas = page.locator("#map");
    this.zoomIn = page.locator("#map-in");
    this.zoomOut = page.locator("#map-out");
    this.zoomHome = page.locator("#map-home");
    this.featuredTargets = page.locator("#mapfeatured .target");
    this.pointerReadout = page.locator("#mapread");
  }

  /** Clicks the map at a fractional position of its box (avoids the target pins near the edges). */
  async clickAt(fractionX: number, fractionY: number): Promise<void> {
    const box = await this.canvas.boundingBox();
    if (!box) throw new Error("the sky map canvas is not visible");
    await this.canvas.click({
      position: { x: Math.round(box.width * fractionX), y: Math.round(box.height * fractionY) },
    });
  }

  async checksum(): Promise<number> {
    return stableCanvasChecksum(this.page, "#map");
  }

  /** Opens a challenge target from the list under the map ("Start here"). */
  async openTarget(nameSubstring: string): Promise<void> {
    await this.featuredTargets.filter({ hasText: nameSubstring }).first().click();
  }
}
