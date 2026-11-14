import { type Locator, type Page } from "@playwright/test";

/** The fixed top bar: brand, sky-map button, search, field menu, mode switch, links. */
export class TopBar {
  readonly page: Page;
  readonly brand: Locator;
  readonly skyMapButton: Locator;
  readonly query: Locator;
  readonly goButton: Locator;
  readonly searchError: Locator;
  readonly fieldSelect: Locator;
  readonly simpleButton: Locator;
  readonly advancedButton: Locator;
  readonly apiLink: Locator;
  readonly sourceLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brand = page.locator(".brand");
    this.skyMapButton = page.locator("#tomap");
    this.query = page.locator("#q");
    this.goButton = page.locator("#go");
    this.searchError = page.locator("#searcherr");
    this.fieldSelect = page.locator("#fov");
    this.simpleButton = page.locator('#ui button[data-v="simple"]');
    this.advancedButton = page.locator('#ui button[data-v="adv"]');
    this.apiLink = page.locator('nav.barlinks a[href="/docs"]');
    this.sourceLink = page.locator('nav.barlinks a[href*="github.com/Vanilla-Sphere"]');
  }

  /** Types into the search box and submits the form. */
  async search(term: string): Promise<void> {
    await this.query.fill(term);
    await this.goButton.click();
  }

  async switchTo(mode: "simple" | "adv"): Promise<void> {
    const button = mode === "simple" ? this.simpleButton : this.advancedButton;
    await button.click();
  }

  /** Picks a field of view; progressive fields are the "p1"/"p3" options. */
  async chooseField(value: string): Promise<void> {
    await this.fieldSelect.selectOption(value);
  }
}
