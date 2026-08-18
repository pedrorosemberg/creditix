import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { OPERADOR } from "@/lib/config/operador";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  robots: { index: true, follow: true },
};

const PERGUNTAS = [
  {
    pergunta: "O Creditix é gratuito?",
    resposta:
      "Sim, para uso pessoal. É um software de código aberto (licença MIT) — você pode usar esta instância hospedada pela METADAX ou hospedar a sua própria gratuitamente.",
  },
  {
    pergunta: "Como funciona a análise de dívidas por IA?",
    resposta:
      "Você cadastra uma dívida (credor, valor, taxa de juros) e o Creditix roda um motor de análise próprio que compara a taxa com faixas de referência do Banco Central para identificar possível abusividade, além de verificar prescrição legal. A partir disso, um parecer em linguagem simples é gerado por um modelo de IA rodando na nossa própria infraestrutura — nunca é aconselhamento jurídico formal, mas ajuda a entender a situação antes de negociar ou buscar um advogado.",
  },
  {
    pergunta: "Meus dados financeiros são enviados para alguma IA de terceiros (OpenAI, Google, etc.)?",
    resposta:
      "Não, por padrão. A análise por IA roda em um servidor próprio (Ollama ou um modelo local embutido), nunca em uma API de terceiros que armazene ou treine modelos com o que você digita. Isso é uma decisão deliberada de arquitetura, documentada publicamente no repositório.",
  },
  {
    pergunta: "Quem pode ver minhas dívidas e dados financeiros?",
    resposta:
      "Só você. Todo acesso é protegido por Row Level Security no banco de dados (não apenas uma regra no código) — nenhum outro usuário, e nenhuma pessoa da equipe, consegue ler seus registros por padrão.",
  },
  {
    pergunta: "Como funciona o programa de indicação?",
    resposta:
      "Em Configurações você encontra seu link de indicação. Quando alguém se cadastra por ele, a indicação aparece como pendente; quando essa pessoa confirma o e-mail, ela passa para aceita. Acompanhe tudo em /convite.",
  },
  {
    pergunta: "Esqueci minha senha, e agora?",
    resposta: "Na tela de login, clique em \"Esqueceu a senha?\" e siga o link enviado por e-mail.",
  },
  {
    pergunta: "Por que minha senha foi recusada como \"muito fraca\"?",
    resposta:
      "O Supabase (nosso provedor de autenticação) recusa senhas fracas ou comuns demais, mesmo que tenham 8+ caracteres — por exemplo sequências óbvias (\"12345678\") ou senhas muito usadas. Misture letras, números e símbolos, e evite palavras previsíveis.",
  },
  {
    pergunta: "Posso excluir minha conta e meus dados?",
    resposta:
      "Sim, a qualquer momento em Configurações. A exclusão remove sua conta e todos os dados vinculados (dívidas, transações, análises) em cascata — não é reversível.",
  },
  {
    pergunta: "O Creditix substitui um advogado?",
    resposta:
      "Não. O parecer gerado é orientativo, baseado em legislação e súmulas públicas, para ajudar você a entender a situação e se preparar — não é aconselhamento jurídico individualizado. Para casos concretos, procure um(a) advogado(a) ou a Defensoria Pública.",
  },
] as const;

export default function FaqPage() {
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
            <h1 className="text-2xl font-semibold">Perguntas frequentes</h1>
            <p className="mt-2 text-sm text-foreground-muted">
              Dúvidas comuns sobre o Creditix. Não encontrou o que precisava? Fale com a gente.
            </p>
          </div>

          <Accordion>
            {PERGUNTAS.map((item) => (
              <AccordionItem key={item.pergunta} pergunta={item.pergunta}>
                {item.resposta}
              </AccordionItem>
            ))}
          </Accordion>

          <section>
            <h2 className="text-lg font-semibold">Contato</h2>
            <p className="mt-3 text-sm text-foreground-muted">
              <a href="mailto:contato@metadax.com.br" className="text-brand-red underline">
                contato@metadax.com.br
              </a>
            </p>
            <p className="mt-3 text-sm text-foreground-muted">
              {OPERADOR.nome}
              <br />
              {OPERADOR.endereco}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
