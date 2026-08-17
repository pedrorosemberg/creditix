# Guia de instalação

O Creditix roda em nuvem (Vercel + Supabase Cloud) ou 100% on-premise/local (Docker Compose). Escolha um
caminho abaixo.

## Opção A — Local/on-premise com Docker (recomendado para uso pessoal)

Pré-requisitos: Docker e Docker Compose.

```bash
git clone https://github.com/pedrorosemberg/creditix.git
cd creditix

# 1. Gere os segredos
node scripts/generate-jwt-keys.mjs

# 2. Configure o ambiente Docker
cp docker/.env.example docker/.env
# cole os valores gerados no passo 1 dentro de docker/.env

# 3. Suba o stack completo (Postgres + Auth + REST + gateway + Ollama + app)
cd docker
docker compose up -d --build

# 4. Baixe o modelo de IA local (uma vez)
docker compose exec ollama ollama pull llama3.1
```

A aplicação fica disponível em `http://localhost:3000`. O primeiro cadastro já pode ser feito
imediatamente (por padrão `GOTRUE_MAILER_AUTOCONFIRM=true` no `docker/.env.example`, ou seja, sem
confirmação por e-mail — troque para `false` e configure SMTP antes de expor isso publicamente).

Para expor este ambiente na internet (ex.: em uma VPS), coloque um proxy HTTPS na frente
(`GATEWAY_URL` e `APP_URL` precisam refletir a URL pública real) — veja `SECURITY.md`.

## Opção B — Nuvem (Vercel + Supabase Cloud)

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um projeto existente).
2. Aplique as migrations: `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`
   (ou cole o conteúdo de `supabase/migrations/*.sql`, em ordem, no SQL Editor do painel Supabase).
3. Gere os tipos TypeScript reais (opcional, mas recomendado):
   `npx supabase gen types typescript --linked > src/types/database.types.ts`
4. Copie `.env.example` para `.env.local` e preencha com a URL/chaves do seu projeto Supabase.
5. Configure o Resend (para lembretes) e, opcionalmente, `GEMINI_API_KEY` se quiser usar IA em nuvem em
   vez de Ollama local.
6. `npm install && npm run dev`.
7. Para produção: importe o repositório na Vercel, configure as variáveis de ambiente por Environment
   (Production = branch `prod`; Preview = `dev`/`hmg`) e configure um Cron Job da Vercel (ou externo)
   chamando `GET /api/cron/lembretes` diariamente com o header
   `Authorization: Bearer <CRON_SECRET>`.

## Rodando os testes e checagens localmente

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```

Estas são exatamente as checagens que rodam no CI (`.github/workflows/ci.yml`) — rodá-las localmente
antes de abrir uma PR evita ida e volta.

## Análise por IA

Por padrão (`AI_PROVIDER=ollama`), a análise por IA roda inteiramente local via
[Ollama](https://ollama.com) — nenhum dado da sua dívida sai da sua máquina/servidor. Para usar o Gemini
em vez disso, defina `AI_PROVIDER=gemini` e `GEMINI_API_KEY` nas variáveis de ambiente.
