import { defineConfig, devices } from "@playwright/test";
import { config } from "./src/config.js";

export default defineConfig({
  testDir: "./src/specs",
  fullyParallel: true,
  /* Four workers: the instant checks (00-fast) never load data and run fully
     parallel; the journey is serial and keeps one worker per project, so at
     most two view loads touch the shared service at once. The app waits out
     HTTP 429 with the server's Retry-After before it shows an error. */
  workers: 4,
  /* First loads of a view can take minutes: the server cuts the images on
     demand, and a freshly started service (as in CI) also builds its cache. */
  timeout: 300_000,
  expect: { timeout: 15_000 },
  /* No retries: a failure is reported as it happened, per the project's honest-reporting rule. */
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: config.baseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "smartphone",
      use: {
        ...devices["iPhone 13"],
        /* The iPhone 13 descriptor defaults to WebKit; the suite pins the
           Chromium engine on purpose: viewport 390x844, DPR 3, touch and the
           mobile user agent are emulated, on the same engine family as the
           desktop project. This is not a test on a physical phone. */
        browserName: "chromium",
      },
    },
  ],
});
