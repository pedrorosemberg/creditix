import "server-only";

export type AiProviderResult = {
  provider: "ollama" | "gemini" | "local";
  model: string;
  content: string;
};

export interface AiProvider {
  gerar(prompt: string): Promise<AiProviderResult>;
}
