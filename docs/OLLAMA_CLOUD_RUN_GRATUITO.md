# Servidor de IA local gratuito (Google Cloud Run + Ollama)

Alternativa ao caminho da Oracle Cloud (`docs/OLLAMA_SERVIDOR_GRATUITO.md`)
para quem preferir não administrar uma VM (SSH, firewall, systemd, swap
etc.) ou esbarrou em bloqueio de cota do shape A1. O
[Cloud Run](https://cloud.google.com/run) do Google é uma plataforma de
containers **serverless gerenciada**: você entrega uma imagem Docker com o
Ollama e o modelo já embutidos, e o Google cuida do resto — HTTPS
automático, sem VM pra administrar. A camada **Always Free** do Cloud Run é
permanente (não é trial), com uma cota mensal de 2 milhões de requisições,
360.000 GB-segundos de memória e 180.000 vCPU-segundos — folgada pro uso
pessoal deste app.

Nenhum dado sai da sua infraestrutura: o container roda o Ollama que você
mesmo definiu, com o modelo que você escolheu — o Google só hospeda o
container, igual a Vercel hospeda o Next.js.

**Trade-off a saber**: como o serviço escala a zero quando ninguém usa, a
primeira requisição depois de um tempo parado demora alguns segundos a mais
(o container "acorda"). Pra um app de uso pessoal/baixo volume, é um preço
aceitável.

## 1. Pré-requisitos

- Um projeto no Google Cloud já criado (ex.: `llmmtdx`).
- [Google Cloud Shell](https://cloud.google.com/shell) — o ícone `>_` no
  canto superior direito do console. Ele já vem com `gcloud`, `docker` e
  autenticação prontos, sem precisar instalar nada na sua máquina.

Abra o Cloud Shell e confirme o projeto certo está selecionado:

```bash
gcloud config set project llmmtdx
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Escolher o modelo

O Cloud Run permite bem mais memória que uma VM gratuita comum — dá pra
usar um modelo maior que o `qwen2.5:0.5b` da variante VM de 1GB. Ajuste o
shape do serviço (passo 5) conforme o modelo:

| Modelo | Memória recomendada (`--memory`) | CPU recomendada (`--cpu`) |
|---|---|---|
| `qwen2.5:0.5b` (mais rápido, respostas simples) | `1Gi` | `1` |
| `qwen2.5:3b` / `llama3.2:3b` (padrão sugerido, bom equilíbrio) | `4Gi` | `2` |
| `llama3.1` (8B, melhores respostas, mais lento em CPU) | `8Gi` | `4` |

## 3. Criar os arquivos do stack no Cloud Shell

```bash
mkdir ~/ollama-cloud-run && cd ~/ollama-cloud-run
```

Copie os 3 arquivos de `docker/ollama-cloud-run/` deste repositório
(`Dockerfile`, `Caddyfile`, `entrypoint.sh`) — no Cloud Shell, use `nano
<arquivo>` e cole o conteúdo de cada um, ou clone o repositório se tiver
acesso via `git clone`.

## 4. Gerar o hash da senha

Escolha uma senha forte e gere o hash bcrypt (funciona no Cloud Shell, que
já tem Docker):

```bash
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'escolha-uma-senha-forte'
```

Guarde o resultado (começa com `$2a$...`) — vai usar no deploy.

## 5. Build + push da imagem

Substitua `qwen2.5:3b` pelo modelo escolhido no passo 2. O registro usado
aqui é o **Artifact Registry** (`*-docker.pkg.dev`) — o antigo `gcr.io`
(Container Registry) está sendo descontinuado pelo Google e pode falhar
com erro de conexão:

```bash
cd ~/ollama-cloud-run

gcloud artifacts repositories create ollama-repo \
  --repository-format=docker \
  --location=southamerica-east1 \
  --description="Imagens do servidor Ollama"

docker build --build-arg OLLAMA_MODEL=qwen2.5:3b \
  -t southamerica-east1-docker.pkg.dev/llmmtdx/ollama-repo/ollama-servidor .

docker push southamerica-east1-docker.pkg.dev/llmmtdx/ollama-repo/ollama-servidor
```

Troque `llmmtdx` pelo ID do seu projeto se for diferente. O build baixa o
modelo escolhido durante o processo — pode levar vários minutos
dependendo do tamanho do modelo, é esperado.

## 6. Deploy

```bash
gcloud run deploy ollama-servidor \
  --image southamerica-east1-docker.pkg.dev/llmmtdx/ollama-repo/ollama-servidor \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars 'BASIC_AUTH_USER=creditix,BASIC_AUTH_HASH=$2a$...cole_o_hash_aqui...,OLLAMA_MODEL=qwen2.5:3b'
```

Notas:
- `--region southamerica-east1` (São Paulo) — mesma região do projeto
  Supabase, reduz latência. Pode trocar por qualquer região do Cloud Run.
- `--max-instances 1` evita escalar além de 1 réplica (mantém o uso
  previsível dentro do Always Free).
- Use **aspas simples** no `--set-env-vars` (não duplas) — o hash bcrypt
  tem `$` no meio, e dentro de aspas duplas o shell tentaria expandir
  isso como variável, corrompendo o valor.

Ao final, o comando imprime a **URL do serviço** — algo como
`https://ollama-servidor-xxxxxxxxxx-rj.a.run.app`. É essa URL que vai
para o `OLLAMA_HOST` da Vercel.

### Se `--allow-unauthenticated` falhar com erro de política da organização

Contas Google Workspace corporativas costumam ter a política **"Domain
Restricted Sharing"** ativada, que bloqueia tornar qualquer recurso
público (erro: `FAILED_PRECONDITION: One or more users named in the
policy do not belong to a permitted customer`). Isso é intencional — é
uma proteção contra deixar serviços públicos sem querer — e normalmente
só quem tem a role **Organization Policy Administrator** no nível da
**Organização** (não do projeto) consegue abrir uma exceção, em **IAM e
administrador → Políticas da organização** (com o seletor de projeto
trocado pra Organização) → `iam.allowedPolicyMemberDomains`.

Se essa política não puder ser alterada, o serviço precisa ficar privado
e a Vercel se autentica com uma conta de serviço em vez de Basic Auth:

```bash
gcloud iam service-accounts create vercel-ollama-invoker \
  --display-name="Vercel Ollama Invoker"

gcloud run services add-iam-policy-binding ollama-servidor \
  --region=southamerica-east1 \
  --member="serviceAccount:vercel-ollama-invoker@llmmtdx.iam.gserviceaccount.com" \
  --role=roles/run.invoker

gcloud iam service-accounts keys create ~/vercel-ollama-key.json \
  --iam-account=vercel-ollama-invoker@llmmtdx.iam.gserviceaccount.com
cat ~/vercel-ollama-key.json
```

Guarde a saída do `cat` (um JSON) — é uma credencial sensível, vai virar
a variável `OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON` na Vercel (passo 8). Nesse
caso, repita o deploy do passo 6 **sem** `--allow-unauthenticated` e sem
as variáveis `BASIC_AUTH_*` (não são usadas nesse modo).

**Se a criação da chave também falhar** com
`constraints/iam.disableServiceAccountKeyCreation` (outra política comum
de organizações corporativas, que bloqueia chaves JSON exportáveis por
segurança): mesmo caminho — precisa de alguém com acesso de
administrador da organização pra abrir uma exceção pra esse projeto em
**Políticas da organização**, ou configurar Workload Identity Federation
(sem nenhuma chave estática) como alternativa mais robusta, fora do
escopo deste guia.

## 7. Testar

Se o serviço ficou **público** (Basic Auth):
```bash
curl -u creditix:escolha-uma-senha-forte https://ollama-servidor-xxxxxxxxxx-rj.a.run.app/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Diga oi em uma palavra","stream":false}'
```

Se o serviço ficou **privado** (conta de serviço), teste de dentro do
Cloud Shell usando sua própria identidade (só pra confirmar que o
serviço responde — a Vercel vai usar a conta de serviço, não a sua):
```bash
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://ollama-servidor-xxxxxxxxxx-rj.a.run.app/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Diga oi em uma palavra","stream":false}'
```

A primeira chamada depois de um tempo sem uso pode demorar alguns segundos
(cold start) — é esperado.

## 8. Configurar a Vercel

No painel do projeto na Vercel (Settings → Environment Variables),
adicione, em qualquer um dos dois casos:

| Variável | Valor |
|---|---|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_HOST` | a URL do Cloud Run (passo 6) |
| `OLLAMA_MODEL` | o modelo que você baixou (ex.: `qwen2.5:3b`) |

E, dependendo de como o serviço ficou configurado:

**Serviço público (Basic Auth):**

| Variável | Valor |
|---|---|
| `OLLAMA_BASIC_AUTH_USER` | `creditix` (ou o que você usou) |
| `OLLAMA_BASIC_AUTH_PASSWORD` | a senha em texto puro (a mesma do `caddy hash-password`) |

**Serviço privado (conta de serviço):**

| Variável | Valor |
|---|---|
| `OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON` | o conteúdo do `vercel-ollama-key.json`, colado inteiro numa linha só |

Redeploy o projeto para as variáveis novas valerem. Chat e análise por IA
passam a rodar no seu container no Cloud Run — nenhum dado sai pra
terceiros.

## Atualizando o modelo depois

Repita os passos 5-6 com um `OLLAMA_MODEL` diferente (o Cloud Run cria
uma nova revisão automaticamente) e atualize `OLLAMA_MODEL` na Vercel.
