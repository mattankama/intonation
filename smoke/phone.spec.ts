import { LABS, expect, test } from './fixtures';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('phone layout: top bar with chips and a menu holding the Labs and settings', async ({
  page,
}) => {
  await page.goto('/tuning-systems?ref=415');
  const bar = page.getByRole('banner');
  await expect(bar).toContainText('12-EDO');
  await expect(bar).toContainText('A4 415 Hz');
  // The rail's Lab list is hidden until the menu opens.
  await expect(page.getByRole('navigation', { name: 'Labs' })).toBeHidden();

  const menu = page.getByRole('button', { name: 'Open menu' });
  await menu.click();
  const labs = page.getByRole('navigation', { name: 'Labs' }).getByRole('link');
  await expect(labs).toHaveText(LABS.map((l) => l.title));
  await expect(page.getByLabel('Reference pitch (A4)')).toHaveValue('415');

  await labs.filter({ hasText: 'Sound waves' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sound waves');
  await expect(page.getByRole('navigation', { name: 'Labs' })).toBeHidden();

  // Visual, tabs and a one-octave keyboard.
  await expect(page.getByRole('tab', { name: 'The math' })).toBeVisible();
  const keys = page.getByRole('group', { name: 'Keyboard' }).getByRole('button');
  await expect(keys.filter({ visible: true })).toHaveCount(12);
});

test('phone home page stacks the six Lab cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(6);
});
