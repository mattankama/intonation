import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const scene = (page: Page) => page.getByRole('group', { name: 'Pitch spiral' });
const table = (page: Page, system: string) => page.getByRole('table', { name: system, exact: true });
const noteButton = (page: Page, system: string, note: string) =>
  table(page, system).getByRole('button', { name: note, exact: true });
const legend = (page: Page) => page.getByRole('list', { name: 'Systems compared' });

test('the pitch spiral mounts with the four default systems and their tables', async ({ page }) => {
  await page.goto('/tuning-systems');
  await expect(scene(page).locator('canvas')).toBeVisible();
  await expect(legend(page).getByRole('listitem')).toHaveText([
    '12-EDO',
    '¼-comma meantone',
    'Pythagorean',
    '5-limit just intonation',
  ]);
  await expect(table(page, 'Pythagorean').getByRole('row')).toHaveCount(13);
  const fSharp = table(page, 'Pythagorean').getByRole('row').filter({ hasText: 'F♯' });
  await expect(fSharp).toContainText('611.7¢');
  await expect(fSharp).toContainText('729/512');
  await expect(fSharp).toContainText('+11.7¢');
});

test('the tables sit in the inspector’s Controls tab; the spiral stays in the centre', async ({ page }) => {
  await page.goto('/tuning-systems');
  const controls = page.getByRole('tabpanel', { name: 'Controls' });
  await expect(controls.getByRole('table', { name: 'Pythagorean', exact: true })).toBeVisible();
  await expect(page.locator('.lab-visual').getByRole('table')).toHaveCount(0);
  await expect(page.locator('.lab-visual').getByRole('group', { name: 'Pitch spiral' })).toBeVisible();
  // Data colours mark the spiral's legend and the tables' captions, never a control.
  await expect(controls.locator('.field .ts-swatch')).toHaveCount(0);
});

test('a shared URL restores the compared systems, N-EDOs included', async ({ page }) => {
  await page.goto('/tuning-systems?systems=31-edo,just');
  await expect(legend(page).getByRole('listitem')).toHaveText(['31-EDO', '5-limit just intonation']);
  await expect(table(page, '31-EDO').getByRole('row')).toHaveCount(32);
  await expect(table(page, '31-EDO').getByRole('row').filter({ hasText: 'step 10 of 31' })).toContainText(
    '387.1¢',
  );
});

test('systems are added, changed and removed in Controls and stored in the URL', async ({ page }) => {
  await page.goto('/tuning-systems?systems=12-edo');
  await page.getByRole('button', { name: 'Add a tuning system' }).click();
  await expect(page).toHaveURL(/systems=12-edo%2C/);
  await page.getByLabel('System 2', { exact: true }).selectOption({ label: 'Vallotti' });
  await expect(page).toHaveURL(/\/tuning-systems\?systems=12-edo%2Cvallotti$/);
  await expect(table(page, 'Vallotti')).toBeVisible();

  await page.getByLabel('System 2', { exact: true }).selectOption({ label: 'N-EDO' });
  await expect(page).toHaveURL(/systems=12-edo%2C31-edo$/);
  await page.getByLabel('Steps per octave, system 2').fill('19');
  await expect(page).toHaveURL(/systems=12-edo%2C19-edo$/);

  await page.getByRole('button', { name: 'Remove 12-EDO' }).click();
  await expect(page).toHaveURL(/systems=19-edo$/);
  await expect(page.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
});

test('two notes make an interval measured against its pure target', async ({ page }) => {
  await page.goto('/tuning-systems');
  await noteButton(page, '12-EDO', 'C').click();
  await expect(noteButton(page, '12-EDO', 'C')).toHaveAttribute('aria-pressed', 'true');
  await noteButton(page, '12-EDO', 'E').click();
  const readout = page.locator('.ts-readout');
  await expect(readout).toContainText('400.0¢');
  await expect(readout).toContainText('5/4');
  await expect(readout).toContainText('13.7¢ wide');

  await noteButton(page, '¼-comma meantone', 'E').click();
  await expect(noteButton(page, '12-EDO', 'C')).toHaveAttribute('aria-pressed', 'false');
});

test('the Tonic can be changed here even when the shared tuning system is an EDO', async ({ page }) => {
  await page.goto('/tuning-systems');
  await page.getByLabel('Tonic').selectOption({ label: 'D' });
  await expect(page).toHaveURL(/tonic=D$/);
  await expect(table(page, 'Pythagorean').getByRole('row').nth(1)).toContainText('D');
});

test('without 3D graphics the spiral is replaced by a notice and the tables still work', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('/tuning-systems');
  await expect(page.getByText('This view needs 3D graphics, which this browser can’t show.')).toBeVisible();
  await expect(scene(page).locator('canvas')).toHaveCount(0);
  await expect(table(page, '12-EDO').getByRole('row')).toHaveCount(13);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the scene sits in its box with a Reset view button', async ({ page }) => {
    await page.goto('/tuning-systems');
    await expect(scene(page).locator('canvas')).toBeVisible();
    await expect(scene(page).getByRole('button', { name: 'Reset view' })).toBeVisible();
  });
});
