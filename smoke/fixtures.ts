import { test as base, expect } from '@playwright/test';

/** The six Labs in their fixed order (home page and left rail). */
export const LABS = [
  { path: '/sound-waves', title: 'Sound waves' },
  { path: '/beats-and-roughness', title: 'Beats & roughness' },
  { path: '/tuning-systems', title: 'Tuning systems' },
  { path: '/chord-comparison', title: 'Chord comparison' },
  { path: '/just-intonation-lattice', title: 'Just-intonation lattice' },
  { path: '/edo-explorer', title: 'EDO explorer' },
] as const;

/**
 * Every test fails if the page throws or logs a console error.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
      });
      await use(errors);
      expect(errors, 'the page logged errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
