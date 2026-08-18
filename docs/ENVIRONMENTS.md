# Ambientes e fluxo de promoção

O Creditix usa três branches de longa duração, cada uma mapeada a um ambiente:

| Branch | Ambiente | Propósito |
|---|---|---|
| `dev` | Desenvolvimento | Branch principal de trabalho. Toda feature nasce aqui (via PR de uma branch de feature). |
| `hmg` | Homologação | Testes de carga, segurança e validação de features antes de produção. |
| `prod` | Produção | `creditix.metadax.com.br`, disponível para todos os usuários. |

O código avança `dev → hmg → prod` automaticamente, sempre através de Pull Requests (nunca por push
direto), com merge automático assim que os checks obrigatórios passarem. Isso é reforçado em três níveis:

1. **Proteção de branch no GitHub** (bloqueia o merge até os checks passarem).
2. **Workflows de CI** (`ci.yml` e `test-suite.yml`), que são os checks exigidos.
3. **`promote.yml`**, que abre a PR de promoção e liga auto-merge sozinho — não é preciso clicar em nada
   no caminho feliz.

## Promoção automática — como funciona

1. Você faz merge de uma feature/fix em `dev` normalmente (PR de uma branch de feature).
2. O workflow **CI** roda em `dev`. No último step, se tudo passou, ele mesmo dispara o workflow
   **Promover ambiente** (`gh workflow run promote.yml`) — um disparo explícito de `workflow_dispatch`, não
   um evento push/pull_request, então funciona mesmo vindo do `GITHUB_TOKEN` padrão do próprio CI (a
   restrição do GitHub contra o `GITHUB_TOKEN` disparar outros workflows só vale para eventos
   push/pull_request, não para chamadas explícitas de API como essa). **Promover ambiente** então
   classifica os commits que estão sendo promovidos como `criticidade:feature` ou `criticidade:hotfix` (ver
   seção abaixo), abre a PR `dev → hmg` já com a label certa, e liga auto-merge.
3. O workflow **Test Suite** roda na PR. Quando todos os checks obrigatórios passam (e a branch protection
   permite), o GitHub mergeia a PR sozinho.
4. O merge em `hmg` dispara o deploy de `hmg` e, em seguida, o workflow **CI** roda de novo em `hmg` —
   disparando **Promover ambiente** outra vez (mesmo mecanismo), agora para a PR `hmg → prod`, repetindo o
   ciclo.
5. Depois de cada merge em `hmg` ou `prod`, o workflow **Verificação pós-deploy** espera o deploy
   terminar e confirma que o ambiente resultante está de fato no ar e saudável.

Nada disso exige clique manual no caminho feliz — só intervém se algum check falhar.

## Gate de criticidade/urgência (feature vs. hotfix)

Toda promoção é classificada automaticamente pelo `promote.yml`, olhando as mensagens de commit que estão
sendo promovidos:

- **`criticidade:hotfix`** — só quando **todos** os commits promovidos começam com `fix:` (convenção de
  commits) ou contêm `[hotfix]`/`[emergencial]` na mensagem. Nesse caso, o workflow **Test Suite** pula os
  gates lentos e de validação profunda (`escalabilidade`, `eficiencia`, `funcionalidade-e2e`) — só os
  rápidos e nunca-puláveis continuam obrigatórios: `seguranca` (auditoria de dependências + varredura de
  segredos) e `cloud` (o ambiente de origem está de fato no ar). A ideia é que uma correção urgente não
  fique represada esperando um teste de carga de vários minutos, mas nunca pule segurança.
- **`criticidade:feature`** — qualquer outra combinação (inclusive um único commit de feature misturado com
  correções). Passa pela suíte completa, incluindo:
  - `escalabilidade`: teste de carga real (k6) contra o ambiente de origem.
  - `eficiencia`: Lighthouse contra o ambiente de origem, com piso de pontuação de performance.
  - `funcionalidade-e2e`: smoke tests Playwright contra o ambiente de origem (login, cadastro, proteção de
    rota autenticada, cabeçalhos de segurança realmente entregues pelo navegador).

Se quem revisar discordar da classificação automática, pode trocar a label na PR manualmente antes do
merge — mas isso não reexecuta o Test Suite automaticamente (ver limitação abaixo); force um novo run
empurrando um commit vazio (`git commit --allow-empty -m "reclassificar" && git push`) se precisar que a
suíte completa rode de fato.

## Configurando a promoção automática (uma vez, manualmente)

**Status atual desta instância:** `PROMOTE_PAT`, `DEV_BASE_URL`, `HMG_BASE_URL` e `PROD_BASE_URL` já estão
configurados — a promoção dev→hmg→prod roda de ponta a ponta sem intervenção manual. `NEXT_PUBLIC_GRAFANA_FARO_URL`
(observabilidade opcional, ver `docs/OBSERVABILIDADE.md`) ainda não foi configurada — sem ela, o app
funciona normalmente, só sem o Grafana Faro.

### 1. Crie o secret `PROMOTE_PAT`

O GitHub não dispara outros workflows a partir de um push/PR feito com o `GITHUB_TOKEN` padrão de um
workflow (proteção contra loops infinitos) — por isso `promote.yml` precisa de um token de verdade para
que a PR que ele abre e o merge que ele faz disparem o `Test Suite` e o deploy normalmente.

