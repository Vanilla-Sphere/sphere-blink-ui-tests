import { expect, test as base } from "@playwright/test";
import { AdvancedRail } from "./pages/AdvancedRail.js";
import { Analysis } from "./pages/Analysis.js";
import { MapScreen } from "./pages/MapScreen.js";
import { TopBar } from "./pages/TopBar.js";
import { ViewStage } from "./pages/ViewStage.js";

export interface Pages {
  topBar: TopBar;
  mapScreen: MapScreen;
  viewStage: ViewStage;
  advancedRail: AdvancedRail;
  analysis: Analysis;
}

export const test = base.extend<Pages>({
  topBar: async ({ page }, use) => use(new TopBar(page)),
  mapScreen: async ({ page }, use) => use(new MapScreen(page)),
  viewStage: async ({ page }, use) => use(new ViewStage(page)),
  advancedRail: async ({ page }, use) => use(new AdvancedRail(page)),
  analysis: async ({ page }, use) => use(new Analysis(page)),
});

export { expect };
