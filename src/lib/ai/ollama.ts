import "server-only";
import { GoogleAuth, type IdTokenClient } from "google-auth-library";
import type { AiProvider, AiProviderResult } from "./provider";

/**
 * Provedor de IA local via Ollama (https://ollama.com). Roda inteiramente
 * no seu próprio servidor — nenhum dado da dívida sai da sua
 * infraestrutura. Requer `ollama serve` ativo e o modelo baixado
 * (`ollama pull <modelo>`).
 *
 * Se OLLAMA_HOST apontar para um servidor exposto na internet, o Ollama em
 * si não tem autenticação própria — expor a porta sem nada na frente
 * deixaria qualquer pessoa na internet usar seu servidor. Duas formas de
 * proteger, dependendo de onde ele está hospedado:
 *
 * - VM própria atrás de um Caddy com HTTPS (ver
 *   docs/OLLAMA_SERVIDOR_GRATUITO.md): configure
 *   OLLAMA_BASIC_AUTH_USER/OLLAMA_BASIC_AUTH_PASSWORD.
 * - Google Cloud Run (ver docs/OLLAMA_CLOUD_RUN_GRATUITO.md), quando a
 *   política "Domain Restricted Sharing" da organização impede tornar o
 *   serviço público: configure OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON com o
 *   JSON da chave de uma conta de serviço com `roles/run.invoker` no
 *   serviço — cada chamada busca um ID token do Google assinado para essa
 *   URL específica.
 */

let googleIdTokenClientPromise: Promise<IdTokenClient> | null = null;

function obterClienteGoogleIdToken(host: string, credenciaisJson: string): Promise<IdTokenClient> {
  if (!googleIdTokenClientPromise) {
    const auth = new GoogleAuth({ credentials: JSON.parse(credenciaisJson) });
    googleIdTokenClientPromise = auth.getIdTokenClient(host);
  }
  return googleIdTokenClientPromise;
}

export class OllamaProvider implements AiProvider {
  constructor(
    private readonly host = process.env.OLLAMA_HOST || "http://localhost:11434",
    private readonly model = process.env.OLLAMA_MODEL || "llama3.1",
    private readonly basicAuthUser = process.env.OLLAMA_BASIC_AUTH_USER,
    private readonly basicAuthPassword = process.env.OLLAMA_BASIC_AUTH_PASSWORD,
    private readonly googleServiceAccountJson = process.env.OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON,
  ) {}

  private async headers(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.googleServiceAccountJson) {
      const client = await obterClienteGoogleIdToken(this.host, this.googleServiceAccountJson);
      const idToken = await client.idTokenProvider.fetchIdToken(this.host);
      headers.Authorization = `Bearer ${idToken}`;
    } else if (this.basicAuthUser && this.basicAuthPassword) {
      const credenciais = Buffer.from(`${this.basicAuthUser}:${this.basicAuthPassword}`).toString("base64");
      headers.Authorization = `Basic ${credenciais}`;
    }
    return headers;
  }

  async gerar(prompt: string): Promise<AiProviderResult> {
    const resposta = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: await this.headers(),
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
