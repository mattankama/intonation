import { LABS, expect, test } from './fixtures';

test('home page lists the six Labs in order, each card linking to its Lab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const cards = page.getByRole('main').getByRole('link');
  await expect(cards).toHaveCount(LABS.length);
  for (const [i, lab] of LABS.entries()) {
    const card = cards.nth(i);
    await expect(card.getByRole('heading')).toHaveText(lab.title);
    await expect(card).toHaveAttribute('href', lab.path);
  }
});

test('every Lab card shows a flat SVG preview, and the home page loads no 3D', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  const cards = page.getByRole('main').getByRole('link');
  await expect(cards).toHaveCount(LABS.length);
  for (const [i, lab] of LABS.entries()) {
    const preview = cards.nth(i).locator('.lab-card-preview');
    await expect(preview, lab.title).toBeVisible();
    await expect(preview).toHaveAttribute('data-lab', lab.path.slice(1));
    expect(await preview.locator('path, line, circle, rect, polygon').count(), lab.title).toBeGreaterThan(5);
    // 16:10.
    const box = (await preview.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1.6, 1);
  }
  await page.waitForLoadState('networkidle');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(requests.filter((url) => /three|fiber/i.test(url))).toEqual([]);
});

test('Lab cards sit 3 across on desktop, 2 on tablets and 1 on phones, with a tonal hover', async ({ page }) => {
  const across = async () => {
    const tops = await page
      .locator('.lab-card')
      .evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().top)));
    return tops.filter((top) => top === tops[0]).length;
  };
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  expect(await across()).toBe(3);
  const card = page.locator('.lab-card').first();
  const style = () =>
    card.evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, shadow: s.boxShadow, radius: s.borderRadius };
    });
  const resting = await style();
  expect(resting.radius).toBe('15px');
  await card.hover();
  const hovered = await style();
  expect(hovered.background).not.toBe(resting.background);
  expect(hovered.shadow).toBe('none');
  await page.setViewportSize({ width: 800, height: 900 });
  expect(await across()).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await across()).toBe(1);
});

for (const lab of LABS) {
  test(`${lab.title} loads with its intro, the inspector tabs and the keyboard`, async ({ page }) => {
    await page.goto(lab.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(lab.title);
    await expect(page.getByRole('main').getByRole('paragraph').first()).not.toBeEmpty();
    await expect(page).toHaveTitle(`${lab.title} · Intonation`);
    const labs = page.getByRole('navigation', { name: 'Labs' }).getByRole('link');
    await expect(labs).toHaveText(LABS.map((l) => l.title));
    await expect(labs.filter({ hasText: lab.title })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('tab', { name: 'Controls' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'The math' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Play a note');
    const keys = page.getByRole('group', { name: 'Keyboard' }).getByRole('button');
    await expect(keys).toHaveCount(24);
  });
}
