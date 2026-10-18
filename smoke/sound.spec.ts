import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const timbre = (page: Page) => page.getByLabel('Timbre', { exact: true });
const brightness = (page: Page) => page.getByLabel('Brightness');
const volume = (page: Page) => page.getByLabel('Volume');
const key = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Keyboard' }).getByRole('button', { name, exact: true });

test('the settings rail offers the five Timbre presets', async ({ page }) => {
  await page.goto('/sound-waves');
  await expect(timbre(page)).toHaveValue('sine');
  await expect(timbre(page).getByRole('option')).toHaveText([
    'Sine',
    'Organ-like',
    'String-like',
    'Brass-like',
    'Voice-like',
  ]);
});

test('brightness is hidden for Sine and shown for the other presets', async ({ page }) => {
  await page.goto('/sound-waves');
  await expect(brightness(page)).toHaveCount(0);
  await timbre(page).selectOption('organ');
  await expect(page).toHaveURL(/\?timbre=organ$/);
  await expect(brightness(page)).toHaveValue('0');
  await brightness(page).fill('0.5');
  await expect(page).toHaveURL(/\?timbre=organ&bright=0.5$/);
  await timbre(page).selectOption('sine');
  await expect(brightness(page)).toHaveCount(0);
});

test('volume is stored in the URL', async ({ page }) => {
  await page.goto('/sound-waves');
  await expect(volume(page)).toHaveValue('80');
  await volume(page).fill('40');
  await expect(page).toHaveURL(/\?vol=40$/);
});

test('a shared URL restores Timbre, brightness and volume, and carries them to other Labs', async ({
  page,
}) => {
  await page.goto('/tuning-systems?timbre=voice&bright=-0.3&vol=55');
  await expect(timbre(page)).toHaveValue('voice');
  await expect(brightness(page)).toHaveValue('-0.3');
  await expect(volume(page)).toHaveValue('55');
  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'EDO explorer' }).click();
  await expect(page).toHaveURL(/\/edo-explorer\?timbre=voice&bright=-0.3&vol=55$/);
});

test('invalid Timbre settings in the URL fall back to the defaults', async ({ page }) => {
  await page.goto('/sound-waves?timbre=kazoo&bright=7&vol=loud');
  await expect(timbre(page)).toHaveValue('sine');
  await expect(volume(page)).toHaveValue('80');
});

test('computer keys play the keyboard: H holds A4 until released', async ({ page }) => {
  await page.goto('/sound-waves');
  await expect(key(page, 'A4')).toHaveAttribute('aria-keyshortcuts', 'H');
  await page.keyboard.down('h');
  await expect(key(page, 'A4')).toHaveAttribute('data-held', 'true');
  await page.keyboard.up('h');
  await expect(key(page, 'A4')).not.toHaveAttribute('data-held', 'true');
  await page.getByRole('tab', { name: 'The math' }).click();
  await expect(page.getByRole('tabpanel').locator('[data-step="result"]')).toContainText('440.00');
});

test('computer keys don’t play while typing in a settings field', async ({ page }) => {
  await page.goto('/sound-waves?ref=437.5');
  await page.getByLabel('Custom Reference pitch in Hz').focus();
  await page.keyboard.press('h');
  await page.getByRole('tab', { name: 'The math' }).click();
  await expect(page.getByRole('tabpanel').getByRole('heading', { name: 'The note you played' })).toHaveCount(0);
});

test('changing Timbre while a note sounds crossfades to a new oscillator', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __oscillators: number;
      __waveSwaps: number;
      OscillatorNode: typeof OscillatorNode;
    };
    w.__oscillators = 0;
    w.__waveSwaps = 0;
    const Original = w.OscillatorNode;
    w.OscillatorNode = class extends Original {
      constructor(context: BaseAudioContext, options?: OscillatorOptions) {
        super(context, options);
        w.__oscillators += 1;
      }
      override setPeriodicWave(wave: PeriodicWave) {
        w.__waveSwaps += 1;
        super.setPeriodicWave(wave);
      }
    };
  });
  const counts = () =>
    page.evaluate(() => {
      const w = window as unknown as { __oscillators: number; __waveSwaps: number };
      return { oscillators: w.__oscillators, waveSwaps: w.__waveSwaps };
    });
  await page.goto('/sound-waves');
  await page.keyboard.down('h');
  expect(await counts()).toEqual({ oscillators: 1, waveSwaps: 0 });
  await timbre(page).selectOption('brass');
  await expect.poll(counts).toEqual({ oscillators: 2, waveSwaps: 0 });
  await page.keyboard.up('h');
});
