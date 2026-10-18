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
