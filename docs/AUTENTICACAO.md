# Autenticação

Este documento descreve o fluxo completo de autenticação do Creditix: como cada tipo de link é gerado e
confirmado, por que existe uma página própria (`/auth/confirmar`) em vez de usar o link hospedado pelo
Supabase, e o que falta implementar.

## Visão geral

Autenticação é feita pelo Supabase Auth (GoTrue), mas **nenhum e-mail de autenticação é enviado pelo
mailer embutido do Supabase** — todos são compostos por este app (`src/lib/email/auth-emails.ts`) e
enviados via Resend, para manter remetente e visual consistentes e, principalmente, para controlar
exatamente qual URL vai no link (ver seção seguinte).

Existem quatro fluxos, todos passando pelo mesmo mecanismo:

| Fluxo | Trigger | `type` do Supabase | Server Action |
|---|---|---|---|
| Confirmação de cadastro | `/cadastro` | `signup` | `signupAction` |
| Redefinição de senha | `/recuperar-senha` | `recovery` | `solicitarRecuperacaoSenhaAction` |
| Link mágico (entrar sem senha) | `/login` → "Entrar sem senha" | `magiclink` | `solicitarLinkMagicoAction` |
| Troca de e-mail | `/configuracoes` | `email_change_current` / `email_change_new` | ver `configuracoes/actions.ts` |

## O bug que motivou o `/auth/confirmar` (2026-08)

**Sintoma real**: um usuário se cadastrou, recebeu o e-mail de confirmação, clicou no link e viu "Não foi
possível confirmar o link. Ele pode ter expirado — solicite um novo." Mas, ao tentar fazer login com a
senha recém-criada, funcionou — a conta já estava confirmada.

**Causa raiz**: o link de confirmação apontava direto para o endpoint hospedado pelo Supabase
(`<projeto>.supabase.co/auth/v1/verify?token=...&type=signup`), que confirma o token com um simples `GET`
— sem nenhuma interação do usuário. Scanners de segurança de e-mail (Microsoft Safe Links, o próprio
Gmail, gateways corporativos) **pré-visitam automaticamente todo link de um e-mail antes do usuário**, pra
checar se é malicioso. Como o token de confirmação é de uso único, essa pré-visita do scanner consumia o
token — a conta ficava confirmada (o `GET` do scanner funcionou), mas o clique real do usuário, minutos
depois, caía num token já gasto.

**Correção** (`src/lib/supabase/auth-links.ts` + `src/app/auth/confirmar/`):

1. Em vez de enviar o `action_link` que o Supabase gera (que aponta pro endpoint deles), extraímos o
   `hashed_token` da resposta de `admin.generateLink()` e montamos nosso próprio link:
   `https://creditix.metadax.com.br/auth/confirmar?token_hash=...&type=...&next=...`.
2. `/auth/confirmar` é uma página que **não confirma nada no carregamento** — só mostra um botão. A
   confirmação de verdade (`supabase.auth.verifyOtp({ token_hash, type })`) só acontece dentro da Server
   Action acionada pelo `submit` desse formulário, ou seja, um `POST` real.
3. Scanners de segurança fazem `GET` (carregam a página, no máximo), mas não submetem formulários — o
   token sobrevive intacto até o clique humano de verdade.

Isso vale pros quatro fluxos da tabela acima — todos passam pelo mesmo `/auth/confirmar`.

### Prevenção de redirect aberto

O parâmetro `next` (pra onde ir depois de confirmar) é validado com uma regex (`^\/(?!\/)`) que só aceita
caminhos internos começando com uma única barra — nunca uma URL absoluta nem `//host` (que o navegador
trataria como protocol-relative pra outro domínio).

## Rate limiting

Todo fluxo que aceita input não autenticado (login, cadastro, recuperação de senha, link mágico) passa por
`checarLimite()` (`src/lib/security/rate-limit.ts`) antes de qualquer chamada ao Supabase. Ver
[`SECURITY.md`](../SECURITY.md) para os limites exatos e a diferença entre o modo com Upstash Redis
(recomendado em produção) e o fallback em memória.

## CAPTCHA no login (Cloudflare Turnstile, opcional)

Implementado, mas desligado por padrão até você configurar as chaves — sem elas, nada muda no
comportamento atual.

**Escopo real da proteção**: o Supabase Auth só valida `captchaToken` nas chamadas client-facing do
GoTrue (`signInWithPassword`, `signUp`, `resetPasswordForEmail`). Neste app, cadastro
(`signupAction`), recuperação de senha e link mágico usam `gerarLinkAuth()` →
`admin.generateLink()` — API de service role, autenticada por secret, chamada server-to-server — que
**não passa pelo CAPTCHA do Supabase de qualquer forma**. Por isso o widget só foi adicionado ao
formulário de login com senha (`/login`), que é o único fluxo onde ele de fato adiciona uma camada
extra de proteção contra força bruta/scripts automatizados.

Passo a passo para ativar:

1. Crie um widget em [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
   (grátis) e copie a **Site Key** e a **Secret Key**.
2. No painel do Supabase do projeto: **Authentication → Attack Protection → Enable Captcha
   protection**, selecione Turnstile e cole a **Secret Key** ali (nunca neste repositório).
3. Defina `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (a Site Key, pública) nas variáveis de ambiente do
   deploy (Vercel ou `.env.local`) — ver `.env.example`. Com a variável definida, o widget passa a
   renderizar automaticamente em `/login` (`src/components/ui/turnstile-widget.tsx`) e
   `loginAction` (`src/app/(auth)/actions.ts`) passa a enviar o token via
   `options.captchaToken` para `signInWithPassword`.
4. A CSP (`next.config.ts`) já libera `https://challenges.cloudflare.com` em `script-src`/`frame-src`
   automaticamente quando a variável está definida — nenhum ajuste manual necessário.

## Programa de indicação e o cadastro

Um cadastro pode carregar `?ref=CODIGO` (o código de indicação de quem convidou, ver `/convite`). Isso
**não afeta a criação da conta** — é tratado como uma etapa best-effort, totalmente separada e sempre
dentro de seu próprio `try/catch` (`registrarIndicacaoPendente`, em `src/lib/supabase/referrals.ts`): se o
código for inválido ou a escrita falhar por qualquer motivo, o cadastro continua normalmente, só não fica
registrada nenhuma indicação. Ver `docs/ARCHITECTURE.md` ou o código-fonte para o desenho completo da
tabela `referrals` e da função `minhas_indicacoes()`.

## Próximos passos

Itens de segurança relacionados a autenticação que identificamos mas não implementamos, com o motivo:

- **CAPTCHA no cadastro/recuperação de senha/link mágico** — como esses três fluxos usam
  `admin.generateLink()` (service role), o CAPTCHA nativo do Supabase não os protege de qualquer
  forma (ver seção acima). Mitigação real hoje: rate limiting por IP em cada um deles. Uma
  mitigação adicional seria um CAPTCHA validado manualmente no código antes de chamar
  `gerarLinkAuth()` (verificando o token direto na API do Turnstile, sem depender do Supabase) —
  não implementado ainda.
- **Proteção contra senha vazada (HaveIBeenPwned)** — recurso nativo do Supabase Auth
  (**Authentication → Policies → Password**), mas exige plano Pro ou superior; tentamos habilitar e o
  próprio painel bloqueou com essa mensagem. Reavaliar se/quando o projeto migrar de plano.
- **MFA (TOTP)** — suportado pelo Supabase Auth no plano gratuito; falta a tela de enrolamento/verificação
  no app.