1. Crie um **fine-grained Personal Access Token** em
   [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta):
   - **Repository access**: só `pedrorosemberg/creditix`.
   - **Permissions**: `Contents` (Read and write), `Pull requests` (Read and write), `Issues` (Read and
     write — **necessário mesmo só usando PRs**: o GitHub gerencia labels pela API de Issues, não de Pull
     Requests, mesmo quando o label é aplicado numa PR; sem essa permissão, `gh label create`/`gh pr edit
     --add-label` falham com "HTTP 403: Resource not accessible by personal access token" — confirmado na
     primeira execução real da esteira), `Metadata` (Read-only).
   - Prazo de expiração: defina um lembrete para renovar (ou o mais longo permitido pela sua organização).
2. **Settings → Secrets and variables → Actions → New repository secret**: nome `PROMOTE_PAT`, valor o
   token gerado.

### 2. Habilite "Allow auto-merge" no repositório

**Settings → General → Pull Requests → Allow auto-merge**. Sem isso, `gh pr merge --auto` falha
silenciosamente (a PR fica esperando para sempre).

### 3. Proteção de branch (`hmg` e `prod`)

**Settings → Branches → Add branch protection rule**:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging:
  - `hmg`: `lint-typecheck-test-build` (workflow **CI**) + `seguranca` + `cloud` (workflow **Test Suite**)
  - `prod`: os mesmos, mais — depois que você validar `HMG_BASE_URL` funcionando de verdade —
    `escalabilidade`, `eficiencia` e `funcionalidade-e2e`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings (inclusive para admins, se possível no seu plano)

### 4. (Opcional, mas recomendado) URLs dos ambientes para os testes contra o ambiente vivo

Sem essas variáveis, os jobs `cloud`, `escalabilidade`, `eficiencia` e `funcionalidade-e2e` são pulados
(o workflow avisa e não falha) — a suíte roda só com os gates estáticos (lint, typecheck, testes
unitários, build, auditoria de dependências, segredos). Configure em **Settings → Secrets and variables →
Actions → Variables** (não precisam ser secret, são só URLs):

- `DEV_BASE_URL`: preview de `dev` (ex.: `https://dev.creditix.metadax.com.br`) — testado antes de
  promover para `hmg`.
- `HMG_BASE_URL`: ambiente de homologação (ex.: `https://hmg.creditix.metadax.com.br`) — testado antes de
  promover para `prod`, e de novo depois do deploy em `hmg` (verificação pós-deploy).
- `PROD_BASE_URL`: produção (`https://creditix.metadax.com.br`) — usado só pela verificação pós-deploy
  (depois que o merge em `prod` já aconteceu).

## Promoção manual (se precisar)

Ainda é possível disparar manualmente: aba **Actions → Promover ambiente → Run workflow**, escolhendo
`hmg` ou `prod` como destino. Útil para promover fora do fluxo normal (ex.: `hmg` recebeu um commit direto
que precisa ir pra `prod`, ou você quer forçar uma reclassificação).

## Variáveis por ambiente

Cada ambiente (dev/hmg/prod) tem seu próprio conjunto de variáveis de ambiente — nunca compartilhe a
mesma instância Supabase/Ollama/Resend entre ambientes. Na Vercel, isso é feito atribuindo cada branch a
um Environment (Preview para `dev`/`hmg`, Production para `prod`) com suas próprias env vars. Veja
`.env.example` para a lista completa de variáveis e `docs/SETUP.md` para o passo a passo.

### Banco de dados por ambiente (situação atual)

- **`prod`**: projeto Supabase Cloud oficial `creditix` (org METADAX LTDA, região `sa-east-1`).
  URL/chaves ficam apenas nas env vars da Vercel (Production), nunca no repositório.
- **`dev`/`hmg`**: recomendado usar o stack self-hosted (`docker/`) enquanto a organização Supabase
  estiver no plano free — o limite é de 2 projetos ativos simultâneos por administrador, e criar mais um
  projeto hospedado para `dev`/`hmg` exigiria pausar outro projeto da conta ou fazer upgrade de plano.
  Quando isso deixar de ser um limitador, o ideal é cada ambiente ter seu próprio projeto Supabase
  hospedado, isolado dos demais.

## Domínio de produção

`prod` deve ser o único ambiente apontado por `creditix.metadax.com.br`. `dev` e `hmg` devem usar
subdomínios/URLs de preview separados (ex.: `dev.creditix.metadax.com.br`, `hmg.creditix.metadax.com.br`)
para nunca haver ambiguidade sobre qual ambiente um usuário está acessando.

## Próximos passos (o que a esteira ainda não cobre)

- **Checagem de deploy via API do provedor** (ex.: Vercel): hoje o job `cloud` só confirma que a URL
  configurada responde 2xx com os cabeçalhos de segurança esperados — não confirma via API que o deploy
  específico daquele commit terminou com sucesso (exigiria `VERCEL_TOKEN` + IDs de projeto/time como
  secrets adicionais). A verificação pós-deploy com espera fixa (90s) é uma aproximação razoável, não uma
  garantia.
- **Piso de performance do Lighthouse mais exigente**: começou conservador (0.5) por falta de uma série
  histórica real contra `hmg`/`prod` — suba `LIGHTHOUSE_MIN_PERFORMANCE` depois de observar algumas
  execuções.
- **Testes E2E autenticados**: os smoke tests Playwright hoje só cobrem rotas públicas (login, cadastro,
  redirecionamento) porque não há uma conta de teste dedicada configurada — criar uma e passar as
  credenciais via secret ampliaria a cobertura para o dashboard, dívidas, etc.
