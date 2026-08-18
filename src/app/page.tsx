import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Landmark,
  LineChart,
  Bot,
  FileBarChart,
  Building2,
  Bell,
  Scale,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/footer";

// A landing pública é o único lugar do app com intenção de ser
// encontrado por quem ainda não é usuário — por isso libera indexação
// aqui, mesmo com o resto do app bloqueado (robots: noindex) no layout
// raiz, já que é uma ferramenta privada de uso pessoal.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

const RECURSOS = [
  {
    icon: Landmark,
    titulo: "Dívidas centralizadas",
    descricao: "Cadastre todas as suas dívidas num só lugar, com status, valores e histórico de negociação.",
  },
  {
    icon: Scale,
    titulo: "Análise de juros abusivos",
    descricao:
      "Motor de análise jurídica que compara a taxa da sua dívida com a Lei de Usura e faixas de referência, apontando indícios de abuso e possível prescrição.",
  },
  {
    icon: LineChart,
    titulo: "Plano de recuperação financeira",
    descricao:
      "Simulação de quanto tempo leva pra quitar tudo, priorizando acumular margem e negociar à vista, sempre preservando seu mínimo existencial.",
  },
  {
    icon: Bot,
    titulo: "Assistente de IA privado",
    descricao:
      "Converse sobre sua situação financeira com um assistente que roda em infraestrutura própria — seus dados nunca são enviados para APIs de IA de terceiros.",
  },
  {
    icon: FileBarChart,
    titulo: "Relatórios personalizados",
    descricao: "Exporte relatórios em PDF ou CSV, filtrados por período, dívida ou tipo de transação.",
  },
  {
    icon: Building2,
    titulo: "Contas bancárias",
    descricao: "Relacione cada dívida à instituição credora ou à conta que você vai usar pra pagar.",
  },
  {
    icon: Bell,
    titulo: "Lembretes automáticos",
    descricao: "Receba por e-mail, na frequência que escolher, um resumo do que vence e do que falta lançar.",
  },
  {
    icon: Lock,
    titulo: "Privacidade por padrão",
    descricao:
      "Isolamento total entre usuários no banco de dados (RLS), nunca acesso anônimo, e nenhum dado sai da sua sessão sem necessidade.",
  },
];

const PASSOS = [
  {
    numero: "1",
    titulo: "Cadastre suas dívidas",
    descricao: "Use os dados do seu relatório de negativação: credor, valores, datas e número do contrato.",
  },
  {
    numero: "2",
    titulo: "Veja a análise automática",
    descricao: "O sistema calcula a taxa de juros implícita e aponta se ela está dentro da lei.",
  },
  {
    numero: "3",
    titulo: "Siga o plano de recuperação",
    descricao: "Acompanhe quanto tempo falta pra quitar tudo e priorize a negociação mais vantajosa.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <span className="font-display text-lg tracking-wide text-brand-red">Creditix</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-brand-red px-4 text-sm font-medium text-brand-white hover:bg-brand-red-hover"
            >
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-24">
          <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
            Organize suas dívidas e descubra se estão cobrando juros abusivos
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-foreground-muted md:text-lg">
            O Creditix centraliza suas dívidas, analisa cada uma com base na legislação vigente e monta um plano
            real de recuperação financeira — sem sugerir novo empréstimo, sem comprometer o mínimo que você precisa
            pra viver.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cadastro"
              className="inline-flex h-12 items-center rounded-[var(--radius-md)] bg-brand-red px-6 text-base font-medium text-brand-white hover:bg-brand-red-hover"
            >
              Começar agora, é grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-[var(--radius-md)] border border-border px-6 text-base font-medium text-foreground hover:bg-surface-muted"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-surface-muted py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-2xl font-semibold">Tudo que você precisa pra sair do vermelho</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {RECURSOS.map(({ icon: Icon, titulo, descricao }) => (
                <div key={titulo} className="rounded-[var(--radius-lg)] bg-surface p-5 shadow-[var(--shadow-card)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{titulo}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <h2 className="text-center text-2xl font-semibold">Como funciona</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {PASSOS.map(({ numero, titulo, descricao }) => (
                <div key={numero} className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-base font-semibold text-brand-white">
                    {numero}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{titulo}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface-muted py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center md:px-6">
            <ShieldCheck className="h-10 w-10 text-brand-red" />
            <h2 className="text-2xl font-semibold">Seus dados financeiros continuam seus</h2>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Nenhuma tabela do banco aceita acesso anônimo, cada usuário só enxerga os próprios registros (Row
              Level Security no banco, não só no código do app), e a análise por IA roda em infraestrutura que
              controlamos — não em uma API de terceiros que armazena ou treina modelos com o que você digita. O
              software é distribuído sob{" "}
              <Link href="/licenca" className="text-brand-red underline">
                licença MIT
              </Link>
              . Veja também nossa{" "}
              <Link href="/privacidade" className="text-brand-red underline">
                política de privacidade e termos de uso
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
            <h2 className="text-2xl font-semibold">Pronto pra organizar suas dívidas?</h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Leva menos de dois minutos pra cadastrar sua primeira dívida e ver a análise.
            </p>
            <Link
              href="/cadastro"
              className="mt-6 inline-flex h-12 items-center rounded-[var(--radius-md)] bg-brand-red px-6 text-base font-medium text-brand-white hover:bg-brand-red-hover"
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
