import { type Locator, type Page } from "@playwright/test";
import { awaitMapSettled, stableCanvasChecksum } from "../helpers/app.js";

/** The whole-sky map screen: canvas, zoom buttons, challenge-target list. */
export class MapScreen {
  readonly page: Page;
  readonly root: Locator;
  readonly canvas: Locator;
  readonly zoomIn: Locator;
  readonly zoomOut: Locator;
  readonly zoomHome: Locator;
  readonly featuredTargets: Locator;
  readonly doCards: Locator;
  readonly fullScreenButton: Locator;
  readonly redshiftOpen: Locator;
  readonly redshiftPanel: Locator;
  readonly redshiftClose: Locator;
  readonly redshiftCount: Locator;
  readonly pointerReadout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator("#mapscreen");
    this.canvas = page.locator("#map");
    this.zoomIn = page.locator("#map-in");
    this.zoomOut = page.locator("#map-out");
    this.zoomHome = page.locator("#map-home");
    this.featuredTargets = page.locator("#mapfeatured .target");
    this.doCards = page.locator("#dolist .do");
    this.fullScreenButton = page.locator("#map-full");
    this.redshiftOpen = page.locator("#zopen");
    this.redshiftPanel = page.locator("#zpanel");
    this.redshiftClose = page.locator("#zclose");
    this.redshiftCount = page.locator("#zcount");
    this.pointerReadout = page.locator("#mapread");
  }

  /** One "What you can do here" card by its data-do key. */
  doCard(key: string): Locator {
    return this.page.locator(`#dolist .do[data-do="${key}"]`);
  }

  /** One button of the redshift-threshold segmented control ("off", "0", "1", ...). */
  redshiftThreshold(value: string): Locator {
    return this.page.locator(`#zmin button[data-v="${value}"]`);
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

  /** Waits out the first full paint, including the async 2MASS atlas backdrop. */
  async settledChecksum(): Promise<number> {
    return awaitMapSettled(this.page, "#map");
  }

  /** Opens a challenge target from the list under the map ("Start here"). */
  async openTarget(nameSubstring: string): Promise<void> {
    await this.featuredTargets.filter({ hasText: nameSubstring }).first().click();
  }
}
