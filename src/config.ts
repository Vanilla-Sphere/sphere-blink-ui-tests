/**
 * Environment knobs for the suite. Nothing here is read from the page;
 * see the README for how to point the suite at another environment.
 */
const rawBaseUrl = process.env.BASE_URL ?? "https://vanillasphere.com/";
const host = new URL(rawBaseUrl).hostname;

export const config = {
  baseUrl: rawBaseUrl,
  /** true for the public production site. */
  isProduction: /^(www\.)?vanillasphere\.com$/.test(host),
  /**
   * true for every host whose backend is the shared production service.
   * docs/environments.md: dev.vanillasphere.com proxies to production, it is
   * NOT an isolated staging. On any shared backend, cases that write data or
   * start heavy server jobs stay skipped.
   */
  sharedBackend: host === "vanillasphere.com" || host === "www.vanillasphere.com" || host === "dev.vanillasphere.com",
  /**
   * UI-025 / UI-026 open progressive fields, which start cell-cutting jobs on the
   * server (a 7x7 field reads about 700 exposures) and may trigger a blind search
   * afterwards. Enable only on an isolated staging backend where creating such
   * jobs is approved — never on production or dev.
   */
  allowHeavyJobs: process.env.TEST_ALLOW_HEAVY_JOBS === "1",
  /**
   * UI-037 clicks "Measure this object", which writes measurement rows on the
   * server. Enable only on an isolated staging backend that is allowed to
   * store data — never on production or dev.
   */
  allowMeasure: process.env.TEST_ALLOW_MEASURE === "1",
} as const;
