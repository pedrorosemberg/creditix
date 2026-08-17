import "server-only";
import type { AiProvider, AiProviderResult } from "./provider";

/**
 * Provedor de IA local via Ollama (https://ollama.com). Roda inteiramente
 * no seu próprio servidor/máquina — nenhum dado da dívida sai da sua
 * infraestrutura. Requer `ollama serve` ativo e o modelo baixado
 * (`ollama pull <modelo>`).
 */
export class OllamaProvider implements AiProvider {
  constructor(
    private readonly host = process.env.OLLAMA_HOST || "http://localhost:11434",
    private readonly model = process.env.OLLAMA_MODEL || "llama3.1",
  ) {}

  async gerar(prompt: string): Promise<AiProviderResult> {
    const resposta = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!resposta.ok) {
      throw new Error(`Falha ao chamar o Ollama (${resposta.status}). Verifique se "ollama serve" está ativo.`);
    }

    const dados = (await resposta.json()) as { response: string };
    return { provider: "ollama", model: this.model, content: dados.response.trim() };
  }
}
