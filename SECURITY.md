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

## Análise por IA local embutida (padrão)

O provedor local (padrão quando `AI_PROVIDER` não está definido) roda um
modelo pequeno (ONNX, via `@huggingface/transformers`) dentro do próprio
processo do servidor, sem enviar dados a nenhuma API externa. Os pesos do
modelo (arquivos públicos, sem nenhuma informação de usuário) são baixados
uma única vez durante o **build** (`scripts/baixar-modelo-ia.mjs`, hook
`prebuild`) e ficam junto do próprio deploy — em runtime o provedor lê
apenas arquivos locais (`env.allowRemoteModels = false`); nenhuma chamada
de rede acontece ao processar uma análise ou mensagem de chat. Por decisão
de produto, o Gemini (API do Google) fica desativado por padrão pelo mesmo
motivo — só é usado se alguém configurar `AI_PROVIDER=gemini` de propósito.

O download desses pesos no build funciona sem nenhum token. Opcionalmente,
`HF_TOKEN` (gratuito, só leitura, gerado em huggingface.co/settings/tokens)
pode ser configurado para reduzir o risco de rate limit anônimo em builds
muito frequentes. Esse token, se usado, só autentica o download de pesos
públicos do modelo durante o build; nenhum dado de usuário é enviado à
Hugging Face em nenhum momento, nem em build nem em runtime.

Essa dependência traz duas vulnerabilidades conhecidas, sem correção
disponível no momento, em pacotes transitivos do `onnxruntime-node`:

- `adm-zip` (GHSA-xcpc-8h2w-3j85): alocação excessiva de memória ao abrir
  um ZIP malicioso.
- `sharp`/libvips (GHSA-f88m-g3jw-g9cj): vulnerabilidades de processamento
  de imagem.

Nenhum dos dois caminhos é exercitado pelo Creditix — usamos apenas o
pipeline de geração de texto, nunca extração de ZIP arbitrário nem
processamento de imagem. Por isso o gate de CI (`security-load-gate.yml`)
usa `npm audit --audit-level=critical` em vez de `high` só para este
projeto. Revise essa decisão se o uso do modelo local mudar (ex.: passar a
processar imagens enviadas por usuários).

Em ambientes serverless (Vercel), esse provedor é best-effort: o disco
(`/tmp`) não é garantido entre execuções, então o modelo pode ser baixado
novamente a cada cold start, e funções serverless têm limites de tempo e
memória que um modelo maior pode não caber. Se a geração falhar por
qualquer motivo, a análise por IA simplesmente retorna erro — o restante
do site não é afetado.

## Conformidade

O Creditix foi desenhado considerando os princípios da LGPD (Lei 13.709/2018): minimização de dados,
finalidade específica (organização financeira pessoal), e controle do titular sobre seus próprios dados
(exclusão de dívidas/conta remove os dados correspondentes, via `ON DELETE CASCADE`).
