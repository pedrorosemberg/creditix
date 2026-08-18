# Ambientes e fluxo de promoção

O Creditix usa três branches de longa duração, cada uma mapeada a um ambiente:

| Branch | Ambiente | Propósito |
|---|---|---|
| `dev` | Desenvolvimento | Branch principal de trabalho. Toda feature nasce aqui (via PR de uma branch de feature). |
| `hmg` | Homologação | Testes de carga, segurança e validação de features antes de produção. |
| `prod` | Produção | `creditix.metadax.com.br`, disponível para todos os usuários. |

O código só avança `dev → hmg → prod` através de Pull Requests, nunca por push direto. Isso é reforçado
em dois níveis:

1. **Proteção de branch no GitHub** (bloqueia o merge até os checks passarem).
2. **Workflows de CI** (`.github/workflows/ci.yml` e `security-load-gate.yml`), que são os checks
   exigidos.

## Configurando a proteção de branch (uma vez, manualmente)

No GitHub: **Settings → Branches → Add branch protection rule**, para `hmg` e para `prod`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - `hmg`: exigir o check `lint-typecheck-test-build` (do workflow `CI`)
  - `prod`: exigir `lint-typecheck-test-build` **e** `security-scan` (do workflow
    `Security & Load Gate`) — o job `load-test` fica condicional (só roda se `HMG_BASE_URL` estiver
    configurado como secret/variável do repositório) e não deveria ser marcado obrigatório até você
    validar que o k6 real está funcionando no seu ambiente.
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings (inclusive para admins, se possível no seu plano)

Isso garante, na prática, a regra pedida: **só transborda de `dev` para `hmg`, ou de `hmg` para `prod`,
se todos os testes obrigatórios daquele destino estiverem verdes.**

## Como promover

Use o workflow manual **"Promover ambiente"** (aba Actions → Promover ambiente → Run workflow,
escolhendo `hmg` ou `prod` como destino) para abrir a PR de promoção automaticamente, ou abra a PR
manualmente (`dev` → `hmg`, depois `hmg` → `prod`).

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
