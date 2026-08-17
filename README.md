# Creditix

Organize suas dívidas, monte um plano de recuperação financeira real e identifique cobranças de juros
abusivos — com base em legislação e jurisprudência brasileiras vigentes. Um produto **METADAX**
(`creditix.metadax.com.br`).

> Aplicativo privado: cada pessoa cria sua própria conta e só enxerga seus próprios dados (Row Level
> Security no banco). Veja [`SECURITY.md`](./SECURITY.md).

## O que o Creditix faz

- **Cadastro de dívidas** com os dados típicos de um relatório do Serasa: credor, contrato, produto,
  datas, valor original/atual, negativação e desconto para pagamento à vista.
- **Análise de juros por dívida**: taxa implícita estimada, comparação com o teto legal (credores não
  financeiros) ou faixas de mercado (instituições financeiras), veredito de abusividade e checagem de
  possível prescrição — com os fundamentos jurídicos citados (CDC, Lei de Usura, Lei do
  Superendividamento, súmulas do STJ/STF).
- **Relatório individual exportável** em PDF e CSV.
- **Plano de recuperação financeira** com simulação à vista vs. parcelado para cada dívida, priorização
  configurável (avalanche, bola de neve ou jurídica primeiro) e recomendação de repactuação judicial
  quando o cenário exigir.
- **Orçamento e transações**: registro de renda, gastos e lançamentos livres.
- **Lembretes mensais por e-mail** (Resend) com as contas do mês.
- **Parecer por IA** processado inteiramente no servidor (Ollama local por padrão; Gemini opcional).

## Stack

Next.js 16 (App Router) · Supabase (self-hosted ou Cloud) · Tailwind v4 · Resend · Ollama/Gemini ·
TypeScript · Vitest. Detalhes em [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Começando

```bash
npm install
cp .env.example .env.local   # preencha com seu Supabase (veja docs/SETUP.md)
npm run dev
```

Guia completo (nuvem ou self-hosted com Docker) em [`docs/SETUP.md`](./docs/SETUP.md).

## Ambientes e branches

Este repositório usa três branches de longa duração — `dev` (desenvolvimento) → `hmg` (homologação:
testes de carga e segurança) → `prod` (`creditix.metadax.com.br`) — com promoção via Pull Request
bloqueada por checks obrigatórios de CI. Detalhes em [`docs/ENVIRONMENTS.md`](./docs/ENVIRONMENTS.md).

## Checagens locais

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```

## Aviso legal

O conteúdo jurídico exibido pelo Creditix (fundamentos legais, veredito de abusividade, próximos passos)
é orientativo, gerado a partir de regras determinísticas e/ou IA, e **não substitui aconselhamento
jurídico individualizado** por advogado(a) ou pela Defensoria Pública.

## Licença

MIT — veja [`LICENSE`](./LICENSE).
