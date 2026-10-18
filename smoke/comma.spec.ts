import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const PATH = '/just-intonation-lattice';
const scene = (page: Page) => page.getByRole('group', { name: 'Lattice of pure ratios' });
const readout = (page: Page) => page.locator('.jl-pump-readout');
const drift = (page: Page) => page.locator('.jl-drift');
const mathSection = (page: Page, heading: string | RegExp) =>
  page.locator('.math-section').filter({ has: page.getByRole('heading', { name: heading }) });

test('the comma explorer steps the syntonic pump home 21.5¢ flat, then keeps going', async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole('radio', { name: 'Comma pump' }).check();
  await expect(page).toHaveURL(/pump=syntonic/);
  await expect(page.getByLabel('Progression')).toHaveValue('syntonic');
  await expect(readout(page)).toContainText('Chord 1 of 4 · C: C 1/1 · E 5/4 · G 3/2');
  await expect(drift(page)).toHaveText('Not home yet: step to the end of the loop.');
  await expect(page.getByLabel('Drone on 1/1')).not.toBeChecked();

  const next = page.getByRole('button', { name: 'Next chord' });
  await next.click();
  await expect(readout(page)).toContainText('Am:');
  await expect(readout(page)).toContainText('keeping C 1/1');
  for (let i = 0; i < 3; i++) await next.click();
  await expect(page).toHaveURL(/step=4/);
  await expect(readout(page)).toContainText('Home · C: C 160/81');
  await expect(drift(page)).toHaveText('After 1 loop: −21.5¢');
  await expect(scene(page).locator('canvas')).toBeVisible();

  for (let i = 0; i < 8; i++) await next.click();
  await expect(drift(page)).toHaveText('After 3 loops: −64.5¢');

  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page).not.toHaveURL(/step=/);
  await expect(drift(page)).toHaveText('Not home yet: step to the end of the loop.');
});

test('loops repeat until Reset: a hundred Pythagorean loops on, the drift and labels stay exact', async ({ page }) => {
  await page.goto(`${PATH}?pump=pythagorean&step=1200`);
  await expect(page).toHaveURL(/step=1200/);
  await expect(drift(page)).toHaveText('After 100 loops: +2346.0¢');
  await expect(readout(page)).toContainText('3¹²⁰⁰/2¹⁹⁰¹');
  await expect(page.getByRole('button', { name: 'Next chord' })).toBeEnabled();
  await page.getByRole('button', { name: 'Next chord' }).click();
  await expect(page).toHaveURL(/step=1201/);
  await expect(scene(page).locator('canvas')).toBeVisible();
});

test('a shared URL restores the pump; the septimal pump turns the lattice to ×7', async ({ page }) => {
  await page.goto(`${PATH}?pump=septimal&step=3`);
  await expect(page.getByLabel('Progression')).toHaveValue('septimal');
  await expect(drift(page)).toHaveText('After 1 loop: +27.3¢');
  await expect(page.getByRole('list', { name: 'Key' })).toContainText('×7 harmonic sevenths');
  await expect(page.getByRole('list', { name: 'Key' })).toContainText('Path of the roots');

  await page.getByRole('tab', { name: 'The math' }).click();
  const comma = mathSection(page, 'The comma');
  await expect(comma.locator('[data-step="substituted"]')).toContainText('64/63');
  await expect(comma.locator('[data-step="result"]')).toContainText('27.264');
  await expect(mathSection(page, 'The drift so far').locator('[data-step="result"]')).toContainText('27.264');
  await expect(mathSection(page, /^Keeping G/).locator('[data-step="result"]')).toContainText('64/63');
});

test('Play steps through to home and can be stopped; Build a chord turns the explorer off', async ({ page }) => {
  await page.goto(`${PATH}?pump=pythagorean`);
  await page.getByRole('button', { name: 'Play to home' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await expect(page).toHaveURL(/step=1/);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Play to home' })).toBeVisible();

  await page.getByRole('radio', { name: 'Build a chord' }).check();
  await expect(page).not.toHaveURL(/pump=/);
  await expect(page.locator('.jl-readout')).toContainText('4:5:6');
});
