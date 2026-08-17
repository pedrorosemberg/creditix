# Política de segurança — Creditix

O Creditix lida com dados financeiros sensíveis (dívidas, renda, gastos). Este documento resume as
proteções implementadas e como reportar problemas de segurança.

## Reportando vulnerabilidades

Não abra uma issue pública para vulnerabilidades. Envie um e-mail para **contato@metadax.com.br** com
detalhes e passos de reprodução. Responderemos o mais rápido possível.

## Modelo de proteção de dados

- **Isolamento por usuário (RLS):** toda tabela de negócio no Postgres tem Row Level Security habilitada
  com política `auth.uid() = user_id`. Nenhuma linha de um usuário é visível a outro, mesmo em caso de bug
  de aplicação — a garantia vive no banco, não só no código.
- **Nenhum acesso anônimo:** nenhuma tabela concede privilégios ao role `anon`. Todo acesso exige uma
  sessão autenticada (`authenticated`) ou a service role (uso restrito a rotinas de sistema server-side).
- **Service role nunca chega ao cliente:** `SUPABASE_SERVICE_ROLE_KEY` só é lida em módulos marcados
  `import "server-only"` (`src/lib/supabase/admin.ts`), que quebram o build se importados por engano em
  código client-side.
- **IA e cálculos sempre server-side:** toda análise (motor de juros, plano de recuperação, chamadas a
  Ollama/Gemini) roda em Server Components, Server Actions ou Route Handlers — nunca no navegador.
- **Validação de entrada:** toda mutação passa por schemas `zod` (`src/lib/security/validation.ts`) antes
  de tocar o banco, independentemente do que o formulário no cliente permita.
- **Rate limiting:** login, cadastro e geração de análise por IA têm limite de tentativas por
  IP/usuário (`src/lib/security/rate-limit.ts`) para reduzir força bruta e abuso de custo de IA.
- **Cabeçalhos de segurança:** CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy` e HSTS configurados em `next.config.ts` para todas as rotas.
- **Sem indexação:** `robots: { index: false, follow: false }` no layout raiz — é um produto privado, não
  um site público.
- **Cron protegido por segredo:** a rota de lembretes mensais (`/api/cron/lembretes`) exige
  `Authorization: Bearer <CRON_SECRET>`, não sessão de usuário — evite expor esse endpoint sem o segredo.
- **Sem segredos no repositório:** `.env*` está no `.gitignore` (exceto `.env.example`, que não contém
  valores reais). Segredos de produção/homologação vivem exclusivamente nas variáveis de ambiente do
  provedor de deploy (Vercel) ou no `docker/.env` local (também ignorado pelo git).

## Autenticação

Autenticação via Supabase Auth (GoTrue) com cookies HTTP-only gerenciados por `@supabase/ssr`. O
middleware (`src/proxy.ts`) renova a sessão a cada requisição e bloqueia acesso a rotas autenticadas sem
sessão válida.

## Responsabilidade em ambientes self-hosted

Se você rodar o stack self-hosted (`docker/`), a segurança do ambiente também depende de você:

- Gere segredos únicos com `scripts/generate-jwt-keys.mjs` — nunca reutilize os valores de exemplo.
- Coloque um proxy HTTPS (Caddy/Nginx com Let's Encrypt, ou um balanceador gerenciado) na frente do
  gateway e da aplicação antes de expor a instância na internet.
- Mantenha as imagens Docker atualizadas (`docker compose pull`).
- Faça backup regular do volume `db-data`.

## Conformidade

O Creditix foi desenhado considerando os princípios da LGPD (Lei 13.709/2018): minimização de dados,
finalidade específica (organização financeira pessoal), e controle do titular sobre seus próprios dados
(exclusão de dívidas/conta remove os dados correspondentes, via `ON DELETE CASCADE`).
