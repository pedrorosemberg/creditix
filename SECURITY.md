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
- **Rate limiting:** login, cadastro, recuperação de senha, link mágico, troca de e-mail/senha, chat e
  geração de análise por IA têm limite de tentativas por IP/usuário (`src/lib/security/rate-limit.ts`).
  Usa Upstash Redis (contador compartilhado entre instâncias, plano gratuito) quando
  `UPSTASH_REDIS_REST_URL`/`TOKEN` estão configurados; sem isso, cai para um contador em memória do
  processo — suficiente em self-host de instância única, mas não confiável na Vercel sob carga real com
  várias instâncias serverless concorrentes. Ver [`docs/AUTENTICACAO.md`](./docs/AUTENTICACAO.md).
- **CAPTCHA no login (Cloudflare Turnstile):** opcional, desligado por padrão. Quando
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está configurada (e o Supabase habilitado com a secret
  correspondente), `/login` exige um token Turnstile válido antes de tentar autenticar — protege
  contra força bruta/scripts automatizados no login com senha. Não cobre cadastro, recuperação de
  senha ou link mágico (usam a Admin API do Supabase, fora do alcance desse captcha). Ver
  [`docs/AUTENTICACAO.md`](./docs/AUTENTICACAO.md#captcha-no-login-cloudflare-turnstile-opcional).
- **Cabeçalhos de segurança:** CSP (incluindo `object-src 'none'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none` e HSTS configurados em `next.config.ts` para todas as rotas.
- **Sem indexação:** `robots: { index: false, follow: false }` no layout raiz — é um produto privado, não
  um site público.
- **Cron protegido por segredo:** a rota de lembretes mensais (`/api/cron/lembretes`) exige
  `Authorization: Bearer <CRON_SECRET>`, não sessão de usuário — evite expor esse endpoint sem o segredo.
- **Sem segredos no repositório:** `.env*` está no `.gitignore` (exceto `.env.example`, que não contém
  valores reais). Segredos de produção/homologação vivem exclusivamente nas variáveis de ambiente do
  provedor de deploy (Vercel) ou no `docker/.env` local (também ignorado pelo git). O gitleaks roda em
  toda promoção (`.github/workflows/test-suite.yml`) como uma segunda camada.
- **Lógica de negócio nunca vaza para o bundle do cliente:** `scripts/verificar-segredo-negocio.mjs` roda
  em toda build de CI e falha se os prompts de guardrail da IA (`src/lib/ai/chat.ts`) ou textos do motor
  de análise de dívidas aparecerem no JS enviado ao navegador — regressão automática caso algum Client
  Component passe a importar esses módulos por engano.
- **Painel admin_global sem acesso a dados financeiros:** `/admin` (restrito a quem está na tabela
  `admin_users`) só expõe dados agregados de conta (e-mail, data de cadastro, contagem de indicações) —
  nunca dívidas, transações ou qualquer valor financeiro de outros usuários. A checagem de permissão mora
  no próprio banco (`is_admin_global()`, `security definer`), não só no código do app — ver
  `docs/ARCHITECTURE.md#papel-admin_global`.
- **Observabilidade sem PII:** Vercel Analytics e o Grafana Faro (opcional) coletam só métricas agregadas
  de navegação, performance e erros — nunca e-mail, nome ou dado financeiro. Ver
  `docs/OBSERVABILIDADE.md`.

## Autenticação

Autenticação via Supabase Auth (GoTrue) com cookies HTTP-only gerenciados por `@supabase/ssr`. O
middleware (`src/proxy.ts`) renova a sessão a cada requisição e bloqueia acesso a rotas autenticadas sem
sessão válida. Detalhes do fluxo completo (cadastro, login, recuperação de senha, link mágico, o motivo de
`/auth/confirmar` existir) em [`docs/AUTENTICACAO.md`](./docs/AUTENTICACAO.md).

## O que sabemos que falta (próximos passos de segurança)

- **Proteção contra senha vazada (HaveIBeenPwned)**: recurso nativo do Supabase Auth, mas exige plano
  Pro ou superior — o projeto está no plano gratuito. Reavaliar se/quando fizer upgrade.
  ([docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection))
- **CAPTCHA no cadastro/recuperação de senha/link mágico**: esses fluxos usam a Admin API do
  Supabase (`admin.generateLink()`), que não passa pelo captcha nativo do GoTrue — hoje mitigados só
  por rate limiting por IP. Ver `docs/AUTENTICACAO.md#próximos-passos`.
- **CSP com nonce em vez de `'unsafe-inline'`** no `script-src`: reduziria a superfície de XSS, mas exige
  gerar e propagar um nonce por requisição (mudança maior, com risco real de quebrar alguma página se não
  for testada com cuidado) — não fiz essa troca sem validação em ambiente real primeiro.
- **MFA (TOTP)** para login: suportado pelo Supabase Auth no plano gratuito, mas exige uma tela de
  enrolamento/verificação nova — ainda não construída.
- **DMARC em modo `reject`** no domínio de envio de e-mail (`creditix.metadax.com.br`): configuração de
  DNS, fora deste repositório — confirme com quem administra o DNS da METADAX.

## Responsabilidade em ambientes self-hosted

Se você rodar o stack self-hosted (`docker/`), a segurança do ambiente também depende de você:

- Gere segredos únicos com `scripts/generate-jwt-keys.mjs` — nunca reutilize os valores de exemplo.
- Coloque um proxy HTTPS (Caddy/Nginx com Let's Encrypt, ou um balanceador gerenciado) na frente do
  gateway e da aplicação antes de expor a instância na internet.
- Mantenha as imagens Docker atualizadas (`docker compose pull`).
- Faça backup regular do volume `db-data`.

## Análise por IA local embutida (self-hosted — não funciona na Vercel)

O provedor local (padrão quando `AI_PROVIDER` não está definido) roda um
modelo pequeno (ONNX, via `@huggingface/transformers`) dentro do próprio
processo do servidor, sem enviar dados a nenhuma API externa. Os pesos do
modelo (arquivos públicos, sem nenhuma informação de usuário) são baixados
uma única vez durante o **build** (`scripts/baixar-modelo-ia.mjs`, hook
`prebuild`) e ficam junto do próprio deploy — em runtime o provedor lê
apenas arquivos locais (`env.allowRemoteModels = false`); nenhuma chamada
de rede acontece ao processar uma análise ou mensagem de chat.

**Confirmado em produção que isso NÃO funciona no ambiente serverless da
Vercel**: o binário nativo do onnxruntime-node falha com
`libonnxruntime.so.1: cannot open shared object file` — depende de
bibliotecas do sistema que a Vercel não disponibiliza, mesmo forçando o
binário a ir junto do deploy. Funciona normalmente em self-hosted (Docker,
servidor próprio, disco/OS completos). Para deploys na Vercel, use
`AI_PROVIDER=ollama` com um servidor Ollama próprio — ver
`docs/OLLAMA_SERVIDOR_GRATUITO.md` para subir um de graça na Oracle Cloud.
Por decisão de produto, o Gemini (API do Google) fica desativado por
padrão pelo mesmo motivo de privacidade — só é usado se alguém configurar
`AI_PROVIDER=gemini` de propósito.

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
