import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { OPERADOR } from "@/lib/config/operador";

export const metadata: Metadata = {
  title: "Privacidade e termos de uso",
  robots: { index: true, follow: true },
};

const SUBCONTRATADOS = [
  {
    nome: "Vercel",
    papel: "hospedagem da aplicação e das funções serverless.",
    url: "https://vercel.com/legal/privacy-policy",
  },
  {
    nome: "Supabase",
    papel: "banco de dados, autenticação e armazenamento de arquivos.",
    url: "https://supabase.com/privacy",
  },
  {
    nome: "Resend",
    papel: "envio de e-mails transacionais (confirmação de conta, lembretes, redefinição de senha).",
    url: "https://resend.com/legal/privacy-policy",
  },
  {
    nome: "Google Cloud Platform",
    papel:
      "infraestrutura (Cloud Run) que hospeda o servidor Ollama usado para a análise por IA — o modelo roda em container próprio, dentro dessa infraestrutura, e nenhum dado é enviado a uma API de terceiros de IA.",
    url: "https://cloud.google.com/terms/cloud-privacy-notice",
  },
  {
    nome: "Vercel Analytics",
    papel:
      "métricas agregadas de visitas e navegação (páginas mais acessadas, origem de tráfego) — não identifica você individualmente.",
    url: "https://vercel.com/legal/privacy-policy",
  },
  {
    nome: "Grafana Cloud",
    papel:
      "observabilidade de produto (erros e performance agregados) para o time interno — opcional, sem session replay e sem enviar e-mail, nome ou qualquer dado financeiro.",
    url: "https://grafana.com/legal/privacy-policy/",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 md:px-6">
          <div>
            <h1 className="text-2xl font-semibold">Privacidade e termos de uso</h1>
            <p className="mt-2 text-sm text-foreground-muted">
              Esta página descreve como esta instância do Creditix trata os seus dados e em quais condições você
              pode usá-la.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold">Como seus dados são tratados</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
              <li>
                Nenhuma tabela do banco aceita acesso anônimo e cada usuário só enxerga os próprios registros
                (Row Level Security no banco de dados, não só uma regra no código do app).
              </li>
              <li>
                A análise por IA (parecer sobre dívidas, chat) roda em infraestrutura própria — nunca numa API
                de terceiros que armazene ou treine modelos com o que você digita.
              </li>
              <li>Seus dados nunca são vendidos ou compartilhados com terceiros para fins de marketing.</li>
              <li>
                Você pode excluir sua conta e todos os seus dados a qualquer momento em Configurações; dívidas,
                transações e análises são removidas em cascata.
              </li>
              <li>
                Usamos analytics e observabilidade de produto (Vercel Analytics e, opcionalmente, Grafana
                Cloud) só para métricas agregadas de uso, performance e erros — nunca para ver dívidas,
                valores, e-mail ou qualquer outro dado financeiro seu.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Se você usa esta instância hospedada pela {OPERADOR.nome}</h2>
            <p className="mt-2 text-sm text-foreground-muted">
              O Creditix é um software de código aberto (
              <Link href="/licenca" className="text-brand-red underline">
                licença MIT
              </Link>
              ) — qualquer pessoa pode hospedar sua própria instância. Esta em particular, no entanto, é operada
              pela {OPERADOR.nome}. Ao usar <strong>esta</strong> instância, você concorda também com as políticas
              gerais da {OPERADOR.nome}, que se aplicam a todos os produtos e serviços da empresa:
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <a href="https://www.metadax.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="text-brand-red underline">
                  metadax.com.br/privacidade
                </a>
              </li>
              <li>
                <a href="https://www.metadax.com.br/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-brand-red underline">
                  metadax.com.br/termos-de-uso
                </a>
              </li>
              <li>
                <a href="https://www.metadax.com.br/seguranca" target="_blank" rel="noopener noreferrer" className="text-brand-red underline">
                  metadax.com.br/seguranca
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-foreground-muted">
              Se você fizer self-host da sua própria instância a partir do código-fonte, estas referências à{" "}
              {OPERADOR.nome} não se aplicam a você — a política acima é específica desta instância hospedada por
              nós, e você deve escrever e publicar a sua própria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Provedores e subcontratados usados por esta aplicação</h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Esta instância depende dos seguintes serviços de terceiros para funcionar. Cada um deles processa
              uma parte dos dados na função descrita, sob a própria política de privacidade:
            </p>
            <ul className="mt-3 space-y-3 text-sm">
              {SUBCONTRATADOS.map((s) => (
                <li key={s.nome}>
                  <span className="font-medium">{s.nome}</span>
                  <span className="text-foreground-muted"> — {s.papel} </span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-red underline">
                    Política de privacidade
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-foreground-muted">
              Docker e Ollama são softwares que rodam dentro da nossa própria infraestrutura (não são serviços de
              terceiros com acesso aos seus dados) — por isso não têm uma política de privacidade própria
              aplicável aqui; o tratamento de dados nessa camada segue a política da infraestrutura que os
              hospeda (Google Cloud Platform, listada acima).
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
