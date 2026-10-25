import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineConfig, devices } from '@playwright/test';

function findInstalledChromium() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const msPlaywrightDir = path.join(localAppData, 'ms-playwright');
  if (fs.existsSync(msPlaywrightDir)) {
    try {
      const entries = fs.readdirSync(msPlaywrightDir);
      const chromiumDirs = entries
        .filter((e) => e.startsWith('chromium-'))
        .sort()
        .reverse();
      for (const dir of chromiumDirs) {
        const exe = path.join(msPlaywrightDir, dir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(exe)) return exe;
      }
    } catch {
      // Ignore
    }
  }
  return undefined;
}

const fallbackExecutablePath = findInstalledChromium();

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    ...(fallbackExecutablePath ? { launchOptions: { executablePath: fallbackExecutablePath } } : {})
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: 'npm run dev -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120000
  }
});
