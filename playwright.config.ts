import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173/Abraham/',
      reuseExistingServer: true,
    },
    {
      // versão publicada (com service worker) para o teste offline
      command: 'npx vite build && npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173/Abraham/',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
