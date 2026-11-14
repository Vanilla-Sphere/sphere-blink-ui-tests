import { expect, test as base, type Page } from "@playwright/test";
import { AdvancedRail } from "./pages/AdvancedRail.js";
import { Analysis } from "./pages/Analysis.js";
import { Extras } from "./pages/Extras.js";
import { config } from "./config.js";
import { MapScreen } from "./pages/MapScreen.js";
import { TopBar } from "./pages/TopBar.js";
import { ViewStage } from "./pages/ViewStage.js";

export interface Pages {
  topBar: TopBar;
  mapScreen: MapScreen;
  viewStage: ViewStage;
  advancedRail: AdvancedRail;
  analysis: Analysis;
  extras: Extras;
}

/**
 * The shared page is worker-scoped on purpose: the journey tests walk the
 * product in one continuous flow, so every test on a worker sees the same
 * browser state, and the page objects wrap that same page.
 */
const workerPage = base.extend<object, { sharedPage: Page }>({
  sharedPage: [async ({ browser }, use, workerInfo) => {
    const context = await browser.newContext({
      ...(workerInfo.project.use as Record<string, unknown>),
      baseURL: config.baseUrl,
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await use(page);
    await context.close();
  }, { scope: "worker" }],
});

export const test = workerPage.extend<Pages>({
  page: async ({ sharedPage }, use) => use(sharedPage),
  topBar: async ({ page }, use) => use(new TopBar(page)),
  mapScreen: async ({ page }, use) => use(new MapScreen(page)),
  viewStage: async ({ page }, use) => use(new ViewStage(page)),
  advancedRail: async ({ page }, use) => use(new AdvancedRail(page)),
  analysis: async ({ page }, use) => use(new Analysis(page)),
  extras: async ({ page }, use) => use(new Extras(page)),
});

export { expect };
