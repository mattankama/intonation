import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const tuningSystem = (page: Page) => page.getByLabel('Tuning system');
const steps = (page: Page) => page.getByLabel('Steps per octave');
const keyboard = (page: Page) => page.getByRole('group', { name: 'Keyboard' });
const keys = (page: Page) => keyboard(page).getByRole('button');
const key = (page: Page, name: string) => keyboard(page).getByRole('button', { name, exact: true });
const mathPanel = async (page: Page) => {
  await page.getByRole('tab', { name: 'The math' }).click();
  return page.getByRole('tabpanel');
};
/** A section of The math by its heading (a Lab adds sections of its own after the note's). */
const mathSection = (panel: ReturnType<Page['getByRole']>, heading: string) =>
  panel.locator('section', { has: panel.page().getByRole('heading', { name: heading }) });

test('choosing N-EDO offers N from 5 to 72 in place of the Tonic, and stores N in the URL', async ({
  page,
}) => {
  await page.goto('/sound-waves');
  await tuningSystem(page).selectOption({ label: 'N-EDO' });
  await expect(page).toHaveURL(/\/sound-waves\?tuning=31-edo$/);
  await expect(page.getByLabel('Tonic')).toHaveCount(0);
  await expect(steps(page)).toHaveValue('31');
  await expect(steps(page)).toHaveAttribute('min', '5');
  await expect(steps(page)).toHaveAttribute('max', '72');
  // Two octaves of 31 equal keys, named by step.
  await expect(keys(page)).toHaveCount(62);
  await expect(key(page, 'step 10 of 31, octave 4')).toHaveCount(1);

  await steps(page).fill('19');
  await expect(page).toHaveURL(/\?tuning=19-edo$/);
  await expect(keys(page)).toHaveCount(38);
  await expect(tuningSystem(page)).toHaveValue('n-edo');

  await tuningSystem(page).selectOption({ label: 'Pythagorean' });
  await expect(page).toHaveURL(/\?tuning=pythagorean$/);
  await expect(steps(page)).toHaveCount(0);
  await expect(key(page, 'C4')).toHaveCount(1);
});

test('keys show their cents, and landmarks mark the steps nearest the familiar notes', async ({
  page,
}) => {
  await page.goto('/sound-waves?tuning=31-edo');
  const e = key(page, 'step 10 of 31, octave 4');
  await expect(e).toHaveAccessibleDescription('387.1¢');
  await expect(e.locator('.key-landmark')).toHaveText('E');
  await expect(key(page, 'step 11 of 31, octave 4').locator('.key-landmark')).toHaveCount(0);
});

test('a step plays at its frequency, worked from A4 in The math', async ({ page }) => {
  await page.goto('/sound-waves?tuning=31-edo');
  await key(page, 'step 10 of 31, octave 4').click();
  let math = await mathPanel(page);
  await expect(math).toContainText('Step 10 of 31 sits s steps above step 0');
  await expect(
    mathSection(math, 'The note you played').locator('[data-step="result"]'),
  ).toContainText('387.097');

  await page.getByRole('tab', { name: 'Controls' }).click();
  await key(page, 'step 0 of 31, octave 4').click();
  math = await mathPanel(page);
  // Step 0 is 23 steps below A4 = 440 Hz: 440 · 2^(−23/31).
  await expect(math).toContainText('A4 is step 23 of 31');
  await expect(mathSection(math, 'Its frequency').locator('[data-step="result"]')).toContainText(
    '263.09',
  );
});

test('computer keys play consecutive steps, and ← → shift the range', async ({ page }) => {
  await page.goto('/sound-waves?tuning=31-edo');
  await expect(key(page, 'step 0 of 31, octave 4')).toHaveAttribute('aria-keyshortcuts', 'A');
  await expect(key(page, 'step 5 of 31, octave 4')).toHaveAttribute('aria-keyshortcuts', 'R');
  await page.keyboard.press('ArrowRight');
  await expect(key(page, 'step 1 of 31, octave 4')).toHaveAttribute('aria-keyshortcuts', 'A');
  await expect(key(page, 'step 0 of 31, octave 4')).not.toHaveAttribute('aria-keyshortcuts');
  await page.keyboard.down('r');
  await expect(key(page, 'step 6 of 31, octave 4')).toHaveAttribute('data-held', 'true');
  await page.keyboard.up('r');
  await expect(key(page, 'step 6 of 31, octave 4')).not.toHaveAttribute('data-held', 'true');
});

test('at N = 72 a whole octave is visible on desktop, and the keyboard scrolls on phones', async ({
  page,
}) => {
  await page.goto('/sound-waves?tuning=72-edo');
  await expect(key(page, 'step 0 of 72, octave 4')).toBeInViewport({ ratio: 1 });
  await expect(key(page, 'step 71 of 72, octave 4')).toBeInViewport({ ratio: 1 });

  await page.setViewportSize({ width: 390, height: 844 });
  const scrolls = await keyboard(page).evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrolls).toBe(true);
  await expect(page.getByRole('banner')).toContainText('72-EDO');
});
