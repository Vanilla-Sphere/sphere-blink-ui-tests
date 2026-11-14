import { type Locator, type Page } from "@playwright/test";

/** The Advanced-mode left rail: bands, grouping, image math, contrast, overlays. */
export class AdvancedRail {
  readonly page: Page;
  readonly root: Locator;
  readonly bandsGroup: Locator;
  readonly groupGroup: Locator;
  readonly modeGroup: Locator;
  readonly referenceRow: Locator;
  readonly setReferenceButton: Locator;
  readonly referenceLabel: Locator;
  readonly gainSlider: Locator;
  readonly resetGainButton: Locator;
  readonly gaiaCheckbox: Locator;
  readonly catwiseCheckbox: Locator;
  readonly crosshairCheckbox: Locator;
  readonly smoothCheckbox: Locator;
  readonly cellGridOption: Locator;
  readonly cellGridCheckbox: Locator;
  readonly tracksOption: Locator;
  readonly tracksCheckbox: Locator;
  readonly overlayStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator("aside.rail");
    this.bandsGroup = page.locator("#dets");
    this.groupGroup = page.locator("#group");
    this.modeGroup = page.locator("#mode");
    this.referenceRow = page.locator("#refrow");
    this.setReferenceButton = page.locator("#setref");
    this.referenceLabel = page.locator("#reflabel");
    this.gainSlider = page.locator("#gain");
    this.resetGainButton = page.locator("#resetgain");
    this.gaiaCheckbox = page.locator("#ov-gaia");
    this.catwiseCheckbox = page.locator("#ov-catwise");
    this.crosshairCheckbox = page.locator("#ov-cross");
    this.smoothCheckbox = page.locator("#ov-smooth");
    this.cellGridOption = page.locator("#tileopt");
    this.cellGridCheckbox = page.locator("#ov-tiles");
    this.tracksOption = page.locator("#trackopt");
    this.tracksCheckbox = page.locator("#ov-tracks");
    this.overlayStatus = page.locator("#ovstatus");
  }

  /** Clicks one button of a segmented control (bands, grouping or image math). */
  async pick(group: "bands" | "group" | "mode", value: string): Promise<void> {
    const el = group === "bands" ? this.bandsGroup : group === "group" ? this.groupGroup : this.modeGroup;
    await el.locator(`button[data-v="${value}"]`).click();
  }

  /** aria-pressed of one button of a segmented control. */
  async isPicked(group: "bands" | "group" | "mode", value: string): Promise<boolean> {
    const el = group === "bands" ? this.bandsGroup : group === "group" ? this.groupGroup : this.modeGroup;
    return (await el.locator(`button[data-v="${value}"]`).getAttribute("aria-pressed")) === "true";
  }

  async setReferenceToCurrentFrame(): Promise<void> {
    await this.setReferenceButton.click();
  }
}
