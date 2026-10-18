import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const timbre = (page: Page) => page.getByLabel('Timbre', { exact: true });
const brightness = (page: Page) => page.getByLabel('Brightness');
const harmonic = (page: Page, n: number) => page.getByLabel(`Harmonic ${n} level`);
const mute = (page: Page, n: number) => page.getByRole('switch', { name: `Mute harmonic ${n}` });
const waveform = (page: Page) => page.getByRole('img', { name: /Waveform/ });
const mathPanel = async (page: Page) => {
  await page.getByRole('tab', { name: 'The math' }).click();
  return page.getByRole('tabpanel');
};

// Organ-like, levels 100 80 60 50 0 40 0 30 0…, harmonic 2 muted.
const ORGAN_CUSTOM = 'custom.organ.64503c320028001e0000000000000000.0002';

test('a shared URL with a Custom Timbre restores it, and carries it to other Labs', async ({
  page,
}) => {
  await page.goto(`/sound-waves?timbre=${ORGAN_CUSTOM}`);
  await expect(timbre(page)).toHaveValue('custom');
  await expect(timbre(page).locator('option:checked')).toHaveText('Custom (from organ-like)');
  await expect(brightness(page)).toHaveCount(0);
  await expect(harmonic(page, 1)).toHaveValue('100');
  await expect(harmonic(page, 2)).toHaveValue('80');
  await expect(mute(page, 2)).toBeChecked();
  await expect(mute(page, 3)).not.toBeChecked();

  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'Tuning systems' }).click();
  await expect(page).toHaveURL(new RegExp(`/tuning-systems\\?timbre=${ORGAN_CUSTOM.replaceAll('.', '\\.')}$`));
  await expect(timbre(page)).toHaveValue('custom');
  await expect(brightness(page)).toHaveCount(0);
});

test('editing a harmonic turns the preset into the Custom Timbre; Reset to preset restores it', async ({
  page,
}) => {
  await page.goto('/sound-waves?timbre=organ&bright=0.5');
  await expect(page.getByRole('button', { name: 'Reset to preset' })).toHaveCount(0);
  const before = await waveform(page).locator('path').getAttribute('d');

  await harmonic(page, 3).fill('20');
  await expect(page).toHaveURL(/timbre=custom\.organ\.[0-9a-f]{32}\.0000/);
  await expect(timbre(page).locator('option:checked')).toHaveText('Custom (from organ-like)');
  await expect(brightness(page)).toHaveCount(0);
  await expect(harmonic(page, 3)).toHaveValue('20');
  await expect(waveform(page).locator('path')).not.toHaveAttribute('d', before!);

  // Muting keeps the level, so unmuting restores it.
  await mute(page, 3).click();
  await expect(page).toHaveURL(/\.0004(&|$)/);
  await expect(harmonic(page, 3)).toHaveValue('20');
  await mute(page, 3).click();
  await expect(page).toHaveURL(/\.0000(&|$)/);

  await page.getByRole('button', { name: 'Reset to preset' }).click();
  await expect(page).toHaveURL(/\/sound-waves\?timbre=organ&bright=0.5$/);
  await expect(timbre(page)).toHaveValue('organ');
  await expect(brightness(page)).toHaveValue('0.5');
});

test('the Custom Timbre stays selectable after switching to a preset in another Lab', async ({
  page,
}) => {
  await page.goto(`/sound-waves?timbre=${ORGAN_CUSTOM}`);
  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'EDO explorer' }).click();
  await timbre(page).selectOption('brass');
  await expect(page).toHaveURL(/\/edo-explorer\?timbre=brass$/);
  await timbre(page).selectOption({ label: 'Custom (from organ-like)' });
  await expect(page).toHaveURL(new RegExp(`\\?timbre=${ORGAN_CUSTOM.replaceAll('.', '\\.')}$`));
});

test('The math shows the Fourier sum for the current harmonics and notes phase', async ({ page }) => {
  await page.goto(`/sound-waves?timbre=${ORGAN_CUSTOM}`);
  const math = await mathPanel(page);
  await expect(math.getByRole('heading', { name: 'The Fourier sum' })).toBeVisible();
  const sum = math.locator('[data-step="substituted"]').first();
  // Harmonic 1 at 1.00, harmonic 2 muted (left out), harmonic 3 at 0.60.
  await expect(sum).toContainText('1.00');
  await expect(sum).toContainText('0.60');
  await expect(sum).not.toContainText('0.80');
  await expect(math.getByRole('heading', { name: 'Phase' })).toBeVisible();
  await expect(math).toContainText('not what you hear');
});
