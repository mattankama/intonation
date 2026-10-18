import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const PATH = '/just-intonation-lattice';
const scene = (page: Page) => page.getByRole('group', { name: 'Lattice of pure ratios' });
const readout = (page: Page) => page.locator('.jl-readout');
const chordList = (page: Page) => page.getByRole('list', { name: 'Chord notes' });
const mathSection = (page: Page, heading: string | RegExp) =>
  page.locator('.math-section').filter({ has: page.getByRole('heading', { name: heading }) });

test('the lattice mounts flat with the major triad on the Tonic', async ({ page }) => {
  await page.goto(PATH);
  await expect(scene(page).locator('canvas')).toBeVisible();
  await expect(readout(page)).toContainText('C–E–G');
  await expect(readout(page)).toContainText('1/1 · 5/4 · 3/2');
  await expect(readout(page)).toContainText('4:5:6');
  await expect(page.getByRole('radio', { name: /5-limit/ })).toBeChecked();
});

test('a shared URL restores the chord; names follow the Tonic', async ({ page }) => {
  await page.goto(`${PATH}?chord=1/1,6/5,3/2&tonic=D`);
  await expect(readout(page)).toContainText('D–F–A');
  await expect(readout(page)).toContainText('10:12:15');
  await expect(chordList(page).getByRole('listitem')).toHaveText([/D 1\/1/, /F 6\/5/, /A 3\/2/]);
});

test('turning to 7-limit reveals ×7, and the harmonic seventh joins the chord', async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole('radio', { name: /7-limit/ }).check();
  await expect(page).toHaveURL(/limit=7/);
  await page.getByLabel('Add a note').selectOption({ label: 'B♭ 7/4' });
  await expect(page).toHaveURL(/chord=1%2F1%2C5%2F4%2C3%2F2%2C7%2F4/);
  await expect(readout(page)).toContainText('4:5:6:7');

  // Back to 5-limit drops the ×7 note.
  await page.getByRole('radio', { name: /5-limit/ }).check();
  await expect(readout(page)).toContainText('4:5:6');
  await expect(page).not.toHaveURL(/limit=7/);
});

test('notes are removed one by one or cleared', async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole('button', { name: 'Remove E 5/4' }).click();
  await expect(page).toHaveURL(/chord=1%2F1%2C3%2F2$/);
  await expect(readout(page)).toContainText('C–G');
  await page.getByRole('button', { name: 'Clear chord' }).click();
  await expect(page).toHaveURL(/chord=$/);
  await expect(chordList(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Play chord' })).toBeDisabled();
});

test('The math shows the prime factors of the last note added', async ({ page }) => {
  await page.goto(`${PATH}?chord=1/1,15/8`);
  await page.getByRole('tab', { name: 'The math' }).click();
  const factors = mathSection(page, 'Prime factors of 15/8');
  await expect(factors.locator('[data-step="substituted"]')).toContainText('15/8');
  await expect(factors.locator('[data-step="result"]')).toContainText('(1,1,0)');
  await expect(mathSection(page, 'The chord in whole numbers').locator('[data-step="result"]')).toContainText(
    '8:15',
  );
});

test('clicking a node on the lattice takes it out of the chord', async ({ page }) => {
  await page.goto(PATH);
  const canvas = scene(page).locator('canvas');
  await expect(canvas).toBeVisible();
  // The Tonic 1/1 sits at the scene origin, just below the centre of the desktop view.
  const box = (await canvas.boundingBox())!;
  const unitsTall = 2 * 13 * Math.tan((20 * Math.PI) / 180);
  const pxPerUnit = box.height / unitsTall;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 + 0.3 * pxPerUnit);
  await expect(page).toHaveURL(/chord=5%2F4%2C3%2F2$/);
});

test('without 3D graphics the lattice gives way to a notice and Controls still work', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto(PATH);
  await expect(page.getByText('This view needs 3D graphics, which this browser can’t show.')).toBeVisible();
  await page.getByLabel('Add a note').selectOption({ label: 'B 15/8' });
  await expect(readout(page)).toContainText('8:10:12:15');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the smaller lattice sits in its box with a Reset view button', async ({ page }) => {
    await page.goto(PATH);
    await expect(scene(page).locator('canvas')).toBeVisible();
    await expect(scene(page).getByRole('button', { name: 'Reset view' })).toBeVisible();
    // Essential labels only: ratios on the Tonic's major triad (here also the chord).
    await expect(scene(page).locator('.scene3d-label').filter({ hasText: /\d\/\d/ })).toHaveCount(3);
  });
});
