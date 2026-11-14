/**
 * Environment knobs for the suite. Nothing here is read from the page;
 * see the README for how to point the suite at another environment.
 */
const rawBaseUrl = process.env.BASE_URL ?? "https://vanillasphere.com/";

export const config = {
  baseUrl: rawBaseUrl,
  /** true only for the public production site: write and heavy-job cases stay skipped there. */
  isProduction: /^(www\.)?vanillasphere\.com$/.test(new URL(rawBaseUrl).hostname),
  /**
   * UI-025 / UI-026 open progressive fields, which start cell-cutting jobs on the
   * server (a 7x7 field reads about 700 exposures). Enable only on a staging
   * environment where creating such jobs is approved.
   */
  allowHeavyJobs: process.env.TEST_ALLOW_HEAVY_JOBS === "1",
  /**
   * UI-037 clicks "Measure this object", which writes measurement rows on the
   * server. Enable only on an isolated staging environment that is allowed to
   * store data.
   */
  allowMeasure: process.env.TEST_ALLOW_MEASURE === "1",
} as const;
