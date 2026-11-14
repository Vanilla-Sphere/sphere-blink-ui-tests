import { type APIRequestContext, type Page } from "@playwright/test";

/**
 * Fixture data for the movers UI. Everything the movers cases need is served
 * from client-side route mocks ([mock]); no vote, no measurement, no blind
 * search ever reaches a real server. The mover's position sits on Barnard's
 * Star, so the opened frame is a real, cached view — read-only.
 */
export const MOVER_ID = "qa-mover-1";

export interface MoverEpoch {
  uid: string;
  mjd: number;
  index: number;
}

/** Reads a real exposure of the cached Barnard view, retrying through deployment windows. */
export async function pickBarnardExposure(request: APIRequestContext): Promise<MoverEpoch> {
  let lastError = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const r = await request.get("/api/epochs?target=barnard&det=6&group=exposure");
      const text = await r.text();
      if (!r.ok() || !text.startsWith("{")) throw new Error(`HTTP ${r.status()}, not JSON`);
      const { epochs } = JSON.parse(text) as { epochs: { mjd: number; exposures: string[] }[] };
      const index = Math.floor(epochs.length / 2);
      const chosen = epochs[index];
      if (!chosen) throw new Error("the epoch list was empty");
      return { uid: chosen.exposures[0]!, mjd: chosen.mjd, index };
    } catch (e) {
      lastError = String(e);
      await new Promise((resolve) => setTimeout(resolve, 15_000));
    }
  }
  throw new Error(`could not read the epoch list for the mover fixture: ${lastError}`);
}

export function moverDetail(epoch: MoverEpoch) {
  return {
    id: MOVER_ID,
    ra0: 269.44629,
    dec0: 4.76792,
    v_east: -18,
    v_north: 16,
    mjd0: epoch.mjd,
    rate_arcsec_hr: 24.08,
    pa_deg: 132,
    times_seen: 3,
    n_times: 3,
    times_covered: 5,
    known: null,
    votes: { real: 1, false: 0 },
    my_vote: null,
    points: [{ mjd: epoch.mjd, detector: 6, ra: 269.44629, dec: 4.76792, exposure: epoch.uid, snr: 9.5, wave_um: 4.7 }],
  };
}

export function mockMoverRoutes(page: Page, epoch: MoverEpoch): void {
  let myVote: string | null = null;
  let votes = { real: 1, false: 0 };
  page.route(`**/api/movers/${MOVER_ID}?*`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...moverDetail(epoch), my_vote: myVote, votes }) }),
  );
  page.route(`**/api/movers/${MOVER_ID}/vote`, async (route) => {
    const body = route.request().postDataJSON() as { vote: string | null };
    myVote = body.vote;
    votes = body.vote === "real" ? { real: votes.real + 1, false: votes.false } : body.vote === "false" ? { real: votes.real, false: votes.false + 1 } : votes;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ votes, my_vote: myVote }) });
  });
}

/** Pins the mocked mover through its deep link onto a real Barnard view. */
export async function openPinnedMover(page: Page, epoch: MoverEpoch): Promise<void> {
  await page.route("**/api/movers?ids=*", async (route) => {
    const ids = new URL(route.request().url()).searchParams.get("ids") ?? "";
    const detail = moverDetail(epoch);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ movers: ids.includes(MOVER_ID) ? [{ ...detail, points: undefined, votes: { real: 1, false: 0 } }] : [], total: 1 }),
    });
  });
  let lastError = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await page.goto(`${process.env.BASE_URL ?? "https://vanillasphere.com"}/?ui=adv&target=barnard&fov=8&det=6&group=exposure&mover=${MOVER_ID}&seen=${encodeURIComponent(epoch.uid)}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const shell = await page.evaluate(() => document.getElementById("q") !== null);
      if (!shell) throw new Error("the app shell is missing");
      await page.waitForFunction(
        () => /1 \/ [1-9]/.test(document.getElementById("count")?.textContent ?? ""),
        undefined,
        { timeout: 150_000 },
      );
      return;
    } catch (e) {
      lastError = String(e);
      await page.waitForTimeout(8_000);
    }
  }
  throw new Error(`could not open the pinned mover view: ${lastError}`);
}
