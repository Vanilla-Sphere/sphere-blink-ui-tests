import { annotateCase } from "../helpers/case.js";
import { BARNARD_ADVANCED, open, waitViewReady } from "../helpers/app.js";
import { expect, test } from "../fixtures.js";

test.describe("Playback (manual cases UI-016 .. UI-019)", () => {
  // UI-016 · P0 · features.md §4
  // Expected: Next moves frame, date and slider forward; Previous returns; the
  // metadata follows.
  test("[UI-016] Next và Previous", async ({ page, viewStage }) => {
    annotateCase(test.info(), "UI-016", "P0", "features.md §4");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page, 2);

    expect((await viewStage.framePosition()).index).toBe(1);
    const dateBefore = await viewStage.statusDate.textContent();

    await viewStage.stepForward();
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(2);
    expect(await viewStage.slider.inputValue()).toBe("1");
    expect(await viewStage.statusDate.textContent()).not.toBe(dateBefore);

    await viewStage.stepBack();
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(1);
    expect(await viewStage.statusDate.textContent()).toBe(dateBefore);
  });

  // UI-017 · P0 · features.md §4
  // Expected: Play runs the frames and Pause stops them; the speed is selected
  // and used by the player (the exact cadence is not measured here).
  test("[UI-017] Play, pause và tốc độ", async ({ page, viewStage }) => {
    annotateCase(test.info(), "UI-017", "P0", "features.md §4");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page, 2);

    await viewStage.togglePlay();
    expect(await viewStage.isPlaying()).toBe(true);
    await expect(viewStage.playLabel).toHaveText("Pause");
    const start = await viewStage.framePosition().then((p) => p.index);
    await expect
      .poll(() => viewStage.framePosition().then((p) => p.index), { timeout: 10_000, intervals: [200] })
      .toBeGreaterThan(start);

    await viewStage.togglePlay();
    expect(await viewStage.isPlaying()).toBe(false);
    await expect(viewStage.playLabel).toHaveText("Play");
    const stopped = await viewStage.framePosition().then((p) => p.index);
    await page.waitForTimeout(1_500);
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(stopped);

    await viewStage.setSpeed("12");
    await expect(viewStage.speedSelect).toHaveValue("12");
  });

  // UI-018 · P1 · features.md §4
  // Expected: the slider jumps to the first/last frame; picking a date on the
  // timeline updates frame, index, date and metadata consistently.
  test("[UI-018] Slider và timeline", async ({ page, viewStage }) => {
    annotateCase(test.info(), "UI-018", "P1", "features.md §4");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page, 2);

    await viewStage.jumpToLastFrame();
    const { total } = await viewStage.framePosition();
    expect(await viewStage.framePosition()).toEqual({ index: total, total });
    expect(await viewStage.slider.inputValue()).toBe(String(total - 1));
    expect((await viewStage.statusDate.textContent()) ?? "").not.toBe("");

    await viewStage.clickTimelinePin(2);
    const expectedIndex = Number(await viewStage.timelinePins.nth(2).getAttribute("data-i")) + 1;
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(expectedIndex);
    expect(await viewStage.slider.inputValue()).toBe(String(expectedIndex - 1));
  });

  // UI-019 · P1 · viewer.md §Accessibility (EX-04)
  // Expected: Space plays/pauses and the arrows step frames; while typing in the
  // search box the same keys edit the text and must not drive the player.
  test("[UI-019] Phím tắt không cản nhập liệu", async ({ page, topBar, viewStage }) => {
    annotateCase(test.info(), "UI-019", "P1", "viewer.md §Accessibility");

    await open(page, BARNARD_ADVANCED);
    await waitViewReady(page, 2);

    // Space plays; how many frames pass before the second Space lands depends on
    // timing, so the baseline is read after pausing, not assumed.
    await page.keyboard.press(" ");
    expect(await viewStage.isPlaying()).toBe(true);
    await page.keyboard.press(" ");
    expect(await viewStage.isPlaying()).toBe(false);
    const baseline = await viewStage.framePosition().then((p) => p.index);

    await page.keyboard.press("ArrowRight");
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(baseline + 1);

    await topBar.query.click();
    await topBar.query.fill(""); // the app pre-fills the box with the target name
    await page.keyboard.type("alpha beta");
    await expect(topBar.query).toHaveValue("alpha beta");
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(baseline + 1);
    expect(await viewStage.isPlaying()).toBe(false);

    await page.keyboard.press("ArrowLeft"); // caret move inside the text field
    await expect(topBar.query).toHaveValue("alpha beta");
    expect(await viewStage.framePosition().then((p) => p.index)).toBe(baseline + 1);
  });
});
