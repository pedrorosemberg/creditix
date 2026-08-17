import "server-only";

export type AiProviderResult = {
  provider: "ollama" | "gemini";
  model: string;
  content: string;
};

export interface AiProvider {
  gerar(prompt: string): Promise<AiProviderResult>;
}
