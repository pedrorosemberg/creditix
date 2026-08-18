import "server-only";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";
import { LocalModelProvider } from "./local";
import type { AiProvider } from "./provider";

/**
 * AI_PROVIDER explícito sempre vence. Sem ele, o padrão é o modelo local
 * embutido (LocalModelProvider) — por decisão de produto, dados do usuário
 * nunca são enviados a uma API de terceiros (Gemini) por padrão; o Gemini
 * só é usado se alguém configurar AI_PROVIDER=gemini explicitamente. Não
 * usamos Ollama como padrão automático porque em ambientes serverless
 * (ex.: Vercel) não existe "localhost:11434" nenhum — a chamada falharia
 * sempre; Ollama só entra se OLLAMA_HOST for configurado explicitamente,
 * sinal de que existe de fato um servidor self-hosted apontado.
 */
export function obterProvedor(): AiProvider {
  const provedor = process.env.AI_PROVIDER;

  if (provedor === "gemini") return new GeminiProvider();
  if (provedor === "ollama") return new OllamaProvider();
  if (provedor === "local") return new LocalModelProvider();

  if (process.env.OLLAMA_HOST) return new OllamaProvider();
  return new LocalModelProvider();
}
