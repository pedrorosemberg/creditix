import { test, expect } from "@playwright/test";

/**
 * Smoke tests contra um ambiente já implantado (hmg ou prod), rodados depois
 * do deploy como parte do gate de promoção. Não usam credenciais — só
 * verificam que as páginas públicas carregam e que a proteção de rotas e os
 * cabeçalhos de segurança realmente chegam ao navegador em produção, não só
 * no código-fonte.
 */

test("página de login carrega com os campos esperados", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("página de cadastro carrega", async ({ page }) => {
  const response = await page.goto("/cadastro");
  expect(response?.status()).toBe(200);
});

test("rota autenticada redireciona para /login sem sessão", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
});

test("cabeçalhos de segurança estão presentes na resposta", async ({ page }) => {
  const response = await page.goto("/login");
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toBeTruthy();
});
