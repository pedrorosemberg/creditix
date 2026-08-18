#!/usr/bin/env node
/**
 * Baixa os pesos do modelo de IA local embutido durante o BUILD (não em
 * runtime) e os deixa em disco, prontos para serem incluídos no bundle da
 * função serverless (Vercel) ou na imagem Docker (self-hosted). Isso
 * elimina qualquer chamada de rede em runtime: nenhum dado do usuário (e
 * nenhuma requisição, ponto) sai para terceiros quando o modelo local está
 * em uso — nem para a Hugging Face, nem para nenhum outro serviço.
 *
 * Roda automaticamente antes de "next build" (hook "prebuild" do npm).
 * É pulado:
 * - no gate de CI do GitHub Actions (GITHUB_ACTIONS=true) — o build ali é
 *   só para lint/typecheck/test, nunca serve tráfego real, e baixar ~100MB
 *   a cada execução só adicionaria latência e uma dependência de rede
 *   desnecessária a um gate que não precisa disso;
 * - se AI_PROVIDER apontar explicitamente para outro provedor (gemini ou
 *   ollama) no ambiente de build — nesse caso o modelo local nunca seria
 *   usado e não faz sentido pagar o custo de baixá-lo.
 *
 * Uso: node scripts/baixar-modelo-ia.mjs
 */
import { existsSync } from "node:fs";
import path from "node:path";

const MODEL_ID = process.env.LOCAL_MODEL_ID || "onnx-community/Qwen2.5-0.5B-Instruct";
const CACHE_DIR = path.join(process.cwd(), "models-cache");

function deveGerarModeloLocal() {
  if (process.env.GITHUB_ACTIONS === "true") {
    console.log("[baixar-modelo-ia] GITHUB_ACTIONS detectado — pulando download (gate de CI não serve tráfego).");
    return false;
  }
  const provedor = process.env.AI_PROVIDER;
  if (provedor === "gemini" || provedor === "ollama") {
    console.log(`[baixar-modelo-ia] AI_PROVIDER=${provedor} — modelo local não será usado, pulando download.`);
    return false;
  }
  return true;
}

async function main() {
  if (!deveGerarModeloLocal()) return;

  if (existsSync(path.join(CACHE_DIR, MODEL_ID))) {
    console.log(`[baixar-modelo-ia] ${MODEL_ID} já está em cache em ${CACHE_DIR} — nada a fazer.`);
    return;
  }

  console.log(`[baixar-modelo-ia] Baixando ${MODEL_ID} para ${CACHE_DIR} (uma vez, no build)...`);
  const { pipeline, env } = await import("@huggingface/transformers");
  env.cacheDir = CACHE_DIR;
  env.allowRemoteModels = true;

  const inicio = Date.now();
  await pipeline("text-generation", MODEL_ID, { dtype: "q4" });
  console.log(`[baixar-modelo-ia] Concluído em ${((Date.now() - inicio) / 1000).toFixed(1)}s.`);
}

main().catch((err) => {
  console.error("[baixar-modelo-ia] Falha ao baixar o modelo:", err);
  const mensagem = String(err?.message ?? err);
  if (/unauthorized|forbidden|401|403/i.test(mensagem)) {
    console.error(
      "[baixar-modelo-ia] Erro de autorização/acesso — verifique se LOCAL_MODEL_ID aponta para um " +
        "repositório público válido na Hugging Face. Se o modelo estiver correto, isso também pode ser " +
        "rate limit anônimo: gere um token gratuito, só de leitura, em " +
        "https://huggingface.co/settings/tokens e configure HF_TOKEN nas variáveis de ambiente do build. " +
        "Isso NÃO envia nenhum dado de usuário para a Hugging Face — só autentica o download dos pesos " +
        "(arquivos públicos) durante o build.",
    );
  }
  console.error(
    "[baixar-modelo-ia] O build vai continuar — o provedor local ficará indisponível até um build futuro conseguir baixar o modelo (ver AI_PROVIDER/OLLAMA_HOST como alternativa self-hosted).",
  );
});
