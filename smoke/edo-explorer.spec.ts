import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const circle = (page: Page) => page.getByRole('img', { name: /^Circle of \d+ steps/ });
const nearestTable = (page: Page) => page.getByRole('table', { name: /Nearest steps/ });
const row = (page: Page, ratio: string) =>
  nearestTable(page).getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(`^${ratio}`) }) });

const nControl = (page: Page) => page.getByLabel('Equal divisions, N', { exact: true });
const keys = (page: Page) => page.getByRole('group', { name: 'Keyboard' }).getByRole('button');

test('N from 5 to 72 sets the tuning system, is stored in the URL, and the keyboard plays it', async ({
  page,
}) => {
  await page.goto('/edo-explorer');
  await expect(nControl(page)).toHaveValue('12');
  await expect(nControl(page)).toHaveAttribute('min', '5');
  await expect(nControl(page)).toHaveAttribute('max', '72');

  await nControl(page).fill('22');
  await expect(page).toHaveURL(/\/edo-explorer\?tuning=22-edo$/);
  await expect(circle(page)).toHaveAccessibleName(/^Circle of 22 steps/);
  await expect(keys(page)).toHaveCount(44);

  await page.getByRole('button', { name: '53-EDO', exact: true }).click();
  await expect(page).toHaveURL(/\?tuning=53-edo$/);
  await expect(page.getByRole('button', { name: '53-EDO', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // A shared link restores N.
  await page.reload();
  await expect(nControl(page)).toHaveValue('53');
  await expect(row(page, '3/2')).toContainText('−0.068¢');
});

test('with a 12-note tuning system the explorer shows 12-EDO and says what the keyboard plays', async ({
  page,
}) => {
  await page.goto('/edo-explorer?tuning=meantone');
  await expect(page.getByText(/The keyboard plays ¼-comma meantone/)).toBeVisible();
  await expect(circle(page)).toHaveAccessibleName(/^Circle of 12 steps/);
  await page.getByRole('button', { name: '19-EDO', exact: true }).click();
  await expect(page).toHaveURL(/\?tuning=19-edo$/);
  await expect(page.getByText(/The keyboard plays/)).toHaveCount(0);
});

test('the error chart covers every N, labels the 12, 19, 31 and 53 dips, and a click explores that N', async ({
  page,
}) => {
  await page.goto('/edo-explorer?tuning=19-edo');
  const chart = page.getByRole('img', { name: /^Error chart/ });
  await expect(chart.locator('.edo-bar')).toHaveCount(68);
  await expect(chart.locator('.edo-bar[data-standout]')).toHaveCount(4);
  await expect(chart.locator('.edo-standout-label')).toHaveText(['12', '19', '31', '53']);
  await expect(chart.locator('.edo-bar[data-selected]')).toHaveAttribute('data-n', '19');

  await chart.locator('.edo-bar-hit[data-n="31"]').click();
  await expect(page).toHaveURL(/\?tuning=31-edo$/);
  await expect(chart.locator('.edo-bar[data-selected]')).toHaveAttribute('data-n', '31');
});

/** Counts oscillators started, so a test can tell something was played. */
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

test('plays the scale and chords built from the EDO mapping', async ({ page }) => {
  const oscillators = await countOscillators(page);
  await page.goto('/edo-explorer?tuning=31-edo');
  const chords = page.getByRole('list', { name: /Chords on step 0/ });
  await expect(chords.getByRole('button', { name: 'Play Major (steps 0 · 10 · 18)' })).toBeVisible();
  await expect(chords.getByRole('button', { name: 'Play Minor (steps 0 · 8 · 18)' })).toBeVisible();
  await expect(chords.getByRole('button', { name: 'Play Harmonic 7th (steps 0 · 10 · 18 · 25)' })).toBeVisible();

  await chords.getByRole('button', { name: /^Play Major \(/ }).click();
  await expect.poll(oscillators).toBe(3);

  await page.getByRole('button', { name: 'Play the scale (31 steps)' }).click();
  await expect.poll(oscillators).toBeGreaterThan(3);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Play the scale (31 steps)' })).toBeVisible();
});

test('a chord whose mapped step isn’t the nearest step says so', async ({ page }) => {
  await page.goto('/edo-explorer?tuning=17-edo');
  const chords = page.getByRole('list', { name: /Chords on step 0/ });
  await expect(chords.getByRole('listitem').filter({ has: page.getByRole('button', { name: /^Play Minor \(/ }) })).toContainText(
    '17-EDO’s closest minor third (4 steps) doesn’t fit its fifth and major third.',
  );
});

test('The math works the fifth’s nearest step and error, the chart’s measure and the mapping', async ({
  page,
}) => {
  await page.goto('/edo-explorer?tuning=31-edo');
  await page.getByRole('tab', { name: 'The math' }).click();
  const math = page.getByRole('tabpanel');
  const result = (heading: string) =>
    math
      .locator('section', { has: page.getByRole('heading', { name: heading, exact: true }) })
      .locator('[data-step="result"]');
  // round(31 · log₂ 3/2) = round(18.135) = 18 steps.
  await expect(result('The nearest step')).toContainText('18');
  await expect(result('Its error')).toContainText('−5.181¢');
  // 31-EDO's worst 5-limit error is its minor third, 5.964¢ narrow.
  await expect(result('The error chart')).toContainText('5.964¢');
  // Mapped minor third = 18 − 10 = 8 steps.
  await expect(result('Chords use the EDO mapping')).toContainText('8');
  await expect(math).toContainText('Mandelbaum');
});

test('31-EDO: a circle of 31 steps marks each pure interval at its nearest step, with exact errors', async ({
  page,
}) => {
  await page.goto('/edo-explorer?tuning=31-edo');
  await expect(circle(page)).toHaveAccessibleName(/^Circle of 31 steps/);
  await expect(circle(page).locator('.edo-step')).toHaveCount(31);
  await expect(circle(page).locator('.edo-mark')).toHaveCount(5);
  await expect(circle(page).locator('.edo-mark-label')).toHaveText([
    '3/2 −5.2¢',
    '5/4 +0.8¢',
    '6/5 −6.0¢',
    '7/4 −1.1¢',
    '11/8 −9.4¢',
  ]);
  await expect(row(page, '3/2')).toContainText('18');
  await expect(row(page, '3/2')).toContainText('696.774¢');
  await expect(row(page, '3/2')).toContainText('−5.181¢');
  await expect(row(page, '5/4')).toContainText('+0.783¢');
  await expect(row(page, '11/8')).toContainText('−9.382¢');
});
