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
- **Transações e orçamento**: lançamento centralizado de receitas, despesas e pagamentos de dívida, com
  periodicidade (única, diária, semanal, quinzenal, mensal, semestral, anual) alimentando automaticamente
  a renda/gastos recorrentes usados no plano de recuperação.
- **Contas bancárias**: cadastro das instituições envolvidas (credora ou pra pagamento), com detecção de
  possível duplicidade ao lançar algo parecido (heurística por nome + segunda opinião opcional por IA).
- **Lembretes por e-mail** (Resend), com frequência configurável e um botão de teste que dispara o envio
  na hora, sem esperar o cron.
- **Parecer por IA** processado inteiramente no servidor (Ollama local ou self-hosted por padrão; Gemini
  opcional e desligado por padrão — ver [`SECURITY.md`](./SECURITY.md)).
- **Programa de indicação** (`/convite`): link pessoal, com contagem de convites pendentes, aceitos e de
  quantos indicados já quitaram alguma dívida — sem nunca expor os dados financeiros de quem foi indicado.
- **Tour de boas-vindas** guiado (driver.js) no primeiro acesso, com botão pra rever em Configurações a
  qualquer momento.
- **Perguntas frequentes** (`/faq`) e contato direto com a equipe.

## Como participar

1. Crie sua conta em `/cadastro` (ou peça um link de indicação a alguém que já use o Creditix, em
   `/convite`).
2. Cadastre suas dívidas, renda e gastos essenciais — o painel e o plano de recuperação são montados
   automaticamente a partir disso.
3. Dúvidas comuns (segurança, IA, senha, indicação) estão em [`/faq`](https://creditix.metadax.com.br/faq);
   o que não estiver lá, é só escrever para **contato@metadax.com.br**.
4. Quer contribuir com código? O projeto é código aberto (MIT) — veja a seção "Stack" abaixo e
   [`AGENTS.md`](./AGENTS.md) antes de abrir uma PR.

## Stack

Next.js 16 (App Router) · Supabase (self-hosted ou Cloud) · Tailwind v4 · Resend · Ollama/Gemini ·
Upstash Redis (rate limit, opcional) · Vercel Analytics · Grafana Cloud (observabilidade, opcional) ·
driver.js (onboarding) · TypeScript · Vitest · Playwright. Detalhes em
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); autenticação especificamente em
[`docs/AUTENTICACAO.md`](./docs/AUTENTICACAO.md); observabilidade em
[`docs/OBSERVABILIDADE.md`](./docs/OBSERVABILIDADE.md).

Este repositório também tem um [`AGENTS.md`](./AGENTS.md) (lido automaticamente por agentes de IA/Claude
Code) com convenções específicas do projeto — vale ler antes de propor uma mudança grande.

## Começando

```bash
npm install
cp .env.example .env.local   # preencha com seu Supabase (veja docs/SETUP.md)
npm run dev
```

Guia completo (nuvem ou self-hosted com Docker) em [`docs/SETUP.md`](./docs/SETUP.md).

## Ambientes e branches

Este repositório usa três branches de longa duração — `dev` (desenvolvimento) → `hmg` (homologação:
testes de carga e segurança) → `prod` (`creditix.metadax.com.br`) — com promoção automática via Pull
Request: uma esteira classifica cada mudança (feature ou hotfix/emergencial), roda a bateria de testes
correspondente (segurança, cloud, escalabilidade, eficiência, funcionalidade e proteção contra vazamento
de lógica de negócio) e mergeia sozinha quando tudo passa. Detalhes em
[`docs/ENVIRONMENTS.md`](./docs/ENVIRONMENTS.md).

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

MIT — veja [`LICENSE`](./LICENSE). Dentro do próprio app: `/licenca` explica em português o que é
permitido, o que não é (uso de marca), e as variáveis pra self-host; `/privacidade` documenta como os
dados são tratados e lista os subcontratados usados (Vercel, Supabase, Resend, Google Cloud Platform,
Vercel Analytics, Grafana Cloud); `/faq` responde as dúvidas mais comuns.
