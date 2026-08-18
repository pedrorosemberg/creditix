#!/usr/bin/env node
// Checagem "cloud": o deploy do ambiente de destino (dev ou prod) está de
// fato no ar, servindo HTTPS corretamente e respondendo dentro de um tempo
// razoável. É deliberadamente simples (sem token de API de nenhum provedor)
// para funcionar tanto com Vercel quanto com o stack self-hosted em
// docker/ — qualquer ambiente que sirva HTTP(S) passa por aqui. Só roda
// quando BASE_URL está configurada (ver test-suite.yml).
const BASE_URL = process.env.BASE_URL;
const LIMITE_MS = Number(process.env.SAUDE_DEPLOY_LIMITE_MS ?? "3000");

if (!BASE_URL) {
  console.log("[verificar-saude-deploy] BASE_URL não configurada — pulando (ver test-suite.yml).");
  process.exit(0);
}

async function main() {
  const inicio = Date.now();
  let resposta;
  try {
    resposta = await fetch(`${BASE_URL.replace(/\/$/, "")}/login`, { redirect: "manual" });
  } catch (err) {
    console.error(`[verificar-saude-deploy] FALHA: não conseguiu conectar a ${BASE_URL}: ${err.message}`);
    process.exit(1);
  }
  const duracaoMs = Date.now() - inicio;

  if (resposta.status >= 400) {
    console.error(`[verificar-saude-deploy] FALHA: ${BASE_URL}/login respondeu ${resposta.status}.`);
    process.exit(1);
  }

  if (BASE_URL.startsWith("https://") && !resposta.headers.get("strict-transport-security")) {
    console.error("[verificar-saude-deploy] FALHA: resposta HTTPS sem cabeçalho Strict-Transport-Security.");
    process.exit(1);
  }

  if (duracaoMs > LIMITE_MS) {
    console.error(`[verificar-saude-deploy] FALHA: resposta em ${duracaoMs}ms, acima do limite de ${LIMITE_MS}ms.`);
    process.exit(1);
  }

  console.log(`[verificar-saude-deploy] OK — ${resposta.status} em ${duracaoMs}ms.`);
}

main();
