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

## Acesso: sempre privado, via IAM (não Basic Auth)

Diferente da variante VM (que usa Basic Auth atrás de um Caddy), aqui o
serviço fica **sempre privado** (sem `--allow-unauthenticated`) e o
controle de acesso é feito pelo próprio Cloud Run via IAM: só uma conta
de serviço do Google com o papel `roles/run.invoker` consegue chamá-lo.
A Vercel se autentica com essa conta de serviço, buscando um ID token do
Google assinado especificamente pra URL do serviço a cada chamada (já
implementado em `src/lib/ai/ollama.ts` via `OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON`).

Duas vantagens sobre tentar deixar o serviço público:
- Contas Google Workspace corporativas costumam ter a política **"Domain
  Restricted Sharing"** ativada, que bloqueia tornar qualquer recurso
  público — deixar privado evita essa barreira de propósito.
- É o padrão que o próprio Google recomenda pra proteger um serviço
  Cloud Run — mais robusto que Basic Auth por cima.

## 1. Pré-requisitos

- Um projeto no Google Cloud já criado — troque `SEU_PROJETO_GCP` pelo ID real do seu projeto em todos os comandos abaixo.
- [Google Cloud Shell](https://cloud.google.com/shell) — o ícone `>_` no
  canto superior direito do console. Ele já vem com `gcloud`, `docker` e
  autenticação prontos, sem precisar instalar nada na sua máquina.

Abra o Cloud Shell e confirme o projeto certo está selecionado:

```bash
gcloud config set project SEU_PROJETO_GCP
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Escolher o modelo

O Cloud Run permite bem mais memória que uma VM gratuita comum — dá pra
usar um modelo maior que o `qwen2.5:0.5b` da variante VM de 1GB. Ajuste o
shape do serviço (passo 5) conforme o modelo:

| Modelo | Memória recomendada (`--memory`) | CPU recomendada (`--cpu`) |
|---|---|---|
| `qwen2.5:0.5b` (mais rápido, respostas simples) | `2Gi` | `1` |
| `qwen2.5:3b` / `llama3.2:3b` (padrão sugerido, bom equilíbrio) | `8Gi` | `4` |
| `llama3.1` (8B, melhores respostas, mais lento em CPU) | `12Gi` | `4` |

Os valores acima já incluem margem de segurança: na prática, `qwen2.5:3b`
com `--memory 4Gi` chegou a ultrapassar o limite durante a inferência
("Memory limit of 4096 MiB exceeded with 4101 MiB used") — o Cloud Run
mata o container nesse caso (o cliente recebe 503). O contexto do Ollama
(`OLLAMA_CONTEXT_LENGTH`, cache KV) soma bastante além do tamanho puro
dos pesos do modelo.

## 3. Criar os arquivos do stack no Cloud Shell

```bash
mkdir ~/ollama-cloud-run && cd ~/ollama-cloud-run
```

Copie os 3 arquivos de `docker/ollama-cloud-run/` deste repositório
(`Dockerfile`, `Caddyfile`, `entrypoint.sh`) — use `cat > arquivo
<<'EOF' ... EOF` no Cloud Shell (mais confiável que colar dentro do
`nano`) ou clone o repositório se tiver acesso via `git clone`.

## 4. Build + push da imagem

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
  -t southamerica-east1-docker.pkg.dev/SEU_PROJETO_GCP/ollama-repo/ollama-servidor .

docker push southamerica-east1-docker.pkg.dev/SEU_PROJETO_GCP/ollama-repo/ollama-servidor
```

Troque `SEU_PROJETO_GCP` pelo ID do seu projeto se for diferente. O build baixa o
modelo escolhido durante o processo — pode levar vários minutos
dependendo do tamanho do modelo, é esperado.

## 5. Deploy (privado)

```bash
gcloud run deploy ollama-servidor \
  --image southamerica-east1-docker.pkg.dev/SEU_PROJETO_GCP/ollama-repo/ollama-servidor \
  --region southamerica-east1 \
  --no-allow-unauthenticated \
  --port 8080 \
  --memory 8Gi \
  --cpu 4 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars 'OLLAMA_MODEL=qwen2.5:3b'
```

Notas:
- `--region southamerica-east1` (São Paulo) — mesma região do projeto
  Supabase, reduz latência. Pode trocar por qualquer região do Cloud Run.
- `--max-instances 1` evita escalar além de 1 réplica (mantém o uso
  previsível dentro do Always Free).
- `--no-allow-unauthenticated` é o padrão do Cloud Run, mas deixe
  explícito — evita qualquer tentativa acidental de tornar público.

Ao final, o comando imprime a **URL do serviço** — algo como
`https://ollama-servidor-xxxxxxxxxx-rj.a.run.app`. É essa URL que vai
para o `OLLAMA_HOST` da Vercel.

## 6. Criar a conta de serviço que a Vercel vai usar

```bash
gcloud iam service-accounts create vercel-ollama-invoker \
  --display-name="Vercel Ollama Invoker"

gcloud run services add-iam-policy-binding ollama-servidor \
  --region=southamerica-east1 \
  --member="serviceAccount:vercel-ollama-invoker@SEU_PROJETO_GCP.iam.gserviceaccount.com" \
  --role=roles/run.invoker

gcloud iam service-accounts keys create $HOME/vercel-ollama-key.json \
  --iam-account=vercel-ollama-invoker@SEU_PROJETO_GCP.iam.gserviceaccount.com
cat $HOME/vercel-ollama-key.json
```

Guarde a saída do `cat` (um JSON) — é uma credencial sensível, vai virar
a variável `OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON` na Vercel (passo 8).

**Se `keys create` falhar** com
`constraints/iam.disableServiceAccountKeyCreation` (política comum de
organizações Google Workspace corporativas, que bloqueia chaves JSON
exportáveis por segurança): precisa de alguém com acesso de
administrador da **organização** (não do projeto) pra abrir uma exceção
em **IAM e administrador → Políticas da organização** (com o seletor
trocado pra Organização, não o projeto) → constraint
`iam.disableServiceAccountKeyCreation` → Editar política → "Substituir a
política do recurso pai" com uma regra de aplicação desativada só pra
esse projeto.

## 7. Testar

De dentro do Cloud Shell, usando sua própria identidade (só pra
confirmar que o serviço responde — a Vercel vai usar a conta de
serviço, não a sua):
```bash
curl -H "Authorization: Bearer $(gcloud auth print-identity-token --audiences=https://ollama-servidor-xxxxxxxxxx-rj.a.run.app)" \
  https://ollama-servidor-xxxxxxxxxx-rj.a.run.app/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Diga oi em uma palavra","stream":false}'
```

Pra testar com a própria conta de serviço (o caminho exato que a Vercel
usa):
```bash
gcloud auth activate-service-account --key-file=$HOME/vercel-ollama-key.json
TOKEN=$(gcloud auth print-identity-token --audiences=https://ollama-servidor-xxxxxxxxxx-rj.a.run.app)
curl -H "Authorization: Bearer $TOKEN" \
  https://ollama-servidor-xxxxxxxxxx-rj.a.run.app/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Diga oi em uma palavra","stream":false}'
gcloud config set account <sua-conta-humana>   # volta pra sua conta
```

A primeira chamada depois de um tempo sem uso pode demorar alguns segundos
(cold start) — é esperado.

## 8. Configurar a Vercel

No painel do projeto na Vercel (Settings → Environment Variables),
adicione:

| Variável | Valor |
|---|---|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_HOST` | a URL do Cloud Run (passo 5), **exatamente** igual (sem barra no final) — é a audiência do token, qualquer diferença causa 401 |
| `OLLAMA_MODEL` | o modelo que você baixou (ex.: `qwen2.5:3b`) |
| `OLLAMA_GOOGLE_SERVICE_ACCOUNT_JSON` | o conteúdo do `vercel-ollama-key.json`, colado inteiro numa linha só, sem aspas extras em volta |

Não configure `OLLAMA_BASIC_AUTH_USER`/`OLLAMA_BASIC_AUTH_PASSWORD` nesse
caminho — não são usados aqui (só existem pra variante VM com Caddy).

Redeploy o projeto para as variáveis novas valerem. Chat e análise por IA
passam a rodar no seu container no Cloud Run — nenhum dado sai pra
terceiros.

## Atualizando o modelo depois

Repita os passos 4-5 com um `OLLAMA_MODEL` diferente (o Cloud Run cria
uma nova revisão automaticamente) e atualize `OLLAMA_MODEL` na Vercel.
