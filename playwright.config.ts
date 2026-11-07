import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 30000, fullyParallel: false, retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:4173', reducedMotion: 'reduce', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {} },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
    env: { VITE_CRM_API_BASE_URL: 'http://127.0.0.1:4173/api', VITE_IS_PRODUCTION: 'false', VITE_S3_FOLDER_DUMMY: 'browser-fixtures' } },
});
