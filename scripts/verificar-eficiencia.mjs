#!/usr/bin/env node
// Roda o Lighthouse (via CLI, headless Chrome) contra uma URL já implantada
// (hmg ou prod) e falha se a pontuação de performance cair abaixo do piso.
// Só é chamado quando BASE_URL está configurada (ver test-suite.yml) —
// medir performance real exige um ambiente vivo, não faz sentido contra
// localhost/preview efêmero.
//
// Piso calibrado a partir da primeira execução real contra
// creditix-dev.metadax.com.br (Lighthouse headless em runner do GitHub
// Actions, contra um preview do Vercel atrás do Cloudflare): pontuação de
// performance 0.39. 0.3 dá margem sem deixar de pegar uma regressão grande
// — suba esse valor conforme mais execuções reais acumularem histórico na
// aba Actions.
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";

const BASE_URL = process.env.BASE_URL;
const PISO_PERFORMANCE = Number(process.env.LIGHTHOUSE_MIN_PERFORMANCE ?? "0.3");
const RELATORIO = "./lighthouse-report.json";

if (!BASE_URL) {
  console.log("[verificar-eficiencia] BASE_URL não configurada — pulando (ver test-suite.yml).");
  process.exit(0);
}

const url = `${BASE_URL.replace(/\/$/, "")}/login`;

console.log(`[verificar-eficiencia] Rodando Lighthouse contra ${url}...`);
execFileSync(
  "npx",
  [
    "lighthouse",
    url,
    "--output=json",
    `--output-path=${RELATORIO}`,
    "--only-categories=performance",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
    "--quiet",
  ],
  { stdio: "inherit" },
);

const relatorio = JSON.parse(readFileSync(RELATORIO, "utf8"));
const score = relatorio.categories?.performance?.score;
unlinkSync(RELATORIO);

if (score === undefined || score === null) {
  console.error("[verificar-eficiencia] FALHA: Lighthouse não retornou uma pontuação de performance.");
  process.exit(1);
}

console.log(`[verificar-eficiencia] Pontuação de performance: ${score} (piso: ${PISO_PERFORMANCE})`);
if (score < PISO_PERFORMANCE) {
  console.error(`[verificar-eficiencia] FALHA: performance ${score} abaixo do piso ${PISO_PERFORMANCE}.`);
  process.exit(1);
}

console.log("[verificar-eficiencia] OK.");
