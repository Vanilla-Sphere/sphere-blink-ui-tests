import { type Locator, type Page } from "@playwright/test";

/** The Advanced-mode analysis column: spectrum, this-frame info, tracks, cross-links, share links. */
export class Analysis {
  readonly page: Page;
  readonly spectrumCard: Locator;
  readonly spectrumTitle: Locator;
  readonly spectrumModeButtons: Locator;
  readonly spectrumLegend: Locator;
  readonly spectrumEmptyNote: Locator;
  readonly overTimeNav: Locator;
  readonly overTimeLabel: Locator;
  readonly flaggedToggle: Locator;
  readonly csvButton: Locator;
  readonly pngButton: Locator;
  readonly compareButton: Locator;
  readonly readingCard: Locator;
  readonly readingConfidence: Locator;
  readonly readingLine: Locator;
  readonly readingFoot: Locator;
  readonly readingRefDetails: Locator;
  readonly readingRefRows: Locator;
  readonly readingCaveats: Locator;
  readonly trackTipButtons: Locator;
  readonly zoomIn: Locator;
  readonly zoomOut: Locator;
  readonly zoomReset: Locator;
  readonly verdict: Locator;
  readonly epochCard: Locator;
  readonly epochInfo: Locator;
  readonly epochFlagChips: Locator;
  readonly trackCard: Locator;
  readonly trackList: Locator;
  readonly measureRow: Locator;
  readonly measureButton: Locator;
  readonly measureStatus: Locator;
  readonly linkCard: Locator;
  readonly decimalPosition: Locator;
  readonly sexagesimalPosition: Locator;
  readonly wiseViewLink: Locator;
  readonly simbadLink: Locator;
  readonly aladinLink: Locator;
  readonly shareCard: Locator;
  readonly pageLinkInput: Locator;
  readonly gifLinkInput: Locator;
  readonly apiLinkInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.spectrumCard = page.locator("#speccard");
    this.spectrumTitle = page.locator("#spectitle");
    this.spectrumModeButtons = page.locator("#plotmode");
    this.spectrumLegend = page.locator("#legend");
    this.spectrumEmptyNote = page.locator("#specempty");
    this.overTimeNav = page.locator("#otnav");
    this.overTimeLabel = page.locator("#otlabel");
    this.flaggedToggle = page.locator("#flagtoggle");
    this.csvButton = page.locator("#dl-csv");
    this.pngButton = page.locator("#dl-png");
    this.compareButton = page.locator("#cmp-open");
    this.readingCard = page.locator("#reading");
    this.readingConfidence = page.locator("#readconf");
    this.readingLine = page.locator("#readline");
    this.readingFoot = page.locator("#readfoot");
    this.readingRefDetails = page.locator("#readref");
    this.readingRefRows = page.locator("#readrefrows tr");
    this.readingCaveats = page.locator("#readcaveats li");
    this.trackTipButtons = page.locator("#tracklist .tipbtn");
    this.zoomIn = page.locator("#zoom-in");
    this.zoomOut = page.locator("#zoom-out");
    this.zoomReset = page.locator("#zoom-x");
    this.verdict = page.locator("#plotverdict");
    this.epochCard = page.locator("#epochcard");
    this.epochInfo = page.locator("#einfo");
    this.epochFlagChips = page.locator("#einfo .flag");
    this.trackCard = page.locator("#trackcard");
    this.trackList = page.locator("#tracklist");
    this.measureRow = page.locator("#measurerow");
    this.measureButton = page.locator("#measure");
    this.measureStatus = page.locator("#measurestatus");
    this.linkCard = page.locator("#linkcard");
    this.decimalPosition = page.locator("#tdeci");
    this.sexagesimalPosition = page.locator("#tsexa");
    this.wiseViewLink = page.locator("#l-wiseview");
    this.simbadLink = page.locator("#l-simbad");
    this.aladinLink = page.locator("#l-aladin");
    this.shareCard = page.locator("#sharecard");
    this.pageLinkInput = page.locator("#s-page");
    this.gifLinkInput = page.locator("#s-gif");
    this.apiLinkInput = page.locator("#s-api");
  }

  /** Switches the plot between "Spectrum" and "Light curve". */
  async choosePlot(mode: "spec" | "lc"): Promise<void> {
    await this.spectrumModeButtons.locator(`button[data-v="${mode}"]`).click();
  }

  /** The date of the frame on screen, from the "This frame" card (its first dd). */
  async epochLabel(): Promise<string> {
    return (await this.epochInfo.locator("dd").first().textContent()) ?? "";
  }
}
