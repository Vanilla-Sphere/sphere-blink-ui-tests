import { defineConfig, devices } from "@playwright/test";
import { config } from "./src/config.js";

export default defineConfig({
  testDir: "./src/specs",
  fullyParallel: false,
  /* One worker: the target runs as a single web process that already asks busy
     clients to wait (HTTP 429), and view loads repeat across cases and rely on
     the server cache. Sequential runs keep the load — and the results — steady. */
  workers: 1,
  /* First loads of a view can take a while: the server cuts the images on demand. */
  timeout: 120_000,
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
