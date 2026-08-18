import "server-only";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";
import { LocalModelProvider } from "./local";
import type { AiProvider } from "./provider";

/**
 * AI_PROVIDER explícito sempre vence. Sem ele, tentar Ollama por padrão
 * era uma escolha ruim fora do self-hosted: em ambientes serverless (ex.:
 * Vercel) não existe "localhost:11434" nenhum — a chamada falha sempre,
 * de forma silenciosa para o usuário final ("IA indisponível"). Por isso o
 * fallback automático olha o que está de fato configurado no ambiente:
 * GEMINI_API_KEY (mais confiável em serverless) > OLLAMA_HOST explícito
 * (sinal de self-hosted de verdade) > modelo local embutido (funciona sem
 * nenhuma chave, mas é experimental em serverless — ver local.ts).
 */
export function obterProvedor(): AiProvider {
  const provedor = process.env.AI_PROVIDER;

  if (provedor === "gemini") return new GeminiProvider();
  if (provedor === "local") return new LocalModelProvider();
  if (provedor === "ollama") return new OllamaProvider();

  if (process.env.GEMINI_API_KEY) return new GeminiProvider();
  if (process.env.OLLAMA_HOST) return new OllamaProvider();
  return new LocalModelProvider();
}
