import "server-only";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";
import { LocalModelProvider } from "./local";
import type { AiProvider } from "./provider";

export function obterProvedor(): AiProvider {
  switch (process.env.AI_PROVIDER) {
    case "gemini":
      return new GeminiProvider();
    case "local":
      return new LocalModelProvider();
    default:
      return new OllamaProvider();
  }
}
