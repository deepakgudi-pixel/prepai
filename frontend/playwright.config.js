import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "Tablet Chrome",
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
        isMobile: false,
      },
    },
    {
      name: "Desktop Chrome",
      use: {
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
      ? undefined
      : {
          command: "npm run dev",
          url: baseURL,
          reuseExistingServer: true,
          stdout: "ignore",
          stderr: "ignore",
          timeout: 120_000,
        },
});
