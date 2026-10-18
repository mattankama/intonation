import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const referencePitch = (page: Page) => page.getByLabel('Reference pitch (A4)');
const key = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Keyboard' }).getByRole('button', { name, exact: true });
const mathPanel = async (page: Page) => {
  await page.getByRole('tab', { name: 'The math' }).click();
  return page.getByRole('tabpanel');
};

test('playing a key shows its 12-EDO frequency worked out in The math', async ({ page }) => {
  await page.goto('/sound-waves');
  await key(page, 'C5').click();
  const math = await mathPanel(page);
  await expect(math.getByRole('heading', { name: 'The note you played' })).toBeVisible();
  await expect(math.locator('[data-step="substituted"]')).toContainText('440.00');
  await expect(math.locator('[data-step="result"]')).toContainText('523.25');
  await expect(math.locator('.math-live').first()).toBeVisible();
  await expect(math.getByRole('heading', { name: 'Sources' })).toBeVisible();
});

test('a shared URL restores the Reference pitch', async ({ page }) => {
  await page.goto('/tuning-systems?ref=415');
  await expect(referencePitch(page)).toHaveValue('415');
  await key(page, 'A4').click();
  const math = await mathPanel(page);
  await expect(math.locator('[data-step="result"]')).toContainText('415.00');
});

test('a shared URL restores a custom Reference pitch', async ({ page }) => {
  await page.goto('/edo-explorer?ref=437.5');
  await expect(referencePitch(page)).toHaveValue('custom');
  await expect(page.getByLabel('Custom Reference pitch in Hz')).toHaveValue('437.5');
});

test('an invalid Reference pitch in the URL falls back to 440 Hz', async ({ page }) => {
  await page.goto('/sound-waves?ref=banana');
  await expect(referencePitch(page)).toHaveValue('440');
});

test('changing the Reference pitch updates the URL and carries over to other Labs', async ({
  page,
}) => {
  await page.goto('/sound-waves');
  await referencePitch(page).selectOption('442');
  await expect(page).toHaveURL(/\/sound-waves\?ref=442$/);
  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'EDO explorer' }).click();
  await expect(page).toHaveURL(/\/edo-explorer\?ref=442$/);
  await expect(referencePitch(page)).toHaveValue('442');
});

test('back and forward move between pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Sound waves/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sound waves');
  await page
    .getByRole('navigation', { name: 'Labs' })
    .getByRole('link', { name: 'Chord comparison' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chord comparison');

  await page.goBack();
  await expect(page).toHaveURL(/\/sound-waves$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sound waves');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(6);
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sound waves');
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chord comparison');
});

test('the wordmark leads home', async ({ page }) => {
  await page.goto('/tuning-systems?ref=432');
  await page.getByRole('link', { name: 'Intonation' }).first().click();
  await expect(page).toHaveURL(/\/\?ref=432$/);
});

test('audio starts only after a user gesture', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __audioContexts: number; AudioContext: typeof AudioContext };
    w.__audioContexts = 0;
    const Original = w.AudioContext;
    w.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        w.__audioContexts += 1;
      }
    };
  });
  const contexts = () => page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts);
  await page.goto('/sound-waves');
  await page.getByRole('tab', { name: 'The math' }).click();
  expect(await contexts()).toBe(0);
  await key(page, 'A4').click();
  expect(await contexts()).toBe(1);
});
