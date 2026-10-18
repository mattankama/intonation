import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

const scene = (page: Page) => page.getByRole('group', { name: 'Roughness landscape' });
const section = (page: Page) => page.locator('.br-roughness');
const readout = (page: Page) => page.locator('.br-chord-readout');
const bottomNote = (page: Page) => page.getByLabel('Bottom note');
const showEdo12 = (page: Page) => page.getByLabel('Show 12-EDO versions');
const pinButton = (page: Page, name: string) => page.getByRole('button', { name: `Play ${name}`, exact: true });
const mathSection = (panel: Locator, heading: string) =>
  panel.locator('.math-section', { has: panel.page().getByRole('heading', { name: heading, exact: true }) });

/** Records the frequency of every oscillator started. */
async function recordOscillators(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __started: number[]; OscillatorNode: typeof OscillatorNode };
    w.__started = [];
    const Original = w.OscillatorNode;
    w.OscillatorNode = class extends Original {
      constructor(context: BaseAudioContext, options?: OscillatorOptions) {
        super(context, options);
        w.__started.push(Math.round((options?.frequency ?? 0) * 100) / 100);
      }
    };
  });
  return () => page.evaluate(() => (window as unknown as { __started: number[] }).__started);
}

test('the landscape mounts on the full ~200 × 200 grid with the bottom note at C4', async ({ page }) => {
  await page.goto('/beats-and-roughness');
  await expect(scene(page).locator('canvas')).toBeVisible();
  await expect(section(page)).toHaveAttribute('data-points', '201');
  await expect(bottomNote(page)).toHaveValue('C4');
  await expect(showEdo12(page)).not.toBeChecked();
  await expect(page.locator('.br-roughness-caption')).toContainText('relative roughness, 0–1');
});

test('the bottom note and the 12-EDO toggle are stored in the URL', async ({ page }) => {
  await page.goto('/beats-and-roughness');
  await bottomNote(page).selectOption('C3');
  await expect(page).toHaveURL(/\/beats-and-roughness\?bottom=C3$/);
  await showEdo12(page).check();
  await expect(page).toHaveURL(/\?bottom=C3&edo12=1$/);
  await page.goto('/beats-and-roughness?bottom=C5&edo12=1');
  await expect(bottomNote(page)).toHaveValue('C5');
  await expect(showEdo12(page)).toBeChecked();
});

test('a pinned chord plays on the bottom note and its roughness is shown', async ({ page }) => {
  const started = await recordOscillators(page);
  await page.goto('/beats-and-roughness');
  await pinButton(page, 'major 4:5:6').click();
  await expect.poll(started).toEqual([261.63, 327.03, 392.44]);
  await expect(readout(page)).toContainText('major 4:5:6');
  await expect(readout(page)).toContainText('386.3¢');
  await expect(readout(page)).toContainText('315.6¢');
  await expect(readout(page)).toContainText('Relative roughness');
});

test('the 12-EDO versions can be played once shown, and are rougher than the pure chords', async ({ page }) => {
  const started = await recordOscillators(page);
  await page.goto('/beats-and-roughness?timbre=string');
  await expect(pinButton(page, '12-EDO major')).toHaveCount(0);
  await showEdo12(page).check();
  await pinButton(page, '12-EDO major').click();
  await expect.poll(started).toEqual([261.63, 329.63, 392]);
  const value = async (name: string) =>
    Number(await page.locator('.br-pin', { has: pinButton(page, name) }).locator('.br-pin-roughness').textContent());
  expect(await value('major 4:5:6')).toBeLessThan(await value('12-EDO major'));
});

test('7th chords are pinned without their fifth', async ({ page }) => {
  await page.goto('/beats-and-roughness');
  await expect(pinButton(page, 'dominant 7th 20:25:36 (no 5th)')).toBeVisible();
});

test('clicking the landscape plays the three-note chord under the pointer', async ({ page }) => {
  const started = await recordOscillators(page);
  await page.goto('/beats-and-roughness');
  const canvas = scene(page).locator('canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  // The surface may still be building when the canvas appears: click until a chord plays.
  await expect(async () => {
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55);
    await expect(readout(page)).toContainText('Lower interval', { timeout: 500 });
  }).toPass();
  // One three-note chord per click.
  expect((await started()).length % 3).toBe(0);
  expect((await started()).length).toBeGreaterThan(0);
});

test('the wording claims roughness only; The math explains it is one ingredient of consonance', async ({
  page,
}) => {
  await page.goto('/beats-and-roughness?bottom=C3');
  await expect(section(page)).not.toContainText(/consonan|dissonan/i);
  await expect(page.locator('.br-roughness-controls')).not.toContainText(/consonan|dissonan/i);
  await page.getByRole('tab', { name: 'The math' }).click();
  const math = page.getByRole('tabpanel', { name: 'The math' });
  await expect(mathSection(math, 'The bottom note').locator('[data-step="result"]')).toContainText('130.81');
  await expect(mathSection(math, 'Two partials').locator('[data-step="general"]')).toContainText('5.75');
  await expect(mathSection(math, 'The whole chord').locator('[data-step="result"]')).toBeVisible();
  await expect(mathSection(math, 'Roughness is one ingredient')).toContainText('consonan');
  await expect(math.getByText('Tuning, Timbre, Spectrum, Scale', { exact: false })).toBeVisible();
});

test('without 3D graphics the landscape is replaced by a notice and the chords still play', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('/beats-and-roughness');
  await expect(scene(page).getByText('This view needs 3D graphics, which this browser can’t show.')).toBeVisible();
  await pinButton(page, 'minor 10:12:15').click();
  await expect(readout(page)).toContainText('minor 10:12:15');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the landscape uses a coarser ~60 × 60 grid with pins named on tap', async ({ page }) => {
    await page.goto('/beats-and-roughness');
    await expect(scene(page).locator('canvas')).toBeVisible();
    await expect(section(page)).toHaveAttribute('data-points', '61');
    await expect(page.locator('.br-roughness-caption')).toContainText('Tap a pin to name it');
  });
});
