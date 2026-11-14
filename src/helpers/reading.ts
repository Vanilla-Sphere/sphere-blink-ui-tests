import { expect, type Page } from "@playwright/test";

/**
 * Waits for the spectrum card and its preliminary reading. The viewer stops
 * polling the spectrum after about a minute; when the server needs longer
 * (a cold view), a visitor re-opens the view, and so do these tests.
 */
export async function waitForReading(page: Page, attempts = 3): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await expect(page.locator("#speccard")).toBeVisible({ timeout: 80_000 });
      await expect(page.locator("#reading")).toBeVisible({ timeout: 60_000 });
      return;
    } catch (e) {
      if (attempt === attempts - 1) throw e;
      await page.reload();
      await page.waitForFunction(
        () => /1 \/ [1-9]/.test(document.getElementById("count")?.textContent ?? ""),
        undefined,
        { timeout: 180_000 },
      );
    }
  }
}
