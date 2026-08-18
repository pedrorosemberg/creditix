import { defineConfig } from "@playwright/test";

// Smoke tests contra um ambiente já implantado (dev ou prod) — não sobem um
// servidor local. BASE_URL vem do secret/variável DEV_BASE_URL ou
// PROD_BASE_URL do workflow que chama isso; sem BASE_URL definida, o job que
// roda `npx playwright test` nem é disparado (ver .github/workflows/test-suite.yml).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: "retain-on-failure",
  },
});
