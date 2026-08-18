<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Creditix — contexto para agentes de IA

Este bloco é mantido à mão (o bloco acima é gerado pelo `next dev` — não edite dentro dele). Objetivo:
dar contexto suficiente pra qualquer LLM trabalhar neste repositório sem precisar re-descobrir tudo do
zero. Para arquitetura/stack detalhada, veja [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); para
segurança, [`SECURITY.md`](./SECURITY.md); para autenticação especificamente,
[`docs/AUTENTICACAO.md`](./docs/AUTENTICACAO.md); para ambientes/branches,
[`docs/ENVIRONMENTS.md`](./docs/ENVIRONMENTS.md).

## O que é

Creditix é um app de organização de dívidas e recuperação financeira para o mercado brasileiro, operado
pela METADAX (`creditix.metadax.com.br`). Código aberto sob MIT (ver [`LICENSE`](./LICENSE) e
`/licenca` no próprio app) — qualquer pessoa pode fazer self-host da própria instância.

## Convenções deste repositório (siga antes de assumir padrões genéricos de Next.js)

- **Idioma**: todo identificador de domínio (funções, variáveis, tabelas, colunas, mensagens de commit,
  comentários) é em **português do Brasil**. Nomes técnicos genéricos (tipos utilitários, nomes de libs)
  podem ficar em inglês. Não traduza pra inglês por padrão.
- **RLS é a linha de defesa real, não o código de aplicação**: toda tabela de negócio tem Row Level
  Security com `auth.uid() = user_id`. Ao criar uma tabela nova, sempre habilite RLS e pense
  explicitamente em quem deve/não deve ler cada linha — nunca assuma que "o código já filtra" é
  suficiente.
- **Nunca leia/escreva dados de outro usuário via service role sem necessidade real**: `createAdminClient()`
  (`src/lib/supabase/admin.ts`, `import "server-only"`) ignora RLS. Só é usado em rotinas de sistema
  (cron, geração de links de auth, sincronização de indicações) — nunca em código acionado livremente
  pelo usuário sem uma razão explícita e documentada no comentário.
- **Toda mutação passa por zod** (`src/lib/security/validation.ts`) antes de tocar o banco, mesmo que o
  formulário já valide no cliente.
- **Toda ação sensível a abuso passa por `checarLimite()`** (`src/lib/security/rate-limit.ts`) — é
  `async` (Upstash Redis quando configurado, fallback em memória caso contrário).
- **IA nunca é obrigatória nem bloqueante**: toda chamada a um provedor de IA (`src/lib/ai/*`) fica num
  `try/catch` que, em caso de falha, registra o erro (best-effort) e devolve uma mensagem de erro
  amigável — nunca derruba a página nem perde dados já salvos.
- **"Não usaremos Gemini" é uma decisão de produto, não um detalhe técnico**: por padrão nenhum dado do
  usuário sai da infraestrutura controlada (modelo local embutido ou Ollama self-hosted). O provedor
  Gemini existe no código mas fica desligado por padrão — só ativa se alguém definir
  `AI_PROVIDER=gemini` explicitamente. Não proponha usá-lo como padrão nem "só para testar".
- **Datas e moeda**: sempre `formatarData`/`formatarDataHora`/`formatarMoeda`/`hojeBrasil()`
  (`src/lib/utils.ts`) — nunca `toLocaleString`/`Date.now()` cru em código que o usuário vê. O fuso é
  sempre `America/Sao_Paulo`; servidores rodam em UTC.
- **Antes de qualquer commit**: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
  precisam passar limpos. Não há exceção "vou corrigir depois".
- **Migrations são cumulativas e nunca editadas depois de aplicadas**: cada arquivo em
  `supabase/migrations/` é aplicado uma vez, na ordem do nome (timestamp). Para mudar algo já aplicado,
  crie uma nova migration — nunca edite uma antiga já mergeada.
- **Branches**: `dev` (principal) → `prod`, só por Pull Request com CI obrigatório (ver
  `docs/ENVIRONMENTS.md`). Nunca push direto em `prod`.
