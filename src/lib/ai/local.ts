import "server-only";
import type { AiProvider, AiProviderResult } from "./provider";

/**
 * Provedor de IA local "embutido": roda um modelo pequeno (ONNX, via
 * @huggingface/transformers) dentro do próprio processo do servidor —
 * sem depender de um serviço externo tipo Ollama. Nenhum dado da dívida é
 * enviado a terceiros; a única chamada de rede é para baixar os pesos do
 * modelo (arquivos públicos, sem informação do usuário) na primeira vez
 * que a instância do servidor processa uma análise.
 *
 * EXPERIMENTAL em ambientes serverless (ex.: Vercel): funções serverless
 * têm limite de tamanho, CPU e tempo de execução, e o disco (/tmp) não é
 * garantido entre execuções — cada cold start pode precisar rebaixar o
 * modelo, o que é lento e pode estourar o timeout da função. Funciona de
 * forma mais previsível em self-hosted (Docker/servidor próprio) com
 * disco persistente. Se falhar, a análise por IA apenas retorna erro —
 * o resto do site não é afetado.
 */
export class LocalModelProvider implements AiProvider {
  private static pipelinePromise: Promise<unknown> | null = null;

  constructor(
    private readonly modelId = process.env.LOCAL_MODEL_ID || "onnx-community/Qwen2.5-0.5B-Instruct",
    private readonly maxNewTokens = Number(process.env.LOCAL_MODEL_MAX_NEW_TOKENS) || 350,
    private readonly timeoutMs = Number(process.env.LOCAL_MODEL_TIMEOUT_MS) || 55_000,
  ) {}

  private async obterPipeline() {
    if (!LocalModelProvider.pipelinePromise) {
      LocalModelProvider.pipelinePromise = (async () => {
        const { pipeline, env } = await import("@huggingface/transformers");
        // Único diretório gravável de forma confiável em serverless.
        env.cacheDir = process.env.LOCAL_MODEL_CACHE_DIR || "/tmp/creditix-modelos";
        return pipeline("text-generation", this.modelId, { dtype: "q4" });
      })();
    }
    return LocalModelProvider.pipelinePromise;
  }

  async gerar(prompt: string): Promise<AiProviderResult> {
    const gerarComTimeout = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gerador = (await this.obterPipeline()) as any;
      const saida = await gerador(
        [{ role: "user", content: prompt }],
        { max_new_tokens: this.maxNewTokens, temperature: 0.2, do_sample: false },
      );
      const texto: string | undefined = saida?.[0]?.generated_text?.at?.(-1)?.content;
      if (!texto) throw new Error("Resposta vazia do modelo local.");
      return texto.trim();
    };

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout ao gerar resposta com o modelo local.")), this.timeoutMs);
    });

    const content = await Promise.race([gerarComTimeout(), timeout]);
    return { provider: "local", model: this.modelId, content };
  }
}
