import { expect, type Locator, type Page } from "@playwright/test";
import { framePosition } from "../helpers/app.js";

/**
 * The image stage: the picture, the progress strip, the HUD, the transport
 * controls and the timeline; plus the Simple-mode side panel.
 */
export class ViewStage {
  readonly page: Page;
  readonly image: Locator;
  readonly targetCard: Locator;
  readonly targetName: Locator;
  readonly targetCoords: Locator;
  readonly emptyState: Locator;
  readonly progress: Locator;
  readonly progressText: Locator;
  readonly hud: Locator;
  readonly hudChannels: Locator;
  readonly statusDate: Locator;
  readonly statusCount: Locator;
  readonly previousButton: Locator;
  readonly playButton: Locator;
  readonly playLabel: Locator;
  readonly nextButton: Locator;
  readonly slider: Locator;
  readonly counter: Locator;
  readonly speedSelect: Locator;
  readonly timeline: Locator;
  readonly timelinePins: Locator;
  // Simple-mode panel
  readonly simpleName: Locator;
  readonly simpleKind: Locator;
  readonly simpleStory: Locator;
  readonly shareButton: Locator;
  readonly shareLabel: Locator;
  readonly gifLink: Locator;
  readonly toAdvancedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.image = page.locator("#sky");
    this.targetCard = page.locator("#targetcard");
    this.targetName = page.locator("#tname");
    this.targetCoords = page.locator("#tcoords");
    this.emptyState = page.locator("#empty");
    this.progress = page.locator("#progress");
    this.progressText = page.locator("#ptext");
    this.hud = page.locator("#hud");
    this.hudChannels = page.locator("#hud .chans");
    this.statusDate = page.locator("#sdate");
    this.statusCount = page.locator("#scount");
    this.previousButton = page.locator("#prev");
    this.playButton = page.locator("#play");
    this.playLabel = page.locator("#playlabel");
    this.nextButton = page.locator("#next");
    this.slider = page.locator("#slider");
    this.counter = page.locator("#count");
    this.speedSelect = page.locator("#fps");
    this.timeline = page.locator("#timeline");
    this.timelinePins = page.locator("#timeline i");
    this.simpleName = page.locator("#sname");
    this.simpleKind = page.locator("#skind");
    this.simpleStory = page.locator("#sstory");
    this.shareButton = page.locator("#sshare");
    this.shareLabel = page.locator("#ssharelabel");
    this.gifLink = page.locator("#sgif");
    this.toAdvancedButton = page.locator("#toadv");
  }

  async framePosition() {
    return framePosition(this.page);
  }

  /** True while the player is running (button state). */
  async isPlaying(): Promise<boolean> {
    const cls = await this.playButton.getAttribute("class");
    return (cls ?? "").split(" ").includes("playing");
  }

  async stepForward(): Promise<void> {
    await this.nextButton.click();
  }

  async stepBack(): Promise<void> {
    await this.previousButton.click();
  }

  async togglePlay(): Promise<void> {
    await this.playButton.click();
  }

  async setSpeed(fps: string): Promise<void> {
    await this.speedSelect.selectOption(fps);
  }

  /** Jumps to the last frame by filling the range slider. */
  async jumpToLastFrame(): Promise<void> {
    const max = await this.slider.getAttribute("max");
    await this.slider.fill(max ?? "0");
  }

  /** Clicks the n-th pin on the observation-date timeline. */
  async clickTimelinePin(n: number): Promise<void> {
    await this.timelinePins.nth(n).click();
  }

  /** Waits until a reload of the frames (band or grouping change) has finished. */
  async waitForFrameReload(timeout = 45_000): Promise<void> {
    await expect(this.progress).toBeHidden({ timeout });
  }

  /** The frame-counter text "i / n". */
  async counterText(): Promise<string> {
    return (await this.counter.textContent()) ?? "";
  }

  /**
   * Steps forward through the frames until `predicate` holds, or the frame limit
   * is reached. Returns the 0-based frame index, or null when nothing matched.
   * Used for data-dependent cases: whether a borrowed channel or flagged frame
   * exists depends on the data the server serves today.
   */
  async findFrameWhere(predicate: () => Promise<boolean>, maxFrames: number): Promise<number | null> {
    const { total } = await this.framePosition();
    const limit = Math.min(maxFrames, total);
    for (let step = 0; step < limit; step++) {
      if (await predicate()) return step;
      if (step < limit - 1) await this.stepForward();
    }
    return null;
  }
}
