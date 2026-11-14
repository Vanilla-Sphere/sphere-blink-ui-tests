import type { Page } from "@playwright/test";

/** A cached Advanced view used as the common precondition of many cases. */
export const BARNARD_ADVANCED = "/?ui=adv&target=barnard&fov=8";

/**
 * Opens a page of the app and makes sure the app itself loaded. The hosting
 * platform occasionally serves a 502 error page or restarts the service for
 * ~30 s during a deploy (the viewer even shows a "back in a moment" note for
 * this). Those windows are waited out here; everything a test asserts happens
 * after the real app is up.
 */
export async function open(page: Page, path: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const loaded = await page.evaluate(() => document.getElementById("q") !== null);
      if (loaded) return;
      lastError = new Error("the app shell is missing (error page served)");
    } catch (e) {
      lastError = e;
    }
    await page.waitForTimeout(8_000);
  }
  throw new Error(`could not load ${path}: ${String(lastError)}`);
}

/** Interface mode of the viewer: attribute on <html>. */
export async function uiMode(page: Page): Promise<string> {
  return page.evaluate(() => document.documentElement.dataset.ui ?? "");
}

/** Active screen: attribute on <html> ("map" or "view"). */
export async function screen(page: Page): Promise<string> {
  return page.evaluate(() => document.documentElement.dataset.screen ?? "");
}

/**
 * A cheap fingerprint of a canvas so tests can tell "redrawn differently"
 * from "unchanged" without asserting pixels. Samples every few hundredth pixel.
 */
export async function canvasChecksum(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const cv = document.querySelector(sel) as HTMLCanvasElement | null;
    if (!cv) return -1;
    const ctx = cv.getContext("2d");
    if (!ctx) return -1;
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let sum = 0;
    // every pixel: small drawn marks (the crosshair on a phone-size canvas)
    // must not slip between samples
    for (let i = 0; i < data.length; i += 4) sum += data[i]! + data[i + 1]! + data[i + 2]!;
    return sum;
  }, selector);
}

/** Waits until the canvas has settled (requestAnimationFrame batches the drawing). */
export async function stableCanvasChecksum(page: Page, selector: string, tries = 8): Promise<number> {
  let previous = -2;
  for (let i = 0; i < tries; i++) {
    const value = await canvasChecksum(page, selector);
    if (value === previous && value > 0) return value;
    previous = value;
    await page.waitForTimeout(250);
  }
  return previous;
}

/**
 * Waits until the sky map has finished its first full paint. Since the 2MASS
 * atlas backdrop (added with the v50 viewer) tiles in asynchronously, a single
 * stable read can latch onto an intermediate state; this requires the same
 * settled value across several reads spread over about two seconds.
 */
export async function awaitMapSettled(page: Page, selector = "#map"): Promise<number> {
  let previous = await stableCanvasChecksum(page, selector);
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(600);
    const next = await stableCanvasChecksum(page, selector);
    if (next === previous && next > 10_000) return next;
    previous = next;
  }
  return previous;
}

export interface FramePosition {
  /** 1-based index of the frame on screen. */
  index: number;
  /** Total number of frames in the loaded sequence. */
  total: number;
}

/** Reads "i / n" from the frame counter. */
export async function framePosition(page: Page): Promise<FramePosition> {
  const text = await page.locator("#count").textContent();
  const match = /(\d+) \/ (\d+)/.exec(text ?? "");
  if (!match) return { index: 0, total: 0 };
  return { index: Number(match[1]), total: Number(match[2]) };
}

/**
 * Waits until the viewer has at least `minFrames` frames of the current view.
 * The server cuts images on demand, so the first load can take a while.
 */
export async function waitViewReady(page: Page, minFrames = 1, timeout = 120_000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const count = document.getElementById("count")?.textContent ?? "";
      const match = /(\d+) \/ (\d+)/.exec(count);
      return match !== null && Number(match[2]) >= min;
    },
    minFrames,
    { timeout },
  );
  if (minFrames >= 2) {
    await page.waitForFunction(
      () => {
        const next = document.getElementById("next");
        return next !== null && (next as HTMLButtonElement).disabled === false;
      },
      undefined,
      { timeout },
    );
  }
}

/** Waits until the view screen is shown (the view request resolved; frames may still be loading). */
export async function waitViewScreen(page: Page, timeout = 90_000): Promise<void> {
  await page.waitForFunction(() => document.documentElement.dataset.screen === "view", undefined, { timeout });
}

/** Waits until the map screen is shown. */
export async function waitMapScreen(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(() => document.documentElement.dataset.screen === "map", undefined, { timeout });
}

/** Parses the current query string into a plain object (values stay URL-encoded). */
export async function urlParams(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(location.search).entries()) out[key] = value;
    return out;
  });
}

/** Computed style of one property, for one selector's first match. */
export async function computedStyle(page: Page, selector: string, property: string): Promise<string> {
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).getPropertyValue(prop) : "";
    },
    [selector, property] as [string, string],
  );
}
