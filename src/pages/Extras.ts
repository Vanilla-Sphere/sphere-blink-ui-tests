import { type Locator, type Page } from "@playwright/test";

/**
 * The sheets and panels added with the v50 viewer: About the data, Discoveries,
 * Compare spectra, the depth card, the source-files card and the movers card.
 */
export class Extras {
  readonly page: Page;
  // About the data sheet
  readonly aboutSheet: Locator;
  readonly aboutClose: Locator;
  // Discoveries sheet
  readonly discoveriesSheet: Locator;
  readonly logTabs: Locator;
  readonly logNote: Locator;
  readonly logList: Locator;
  readonly logClose: Locator;
  // Compare sheet
  readonly compareSheet: Locator;
  readonly compareClose: Locator;
  readonly compareAxis: Locator;
  readonly compareScale: Locator;
  readonly compareLines: Locator;
  readonly compareList: Locator;
  readonly compareQuery: Locator;
  readonly compareMsg: Locator;
  readonly compareRead: Locator;
  readonly compareExampleQuasars: Locator;
  readonly compareExampleM82: Locator;
  // Depth card
  readonly depthCard: Locator;
  readonly depthList: Locator;
  readonly depthStatus: Locator;
  // Source files card
  readonly filesCard: Locator;
  readonly filesMode: Locator;
  readonly filesNote: Locator;
  readonly filesList: Locator;
  readonly filesUrlsButton: Locator;
  readonly filesCsvButton: Locator;
  // Movers card
  readonly moverCard: Locator;
  readonly moverStatus: Locator;
  readonly moverNote: Locator;
  readonly moverList: Locator;
  readonly moverOption: Locator;
  readonly moversCheckbox: Locator;
  // Simple-mode extras
  readonly simpleDepth: Locator;
  readonly simpleReading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aboutSheet = page.locator("#aboutdata");
    this.aboutClose = page.locator("#about-close");
    this.discoveriesSheet = page.locator("#discoveries");
    this.logTabs = page.locator("#logtabs");
    this.logNote = page.locator("#lognote");
    this.logList = page.locator("#loglist");
    this.logClose = page.locator("#log-close");
    this.compareSheet = page.locator("#compare");
    this.compareClose = page.locator("#cmp-close");
    this.compareAxis = page.locator("#cmpaxis");
    this.compareScale = page.locator("#cmpscale");
    this.compareLines = page.locator("#cmplines");
    this.compareList = page.locator("#cmplist");
    this.compareQuery = page.locator("#cmpq");
    this.compareMsg = page.locator("#cmpmsg");
    this.compareRead = page.locator("#cmpread");
    this.compareExampleQuasars = page.locator('button[data-cmp-example="quasars"]');
    this.compareExampleM82 = page.locator('button[data-cmp-example="m82"]');
    this.depthCard = page.locator("#depthcard");
    this.depthList = page.locator("#depthlist");
    this.depthStatus = page.locator("#depthstatus");
    this.filesCard = page.locator("#filescard");
    this.filesMode = page.locator("#filesmode");
    this.filesNote = page.locator("#filesnote");
    this.filesList = page.locator("#fileslist");
    this.filesUrlsButton = page.locator("#files-urls");
    this.filesCsvButton = page.locator("#files-csv");
    this.moverCard = page.locator("#movercard");
    this.moverStatus = page.locator("#moverstatus");
    this.moverNote = page.locator("#movernote");
    this.moverList = page.locator("#moverlist");
    this.moverOption = page.locator("#moveropt");
    this.moversCheckbox = page.locator("#ov-movers");
    this.simpleDepth = page.locator("#sdepth");
    this.simpleReading = page.locator("#sreading");
  }

  logTab(value: string): Locator {
    return this.logTabs.locator(`button[data-v="${value}"]`);
  }

  compareAxisButton(value: string): Locator {
    return this.compareAxis.locator(`button[data-v="${value}"]`);
  }

  compareScaleButton(value: string): Locator {
    return this.compareScale.locator(`button[data-v="${value}"]`);
  }

  /** Rows of the compare list; each carries a z number input and a Reset link. */
  compareItems(): Locator {
    return this.compareList.locator("li");
  }

  compareItemZ(index: number): Locator {
    return this.compareList.locator("li").nth(index).locator('input[data-cmp="z"]');
  }

  compareItemReset(index: number): Locator {
    return this.compareList.locator("li").nth(index).getByRole("button", { name: "Reset" });
  }

  compareItemPublished(index: number): Locator {
    return this.compareList.locator("li").nth(index).locator(".cmppub");
  }
}
