import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const column = (page: Page, heading: string) =>
  page.locator('.cc-column').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
const notes = (page: Page, heading: string) => column(page, heading).getByRole('list').first();

/** Counts oscillators started, so a test can tell a chord was played. */
async function countOscillators(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __oscillators: number; OscillatorNode: typeof OscillatorNode };
    w.__oscillators = 0;
    const Original = w.OscillatorNode;
    w.OscillatorNode = class extends Original {
      constructor(context: BaseAudioContext, options?: OscillatorOptions) {
        super(context, options);
        w.__oscillators += 1;
      }
    };
  });
  return () => page.evaluate(() => (window as unknown as { __oscillators: number }).__oscillators);
}

test('compares C major in 12-EDO, meantone and just intonation beside the pure chord', async ({
  page,
}) => {
  await page.goto('/chord-comparison');
  await expect(page.locator('.cc-column-title')).toHaveText([
    'Pure chord',
    '12-EDO',
    '¼-comma meantone in C',
    '5-limit just intonation in C',
  ]);
  await expect(column(page, 'Pure chord')).toContainText('4:5:6');
  // Highest first: G4, E4 (+13.7¢ in 12-EDO), C4.
  await expect(notes(page, '12-EDO').getByRole('listitem').nth(1)).toContainText('E4');
  await expect(notes(page, '12-EDO').getByRole('listitem').nth(1)).toContainText('+13.7¢');
  await expect(notes(page, '¼-comma meantone in C').getByRole('listitem').nth(1)).toContainText('0.0¢');
  // A sine has nothing to beat, and the Lab says so.
  await expect(page.getByText(/A sine has no harmonics to beat/)).toBeVisible();
});

test('F♯ major in meantone on C shows the wolf third and the borrowed key', async ({ page }) => {
  await page.goto('/chord-comparison?root=F-sharp');
  const meantone = column(page, '¼-comma meantone in C');
  await expect(notes(page, '¼-comma meantone in C').getByRole('listitem').nth(1)).toContainText('+41.1¢');
  await expect(meantone).toContainText('Uses B♭ as A♯.');
});

test('beat rates follow the Timbre: the 12-EDO C4 major third beats at 10.38 Hz', async ({ page }) => {
  await page.goto('/chord-comparison?timbre=string');
  const edo = column(page, '12-EDO');
  await expect(edo.locator('.cc-beat').first()).toContainText('root–third');
  await expect(edo.locator('.cc-beat').first()).toContainText('10.38 Hz');
  await expect(column(page, 'Pure chord').locator('.cc-beat').first()).toContainText('no beats');
});

test('the chord controls write the URL; 7th chords get a 3rd inversion and dominants an alternative', async ({
  page,
}) => {
  await page.goto('/chord-comparison');
  await page.getByLabel('Root', { exact: true }).selectOption({ label: 'A♭' });
  await page.getByLabel('Chord', { exact: true }).selectOption('dominant-7th');
  await expect(page.getByLabel('Inversion', { exact: true }).getByRole('option')).toHaveCount(4);
  await page.getByLabel('Inversion', { exact: true }).selectOption({ label: '3rd inversion' });
  await page.getByLabel('Pure chord', { exact: true }).selectOption({ label: 'Harmonic 7th 4:5:6:7' });
  await expect(page).toHaveURL(/\?root=A-flat&chord=dominant-7th&inv=3&pure=alternative$/);
  await expect(page.getByRole('heading', { name: /A♭ dominant 7th/ })).toBeVisible();
  // Back to a triad: no 3rd inversion, no alternative.
  await page.getByLabel('Chord', { exact: true }).selectOption('major');
  await expect(page).toHaveURL(/\?root=A-flat$/);
  await expect(page.getByLabel('Pure chord', { exact: true })).toHaveCount(0);
});

test('up to four tuning systems; an N-EDO column notes where its mapping differs', async ({ page }) => {
  await page.goto('/chord-comparison?chord=minor');
  await page.getByRole('button', { name: 'Add a tuning system' }).click();
  await expect(page.locator('.cc-column')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Add a tuning system' })).toHaveCount(0);

  await page.getByLabel('Compared system 4').selectOption({ label: 'N-EDO' });
  await expect(page).toHaveURL(/compare=12-edo\.meantone\.just\.31-edo/);
  await page.getByLabel('Steps per octave, compared system 4').fill('17');
  await expect(column(page, '17-EDO')).toContainText(
    '17-EDO’s closest minor third (4 steps) doesn’t fit its fifth and major third.',
  );

  await page.getByRole('button', { name: 'Remove ¼-comma meantone' }).click();
  await expect(page).toHaveURL(/compare=12-edo\.just\.17-edo/);
  await expect(page.locator('.cc-column')).toHaveCount(4);
});

test('play buttons play one column, and play all in turn walks every column', async ({ page }) => {
  const oscillators = await countOscillators(page);
  await page.goto('/chord-comparison');
  await column(page, '12-EDO').getByRole('button', { name: 'Play 12-EDO' }).click();
  expect(await oscillators()).toBe(3);
  await expect(column(page, '12-EDO')).toHaveAttribute('data-playing', 'true');

  await page.getByRole('button', { name: 'Play all in turn' }).click();
  await expect(column(page, 'Pure chord')).toHaveAttribute('data-playing', 'true');
  await expect(column(page, '12-EDO')).toHaveAttribute('data-playing', 'true', { timeout: 5000 });
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('.cc-column[data-playing]')).toHaveCount(0);
});

test('The math works through the first column: pure target, cents off pure, beat rate', async ({
  page,
}) => {
  await page.goto('/chord-comparison?timbre=string');
  await page.getByRole('tab', { name: 'The math' }).click();
  const math = page.getByRole('tabpanel');
  const section = (heading: string) =>
    math.locator('.math-section').filter({ has: page.getByRole('heading', { name: heading }) });
  await expect(section('The pure chord').locator('[data-step="result"]')).toContainText('327.03');
  await expect(section('Cents off pure').locator('[data-step="result"]')).toContainText('13.686¢');
  await expect(section('Beat rate').locator('[data-step="result"]')).toContainText('10.38');
  await expect(math.getByText(/Plomp & W\. J\. M\. Levelt/)).toBeVisible();
});

test('chord buttons beside the keyboard play chords from the Tonic in every Lab', async ({ page }) => {
  const oscillators = await countOscillators(page);
  await page.goto('/sound-waves?tuning=meantone&tonic=D');
  const chords = page.getByRole('group', { name: 'Chords' }).getByRole('button');
  await expect(chords).toHaveText(['D', 'G', 'A', 'Bm', 'F♯', 'B♭']);
  await page.getByRole('button', { name: 'Play B minor' }).click();
  expect(await oscillators()).toBe(3);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('chord buttons are hidden; the columns scroll sideways', async ({ page }) => {
    await page.goto('/chord-comparison');
    await expect(page.getByRole('group', { name: 'Chords' })).toBeHidden();
    await expect(page.locator('.cc-column')).toHaveCount(4);
    await expect(column(page, 'Pure chord')).toBeVisible();
  });
});
