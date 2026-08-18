# Arquitetura

## Stack

- **Next.js 16 (App Router)** — Server Components, Server Actions e Route Handlers. Toda lógica de
  negócio (cálculo de juros, plano de recuperação, chamadas de IA) roda server-side; o cliente só
  recebe HTML/dados já processados.
- **Supabase** (self-hosted por padrão neste template, compatível com Supabase Cloud) — Postgres com Row
  Level Security, Auth (GoTrue) e REST (PostgREST).
- **Resend** — envio de e-mails transacionais (lembretes mensais).
- **Ollama / Gemini** — análise por IA, atrás de uma interface plugável (`src/lib/ai/provider.ts`).
- **Tailwind CSS v4** com tokens de marca da METADAX (`src/app/globals.css`).
- **Vitest** para testes unitários dos motores de negócio; **Playwright** para smoke tests E2E contra
  ambientes já implantados (ver `docs/ENVIRONMENTS.md`).
- **Vercel Analytics** e **Grafana Cloud** (opcional) para observabilidade de produto — ver
  `docs/OBSERVABILIDADE.md`.
- **driver.js** para o tour de boas-vindas guiado no primeiro acesso.

## Estrutura de pastas

```
src/
  app/
    (auth)/           # login, cadastro — rotas públicas
    (app)/             # dashboard, dívidas, orçamento, recuperação... — protegidas pelo proxy
    api/                # route handlers: cron de lembretes, exportação de relatórios
  components/
    ui/                 # primitivos (Button, Card, Input, Badge)
    layout/             # Sidebar, Topbar
    dividas/            # componentes específicos do domínio de dívidas
    relatorios/          # template do relatório em PDF
  lib/
    legal/              # motor de análise de juros, prescrição e fundamentos jurídicos
    finance/            # motor de plano de recuperação financeira
    ai/                  # provedores de IA (Ollama, Gemini) e orquestração
    email/               # templates e cliente Resend
    supabase/            # clients (browser, server, admin) e middleware de sessão
    security/            # validação (zod) e rate limiting
  types/
    database.types.ts    # tipos do banco (gerar via Supabase CLI quando possível)
supabase/
  migrations/             # schema SQL versionado (RLS, triggers, índices)
docker/                    # stack self-hosted (Postgres + GoTrue + PostgREST + Caddy + Ollama + app)
```

## Fluxo de dados de uma dívida

1. Usuário cadastra a dívida (dados do Serasa) via Server Action (`src/app/(app)/dividas/actions.ts`),
   validada com zod e inserida com o `user_id` da sessão — RLS garante que só o dono a vê.
2. A página de detalhe (`src/app/(app)/dividas/[id]/page.tsx`) roda, no servidor:
   - `analisarJuros()` — estima a taxa de juros implícita e compara com o teto legal (credor não
     financeiro) ou faixas de referência de mercado (credor financeiro), citando fundamentos jurídicos.
   - `verificarPrescricao()` — sinaliza se a dívida pode estar prescrita.
   - `calcularOpcaoAvista()` / `simularOpcoesParcelamento()` — opções de pagamento.
3. O usuário pode disparar um parecer por IA (Server Action → `analisarDividaComIa()` → Ollama/Gemini →
   grava em `ai_analyses`), ou exportar o relatório em PDF/CSV (Route Handlers em
   `src/app/api/relatorios/[id]/`).
4. Na aba **Recuperação**, todas as dívidas ativas do usuário entram em `montarPlanoRecuperacao()`, que
   aloca a margem mensal (renda − gastos essenciais) entre elas conforme a estratégia escolhida
   (avalanche, bola de neve ou jurídica primeiro).

## Papel admin_global

`/admin` (visível no menu só para quem tem a permissão) lista, para o time interno, dados agregados de
conta de todos os usuários — data de cadastro, último acesso, e-mail, ID e quantas indicações cada um já
fez (mesma separação pendente/aceita/quitando dívidas já publicada em `/convite`). Nunca expõe dívidas,
transações ou qualquer dado financeiro de outros usuários — a própria função no banco
(`admin_listar_usuarios()`, `supabase/migrations/20260827000000_admin_global.sql`) só retorna esses
agregados.

A permissão vive numa tabela dedicada (`admin_users`), sem nenhuma policy para `authenticated`/`anon` —
igual ao padrão já usado em `referrals` — e é checada dentro da própria função `security definer`
(`is_admin_global()`), não só no código do app. Para conceder a alguém:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'alguem@metadax.com.br';
```

## Por que self-hosted por padrão

O app foi desenhado para funcionar tanto em nuvem quanto localmente/on-premise, então o código nunca
assume um serviço gerenciado específico: `NEXT_PUBLIC_SUPABASE_URL` pode apontar tanto para um projeto
Supabase Cloud quanto para o gateway do stack self-hosted em `docker/` — o código de acesso a dados
(`src/lib/supabase/*.ts`) é idêntico nos dois casos.
