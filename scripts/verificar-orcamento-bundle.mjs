#!/usr/bin/env node
// Roda depois de `next build`: orçamento de tamanho total do JS enviado ao
// navegador (.next/static). Não é um proxy perfeito de performance real
// (isso exigiria medir contra um deploy vivo), mas pega a regressão mais
// comum e mais barata de detectar — uma dependência nova, ou um import que
// deixou de ser code-split, inflando o bundle inteiro sem ninguém notar até
// o usuário reclamar de lentidão no celular. Soma tudo (em vez de tentar
// atribuir por rota via manifesto interno do Next, que muda de formato entre
// versões/bundlers) para não depender de detalhes de implementação frágeis.
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const DIR_CLIENTE = join(process.cwd(), ".next", "static");

// 3 MB de JS total (antes de gzip) é generoso pra um app com bastante
// superfície (dashboard, relatórios, chat, dívidas) mas pega um salto grande
// (ex.: uma lib inteira de gráficos ou PDF puxada pro lado do cliente por
// engano) sem brigar por cada KB.
const ORCAMENTO_BYTES = 3 * 1024 * 1024;

async function tamanhoTotalJs(dir) {
  let total = 0;
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      total += await tamanhoTotalJs(caminho);
    } else if (entrada.name.endsWith(".js")) {
      total += (await stat(caminho)).size;
    }
  }
  return total;
}

async function main() {
  let total;
  try {
    total = await tamanhoTotalJs(DIR_CLIENTE);
  } catch (err) {
    console.error(`[verificar-orcamento-bundle] Não consegui ler ${DIR_CLIENTE} — rode "next build" antes.`);
    throw err;
  }

  const totalKb = Math.round(total / 1024);
  const orcamentoKb = Math.round(ORCAMENTO_BYTES / 1024);

  if (total > ORCAMENTO_BYTES) {
    console.error(
      `[verificar-orcamento-bundle] FALHA: JS total do cliente é ${totalKb} KB, acima do orçamento de ${orcamentoKb} KB.`,
    );
    console.error("Verifique se alguma dependência nova (ou um import) passou a ser bundlada no cliente sem necessidade.");
    process.exit(1);
  }

  console.log(`[verificar-orcamento-bundle] OK — ${totalKb} KB de JS no cliente (orçamento: ${orcamentoKb} KB).`);
}

main();
