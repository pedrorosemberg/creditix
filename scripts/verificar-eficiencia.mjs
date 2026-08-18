#!/usr/bin/env node
// Roda o Lighthouse (via CLI, headless Chrome) contra uma URL já implantada
// (hmg ou prod) e falha se a pontuação de performance cair abaixo do piso.
// Só é chamado quando BASE_URL está configurada (ver test-suite.yml) —
// medir performance real exige um ambiente vivo, não faz sentido contra
// localhost/preview efêmero.
//
// O piso de 0.5 é deliberadamente conservador: ainda não temos uma série
// histórica de execuções reais contra hmg/prod para calibrar um valor mais
// exigente sem risco de flakiness. Suba esse valor depois de observar
// algumas execuções reais na aba Actions.
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";

const BASE_URL = process.env.BASE_URL;
const PISO_PERFORMANCE = Number(process.env.LIGHTHOUSE_MIN_PERFORMANCE ?? "0.5");
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
