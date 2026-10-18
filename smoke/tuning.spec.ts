import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const tuningSystem = (page: Page) => page.getByLabel('Tuning system');
const tonic = (page: Page) => page.getByLabel('Tonic');
const key = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Keyboard' }).getByRole('button', { name, exact: true });
const mathPanel = async (page: Page) => {
  await page.getByRole('tab', { name: 'The math' }).click();
  return page.getByRole('tabpanel');
};

test('choosing a tuning system relabels the keys with its spellings and stores it in the URL', async ({
  page,
}) => {
  await page.goto('/sound-waves');
  await expect(tuningSystem(page)).toHaveValue('12-edo');
  // 12-EDO is an EDO: the Tonic makes no difference, so it is not offered.
  await expect(tonic(page)).toHaveCount(0);
  await expect(key(page, 'A♭4')).toHaveCount(1);

  await tuningSystem(page).selectOption({ label: '¼-comma meantone' });
  await expect(page).toHaveURL(/\/sound-waves\?tuning=meantone$/);
  await expect(key(page, 'G♯4')).toHaveCount(1);
  await expect(key(page, 'A♭4')).toHaveCount(0);
  await expect(key(page, 'G♯4').locator('.key-label')).toHaveText('G♯');
  await expect(tonic(page)).toHaveValue('0');

  await tuningSystem(page).selectOption({ label: 'Werckmeister III' });
  await expect(key(page, 'D♭4')).toHaveCount(1);
  await expect(key(page, 'A♭5')).toHaveCount(1);
});

test('the Tonic transposes the spellings and is stored in the URL', async ({ page }) => {
  await page.goto('/tuning-systems?tuning=pythagorean');
  await expect(key(page, 'B♭4')).toHaveCount(1);
  await tonic(page).selectOption({ label: 'D' });
  await expect(page).toHaveURL(/\/tuning-systems\?tuning=pythagorean&tonic=D$/);
  // Pythagorean on D runs F…A♯.
  await expect(key(page, 'A♯4')).toHaveCount(1);
  await expect(key(page, 'B♭4')).toHaveCount(0);
});

test('a shared URL restores the tuning system and Tonic, and carries them to other Labs', async ({
  page,
}) => {
  await page.goto('/chord-comparison?tuning=kirnberger-iii&tonic=E-flat');
  await expect(tuningSystem(page)).toHaveValue('kirnberger-iii');
  await expect(tonic(page)).toHaveValue('3');
  await page.getByRole('navigation', { name: 'Labs' }).getByRole('link', { name: 'EDO explorer' }).click();
  await expect(page).toHaveURL(/\/edo-explorer\?tuning=kirnberger-iii&tonic=E-flat$/);
  await expect(tuningSystem(page)).toHaveValue('kirnberger-iii');
});

test('an unknown tuning system in the URL falls back to 12-EDO', async ({ page }) => {
  await page.goto('/sound-waves?tuning=banana&tonic=H');
  await expect(tuningSystem(page)).toHaveValue('12-edo');
});

test('The math shows how a key is built: a ratio, or a comma fraction', async ({ page }) => {
  await page.goto('/sound-waves?tuning=meantone');
  await key(page, 'E4').click();
  let math = await mathPanel(page);
  await expect(math.getByRole('heading', { name: 'How E is built' })).toBeVisible();
  await expect(math).toContainText('5/4');
  await expect(math).toContainText('386.314');

  await page.getByRole('tab', { name: 'Controls' }).click();
  await key(page, 'D4').click();
  math = await mathPanel(page);
  await expect(math.getByRole('heading', { name: 'How D is built' })).toBeVisible();
  await expect(math).toContainText('syntonic comma');
  await expect(math).toContainText('193.157');
  // C4 in meantone on C sits 889.735¢ below A4 = 440 Hz.
  await page.getByRole('tab', { name: 'Controls' }).click();
  await key(page, 'C4').click();
  math = await mathPanel(page);
  await expect(math.locator('[data-step="result"]').last()).toContainText('263.18');
});

test('The math notes the Vallotti attribution when Vallotti is chosen', async ({ page }) => {
  await page.goto('/sound-waves?tuning=vallotti');
  await key(page, 'F4').click();
  const math = await mathPanel(page);
  await expect(math.getByRole('heading', { name: 'Which Vallotti?' })).toBeVisible();
  await expect(math).toContainText('syntonic comma');
});

test('the phone top bar shows the tuning system and Tonic', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tuning-systems?tuning=meantone&tonic=D');
  await expect(page.getByRole('banner')).toContainText('Meantone in D');
});
