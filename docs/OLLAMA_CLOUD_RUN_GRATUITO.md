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

## 5. Build + deploy

Substitua `qwen2.5:3b` pelo modelo escolhido no passo 2 (mesmo valor nos
dois comandos abaixo) e o hash gerado no passo 4:

```bash
cd ~/ollama-cloud-run

gcloud auth configure-docker --quiet
docker build --build-arg OLLAMA_MODEL=qwen2.5:3b -t gcr.io/llmmtdx/ollama-servidor .
docker push gcr.io/llmmtdx/ollama-servidor

gcloud run deploy ollama-servidor \
  --image gcr.io/llmmtdx/ollama-servidor \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars "BASIC_AUTH_USER=creditix,BASIC_AUTH_HASH=\$2a\$...cole_o_hash_aqui...,OLLAMA_MODEL=qwen2.5:3b"
```

Notas:
- `--region southamerica-east1` (São Paulo) — mesma região do projeto
  Supabase, reduz latência. Pode trocar por qualquer região do Cloud Run.
- `--max-instances 1` evita escalar além de 1 réplica (mantém o uso
  previsível dentro do Always Free).
- O build da imagem baixa o modelo escolhido durante o `docker build` —
  pode levar alguns minutos dependendo do tamanho do modelo, é esperado.

Ao final, o comando `gcloud run deploy` imprime a **URL do serviço** —
algo como `https://ollama-servidor-xxxxxxxxxx-rj.a.run.app`. É essa URL
que vai para o `OLLAMA_HOST` da Vercel.

## 6. Testar

```bash
curl -u creditix:escolha-uma-senha-forte https://ollama-servidor-xxxxxxxxxx-rj.a.run.app/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Diga oi em uma palavra","stream":false}'
```

A primeira chamada depois de um tempo sem uso pode demorar alguns segundos
(cold start) — é esperado.

## 7. Configurar a Vercel

No painel do projeto na Vercel (Settings → Environment Variables),
adicione:

| Variável | Valor |
|---|---|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_HOST` | a URL do Cloud Run (passo 5) |
| `OLLAMA_MODEL` | o modelo que você baixou (ex.: `qwen2.5:3b`) |
| `OLLAMA_BASIC_AUTH_USER` | `creditix` (ou o que você usou) |
| `OLLAMA_BASIC_AUTH_PASSWORD` | a senha em texto puro (a mesma do `caddy hash-password`) |

Redeploy o projeto para as variáveis novas valerem. Chat e análise por IA
passam a rodar no seu container no Cloud Run — nenhum dado sai pra
terceiros, e a Vercel só troca mensagens com um serviço protegido por
usuário/senha via HTTPS.

## Atualizando o modelo depois

Repita o passo 5 com um `OLLAMA_MODEL` diferente (o Cloud Run cria uma
nova revisão automaticamente) e atualize `OLLAMA_MODEL` na Vercel.
