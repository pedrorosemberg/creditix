import type { Metadata } from "next";
import Link from "next/link";
import { Code2, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { OPERADOR } from "@/lib/config/operador";

export const metadata: Metadata = {
  title: "Licença",
  robots: { index: true, follow: true },
};

const VARIAVEIS_OBRIGATORIAS = [
  { nome: "NEXT_PUBLIC_SUPABASE_URL", descricao: "URL do seu projeto Supabase (Cloud ou self-hosted)." },
  { nome: "NEXT_PUBLIC_SUPABASE_ANON_KEY", descricao: "Chave pública (anon) do seu projeto Supabase." },
  { nome: "SUPABASE_SERVICE_ROLE_KEY", descricao: "Chave de serviço — só server-side, nunca exposta ao navegador." },
  { nome: "NEXT_PUBLIC_APP_URL", descricao: "URL onde a sua instância vai ficar publicada." },
  { nome: "CRON_SECRET", descricao: "Segredo pra autenticar a chamada diária do cron de lembretes." },
];

const VARIAVEIS_OPCIONAIS = [
  { nome: "RESEND_API_KEY / RESEND_FROM_EMAIL", descricao: "Envio de e-mails transacionais (lembretes, confirmação de conta)." },
  {
    nome: "AI_PROVIDER, OLLAMA_HOST, OLLAMA_MODEL...",
    descricao: "Provedor de IA para análise de dívidas e chat — local embutido, Ollama próprio, ou (desligado por padrão) Gemini.",
  },
  {
    nome: "NEXT_PUBLIC_OPERATOR_NAME",
    descricao: `Nome de quem opera a instância, mostrado no rodapé (padrão: "${OPERADOR.nome}").`,
  },
  { nome: "NEXT_PUBLIC_OPERATOR_URL", descricao: "Site de quem opera a instância, linkado no rodapé." },
  { nome: "NEXT_PUBLIC_OPERATOR_ADDRESS", descricao: "Endereço mostrado no rodapé." },
  { nome: "NEXT_PUBLIC_CREATOR_NAME", descricao: "Nome de quem criou/mantém a instância, mostrado no rodapé." },
  { nome: "NEXT_PUBLIC_REPO_URL", descricao: "Link do seu próprio repositório, se for diferente do original." },
];

export default function LicencaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <a
            href={OPERADOR.repositorioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:text-brand-red"
          >
            <Code2 className="h-4 w-4" /> Repositório no GitHub
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 md:px-6">
          <div>
            <h1 className="text-2xl font-semibold">Licença</h1>
            <p className="mt-2 text-sm text-foreground-muted">
              O código-fonte do Creditix é distribuído sob a{" "}
              <a
                href="https://opensource.org/license/mit/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-red underline"
              >
                Licença MIT
              </a>
              . Esta página resume, em português, o que isso significa na prática — o texto legal oficial (em
              inglês) está no arquivo <code className="rounded bg-surface-muted px-1">LICENSE</code> do
              repositório.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold">O que a licença permite</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
              <li>Usar o software livremente, inclusive para fins comerciais.</li>
              <li>Copiar, estudar e modificar o código-fonte.</li>
              <li>Publicar, distribuir, sublicenciar e vender cópias — modificadas ou não.</li>
              <li>Rodar sua própria instância (self-host), com a sua própria marca e configuração.</li>
            </ul>
            <p className="mt-3 text-sm text-foreground-muted">
              A única condição é manter o aviso de copyright e o texto da licença em qualquer cópia ou parte
              substancial do software — inclusive em forks e distribuições modificadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">O que não está autorizado</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
              <li>Remover o aviso de copyright ou o texto da licença de cópias do software.</li>
              <li>
                Usar o nome &quot;Creditix&quot;, a marca &quot;{OPERADOR.nome}&quot; ou seus logotipos de um jeito que sugira
                endosso, afiliação oficial ou parceria com a {OPERADOR.nome} — a licença MIT cobre o código, não
                marcas registradas.
              </li>
              <li>
                Esperar qualquer garantia ou responsabilidade dos autores: o software é fornecido &quot;como está&quot;,
                sem garantias de qualquer tipo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Hospedando sua própria instância</h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Se você fizer self-host, a lista abaixo (ver também{" "}
              <code className="rounded bg-surface-muted px-1">.env.example</code> no repositório) resume as
              variáveis de ambiente que você precisa configurar. Troque as variáveis de identidade (nome, site,
              endereço, criador) pelas suas — não deixe os dados da {OPERADOR.nome} numa instância que não é
              operada por nós.
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium">Obrigatórias</p>
              <ul className="mt-2 space-y-2 text-sm">
                {VARIAVEIS_OBRIGATORIAS.map((v) => (
                  <li key={v.nome}>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{v.nome}</code>
                    <span className="text-foreground-muted"> — {v.descricao}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium">Opcionais / recomendadas</p>
              <ul className="mt-2 space-y-2 text-sm">
                {VARIAVEIS_OPCIONAIS.map((v) => (
                  <li key={v.nome}>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{v.nome}</code>
                    <span className="text-foreground-muted"> — {v.descricao}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
