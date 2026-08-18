#!/usr/bin/env node
// Roda depois de `next build`: garante que o "segredo de negócio" do
// Creditix — os prompts de guardrail da IA e o motor de cálculo do plano de
// recuperação/juros abusivos — nunca acabe embutido no bundle JS enviado ao
// navegador. Esse código deve rodar só em Server Components/Actions (ver
// SECURITY.md, "IA e cálculos sempre server-side"); se um desses trechos
// aparecer aqui, algum import passou a puxar o módulo para o lado do
// cliente, e é isso que este teste detecta antes de chegar em produção.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const DIR_CLIENTE = join(process.cwd(), ".next", "static");

// Trechos literais distintos o suficiente para não dar falso positivo, e
// que sobrevivem à minificação por serem strings de dados/prompt, não
// identificadores de função (esses a minificação renomeia).
const ASSINATURAS_PROIBIDAS = [
  "Regras obrigatórias, que você nunca deve quebrar",
  "Você é o assistente financeiro do Creditix",
  "se preparar para negociá-la. NÃO é um advogado",
];

async function listarArquivosJs(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  const arquivos = [];
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      arquivos.push(...(await listarArquivosJs(caminho)));
    } else if (entrada.name.endsWith(".js")) {
      arquivos.push(caminho);
    }
  }
  return arquivos;
}

async function main() {
  let arquivos;
  try {
    arquivos = await listarArquivosJs(DIR_CLIENTE);
  } catch (err) {
    console.error(`[verificar-segredo-negocio] Não consegui ler ${DIR_CLIENTE} — rode "next build" antes.`);
    throw err;
  }

  const achados = [];
  for (const arquivo of arquivos) {
    const conteudo = await readFile(arquivo, "utf8");
    for (const assinatura of ASSINATURAS_PROIBIDAS) {
      if (conteudo.includes(assinatura)) {
        achados.push({ arquivo, assinatura });
      }
    }
  }

  if (achados.length > 0) {
    console.error("[verificar-segredo-negocio] FALHA: lógica de negócio server-only encontrada no bundle do navegador:");
    for (const { arquivo, assinatura } of achados) {
      console.error(`  - "${assinatura}" em ${arquivo}`);
    }
    console.error("Verifique se algum Client Component importou um módulo de src/lib/ai ou src/lib/finance/legal diretamente.");
    process.exit(1);
  }

  console.log(`[verificar-segredo-negocio] OK — ${arquivos.length} arquivos verificados, nenhum vazamento encontrado.`);
}

main();
