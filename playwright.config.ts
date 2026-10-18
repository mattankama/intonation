import { defineConfig, devices } from '@playwright/test';
import { createHash } from 'node:crypto';

// Several checkouts (git worktrees) may run smoke tests at once, so each gets its own
// port derived from its path. Override with SMOKE_PORT.
const derivedPort =
  41000 + (createHash('sha1').update(process.cwd()).digest().readUInt16BE(0) % 2000);
const port = Number(process.env.SMOKE_PORT ?? derivedPort);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
