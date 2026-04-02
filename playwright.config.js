// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  webServer: {
    command: 'node ./src/back/index.js', // directo a node, sin pasar por npm
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe', // muestra logs del servidor en caso de error
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'off',
    actionTimeout: 15000,    // timeout para cada acción (click, fill...)
    navigationTimeout: 15000, // timeout para navegación
  },

  projects: [
    {
      name: 'chromium', // solo chromium en CI para ir más rápido
      use: { ...devices['Desktop Chrome'] },
    },
    // firefox y webkit comentados para CI - descomentar solo en local
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});