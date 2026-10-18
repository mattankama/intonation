import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

const scene = (page: Page) => page.getByRole('group', { name: 'Interference ribbon' });
const gap = (page: Page) => page.getByLabel('Gap between the tones');
const readout = (page: Page) => page.locator('.br-readout');
const beatRate = (page: Page) => page.locator('.br-rate-value');
const playButton = (page: Page) => page.getByRole('button', { name: 'Play the two tones' });
const stopButton = (page: Page) => page.getByRole('button', { name: 'Stop the two tones' });
const mathSection = (panel: Locator, heading: string) =>
  panel.locator('.math-section', { has: panel.page().getByRole('heading', { name: heading, exact: true }) });

test('the ribbon mounts and shows the beat rate for the default 3 Hz gap', async ({ page }) => {
  await page.goto('/beats-and-roughness');
  await expect(scene(page).locator('canvas')).toBeVisible();
  await expect(beatRate(page)).toHaveText('3.00 Hz');
  await expect(readout(page)).toContainText('440.00 Hz');
  await expect(readout(page)).toContainText('443.00 Hz');
  await expect(readout(page)).toContainText('11.8¢');
  await expect(gap(page)).toHaveValue('3');
});

test('the gap slider sets the beat rate and is stored in the URL', async ({ page }) => {
  await page.goto('/beats-and-roughness');
  await gap(page).fill('5.5');
  await expect(page).toHaveURL(/\/beats-and-roughness\?gap=5.5$/);
  await expect(beatRate(page)).toHaveText('5.50 Hz');
  await expect(readout(page)).toContainText('445.50 Hz');
  await gap(page).fill('3');
  await expect(page).toHaveURL(/\/beats-and-roughness$/);
});

test('a shared URL restores the gap, and tone 1 follows the Reference pitch', async ({ page }) => {
  await page.goto('/beats-and-roughness?ref=415&gap=1.5');
  await expect(gap(page)).toHaveValue('1.5');
  await expect(beatRate(page)).toHaveText('1.50 Hz');
  await expect(readout(page)).toContainText('415.00 Hz');
  await expect(readout(page)).toContainText('416.50 Hz');
});

test('a unison does not beat, and fast gaps are flagged as roughness', async ({ page }) => {
  await page.goto('/beats-and-roughness?gap=0');
  await expect(readout(page)).toContainText('No beats: the tones are in unison.');
  await gap(page).fill('25');
  await expect(readout(page)).toContainText('too fast to count');
});

test('The math works out the beat rate from the live frequencies', async ({ page }) => {
  await page.goto('/beats-and-roughness?gap=4');
  await page.getByRole('tab', { name: 'The math' }).click();
  const math = page.getByRole('tabpanel', { name: 'The math' });
  const rate = mathSection(math, 'Beat rate');
  await expect(rate.locator('[data-step="substituted"]')).toContainText('444.00');
  await expect(rate.locator('[data-step="substituted"]')).toContainText('440.00');
  await expect(rate.locator('[data-step="result"]')).toContainText('4.00');
  await expect(mathSection(math, 'Why the sum swells').locator('[data-step="result"]')).toContainText('0.250');
  // Sine tones have no other harmonics to beat.
  await expect(mathSection(math, 'Harmonics beat faster')).toHaveCount(0);
  await expect(math.locator('.math-sources').getByText('Plomp', { exact: false })).toBeVisible();
});

test('with harmonics, The math shows the 2nd harmonics beating twice as fast', async ({ page }) => {
  await page.goto('/beats-and-roughness?timbre=organ&gap=4');
  await page.getByRole('tab', { name: 'The math' }).click();
  const math = page.getByRole('tabpanel', { name: 'The math' });
  await expect(mathSection(math, 'Harmonics beat faster').locator('[data-step="result"]')).toContainText('8.00');
});

test('Play holds both tones until Stop; the slider retunes tone 2 without restarting it', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __started: number[];
      __stopped: number;
      __retuned: number[];
      OscillatorNode: typeof OscillatorNode;
    };
    w.__started = [];
    w.__stopped = 0;
    w.__retuned = [];
    const Original = w.OscillatorNode;
    w.OscillatorNode = class extends Original {
      constructor(context: BaseAudioContext, options?: OscillatorOptions) {
        super(context, options);
        w.__started.push(options?.frequency ?? 0);
        const set = this.frequency.setValueAtTime.bind(this.frequency);
        this.frequency.setValueAtTime = (value: number, time: number) => {
          w.__retuned.push(value);
          return set(value, time);
        };
      }
      override stop(when?: number) {
        w.__stopped += 1;
        super.stop(when);
      }
    };
  });
  const audio = () =>
    page.evaluate(() => {
      const w = window as unknown as { __started: number[]; __stopped: number; __retuned: number[] };
      return { started: w.__started, stopped: w.__stopped, retuned: w.__retuned };
    });
  await page.goto('/beats-and-roughness');
  const section = page.locator('.br-beats');
  await expect(section).toHaveAttribute('data-playing', 'false');

  await playButton(page).click();
  await expect(section).toHaveAttribute('data-playing', 'true');
  await expect.poll(audio).toEqual({ started: [440, 443], stopped: 0, retuned: [] });

  await gap(page).fill('4');
  await expect.poll(audio).toEqual({ started: [440, 443], stopped: 0, retuned: [444] });

  await stopButton(page).click();
  await expect(section).toHaveAttribute('data-playing', 'false');
  await expect.poll(async () => (await audio()).stopped).toBe(2);
});

test('leaving the Lab stops the tones', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __stopped: number; OscillatorNode: typeof OscillatorNode };
    w.__stopped = 0;
    const Original = w.OscillatorNode;
    w.OscillatorNode = class extends Original {
      override stop(when?: number) {
        w.__stopped += 1;
        super.stop(when);
      }
    };
  });
  await page.goto('/beats-and-roughness');
  await playButton(page).click();
  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'Sound waves' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __stopped: number }).__stopped))
    .toBe(2);
});

test('without 3D graphics the ribbon is replaced by a notice and the beat rate still works', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('/beats-and-roughness');
  await expect(scene(page).getByText('This view needs 3D graphics, which this browser can’t show.')).toBeVisible();
  await gap(page).fill('2');
  await expect(beatRate(page)).toHaveText('2.00 Hz');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the ribbon sits in its box, showing a shorter time window', async ({ page }) => {
    await page.goto('/beats-and-roughness');
    await expect(scene(page).locator('canvas')).toBeVisible();
    await expect(scene(page).getByRole('button', { name: 'Reset view' })).toBeVisible();
    await expect(page.locator('.br-beats .br-caption')).toContainText('half second');
  });
});
