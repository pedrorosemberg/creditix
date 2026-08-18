import "server-only";
import path from "node:path";
import { existsSync } from "node:fs";
import type { AiProvider, AiProviderResult } from "./provider";

/**
 * Provedor de IA local "embutido": roda um modelo pequeno (ONNX, via
 * @huggingface/transformers) dentro do próprio processo do servidor — sem
 * depender de um serviço externo (nem Ollama, nem uma API de terceiros
 * como Gemini). Nenhum dado do usuário sai desta infraestrutura: os pesos
 * do modelo são baixados uma única vez durante o BUILD (ver
 * scripts/baixar-modelo-ia.mjs, rodado como "prebuild") e ficam junto do
 * próprio deploy — em runtime este provedor só lê arquivos locais
 * (`allowRemoteModels = false`), nunca faz nenhuma chamada de rede.
 *
 * Se o build não conseguiu baixar o modelo por algum motivo (ver logs do
 * prebuild), este provedor falha com um erro claro em vez de tentar
 * baixar em runtime — em serverless (ex.: Vercel) o disco não é garantido
 * entre execuções, então uma tentativa de download por requisição seria
 * lenta e poderia nunca completar a tempo.
 */
export class LocalModelProvider implements AiProvider {
  private static pipelinePromise: Promise<unknown> | null = null;

  constructor(
    private readonly modelId = process.env.LOCAL_MODEL_ID || "onnx-community/SmolLM2-135M-Instruct",
    private readonly maxNewTokens = Number(process.env.LOCAL_MODEL_MAX_NEW_TOKENS) || 350,
    private readonly timeoutMs = Number(process.env.LOCAL_MODEL_TIMEOUT_MS) || 55_000,
    private readonly cacheDir = process.env.LOCAL_MODEL_CACHE_DIR || path.join(process.cwd(), "models-cache"),
  ) {}

  private async obterPipeline() {
    if (!LocalModelProvider.pipelinePromise) {
      if (!existsSync(path.join(this.cacheDir, this.modelId))) {
        throw new Error(
          `Modelo local "${this.modelId}" não encontrado em ${this.cacheDir}. Ele deveria ter sido baixado no build ` +
            `(scripts/baixar-modelo-ia.mjs) — confira os logs de build. Alternativa: configure AI_PROVIDER=ollama com ` +
            "um servidor Ollama próprio.",
        );
      }
      LocalModelProvider.pipelinePromise = (async () => {
        const { pipeline, env } = await import("@huggingface/transformers");
        env.cacheDir = this.cacheDir;
        // Nunca busca na rede em runtime — o modelo já foi baixado no build.
        env.allowRemoteModels = false;
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
