import "server-only";
import type { AiProvider, AiProviderResult } from "./provider";

/**
 * Provedor de IA em nuvem via Gemini API. Opcional — só é usado se
 * AI_PROVIDER=gemini e GEMINI_API_KEY estiverem configurados. Chamado
 * exclusivamente a partir do servidor; a chave nunca chega ao navegador.
 */
export class GeminiProvider implements AiProvider {
  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY,
    private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  ) {}

  async gerar(prompt: string): Promise<AiProviderResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY não configurada.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) {
      throw new Error(`Falha ao chamar a API do Gemini (${resposta.status}).`);
    }

    const dados = (await resposta.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!texto) throw new Error("Resposta vazia do Gemini.");

    return { provider: "gemini", model: this.model, content: texto };
  }
}
