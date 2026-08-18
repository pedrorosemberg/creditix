# Servidor de IA local gratuito (Oracle Cloud + Ollama)

Contexto: a análise por IA e o chat precisam rodar um modelo de linguagem
sem enviar dados para terceiros (nada de Gemini/API do Google). Tentamos
rodar o modelo embutido no próprio processo da Vercel (`@huggingface/transformers`),
mas o ambiente serverless da Vercel não consegue carregar o binário nativo
que esse motor de IA precisa (`libonnxruntime.so.1: cannot open shared
object file` — faltam bibliotecas do sistema que a Vercel não
disponibiliza, e não há como contornar isso só incluindo mais arquivos no
deploy). A solução robusta é rodar o [Ollama](https://ollama.com) — um
servidor de IA local maduro — num servidor de verdade, separado da
Vercel, que você controla. Nenhum dado sai dessa infraestrutura.

A Oracle Cloud tem um nível **"Always Free"** genuinely gratuito (não é
trial de 12 meses — continua grátis indefinidamente) com uma VM ARM
(Ampere A1) de até 4 OCPUs e 24GB de RAM, mais que suficiente para rodar
o Ollama com um modelo pequeno/médio.

## 1. Criar a VM na Oracle Cloud

1. Crie uma conta em [cloud.oracle.com](https://cloud.oracle.com) (pede
   cartão de crédito só para verificação de identidade — o tier Always
   Free não cobra nada enquanto você ficar dentro dos limites).
2. No console, vá em **Compute → Instances → Create Instance**.
3. Escolha a imagem **Ubuntu 22.04** (ou mais recente).
4. Em "Shape", troque para **Ampere (ARM)** e selecione `VM.Standard.A1.Flex`
   — configure 4 OCPUs / 24GB RAM (o máximo do Always Free).
5. Adicione sua chave SSH pública (ou gere uma nova ali mesmo e baixe a
   privada).
6. Crie a instância e anote o **IP público**.

### Se a cota do A1 (Ampere) estiver bloqueada

É comum a criação da VM A1 falhar com "service limits were exceeded"
mesmo em contas novas dentro do Always Free — é uma cota que ainda não
foi liberada pra sua conta, não falta de opção gratuita. Duas saídas:

- Pedir aumento de cota em **Governance & Administration → Limits,
  Quotas and Usage** (gratuito, mas pode levar um tempo pra aprovar) e
  tentar de novo mais tarde, ou tentar um shape A1 menor (2 OCPU/12GB)
  primeiro — algumas contas já vêm com essa cota parcial liberada.
- Enquanto isso, a Oracle libera **separadamente** (cota própria, não
  compartilha limite com o A1) até 2 VMs `VM.Standard.E2.1.Micro` (AMD,
  1 OCPU, **1GB de RAM**) — geralmente disponível na hora. É pouca RAM
  pra um modelo grande, mas roda um modelo bem pequeno
  (`qwen2.5:0.5b`) como solução provisória. Essa variante normalmente
  vem com **Oracle Linux** em vez de Ubuntu — usuário SSH `opc` (não
  `ubuntu`) e firewall `firewalld` em vez de `iptables` direto. As
  próximas seções trazem o comando equivalente pros dois casos.

## 2. Abrir as portas 80 e 443

A Oracle bloqueia tudo por padrão em duas camadas — as duas precisam ser
ajustadas:

- **Security List da VCN**: Networking → Virtual Cloud Networks → (sua
  rede) → Security Lists → Default Security List → Add Ingress Rules:
  - Source `0.0.0.0/0`, porta `80` (TCP)
  - Source `0.0.0.0/0`, porta `443` (TCP)
- **Firewall da própria VM** (bloqueia mesmo com a security list
  liberada):
  - Ubuntu (`iptables`/`netfilter` por padrão):
    ```bash
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    sudo netfilter-persistent save   # ou: sudo apt install iptables-persistent
    ```
  - Oracle Linux (`firewalld` por padrão):
    ```bash
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=443/tcp
    sudo firewall-cmd --reload
    ```

## 3. Instalar Docker

Conecte via SSH — `ssh ubuntu@<ip-publico>` (Ubuntu) ou
`ssh opc@<ip-publico>` (Oracle Linux) — e rode:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# saia e reconecte via SSH para o grupo "docker" valer
```

### Se a VM tiver só 1GB de RAM (shape E2.1.Micro)

Adicione um swap file antes de subir o stack — sem isso, o Docker ou o
Ollama pode morrer por falta de memória (OOM) mesmo com um modelo
pequeno:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # confirma que o swap apareceu
```

## 4. Subir o Ollama

```bash
mkdir ollama-servidor && cd ollama-servidor
# copie para cá os 3 arquivos de docker/ollama-servidor/ deste repositório:
# docker-compose.yml, Caddyfile, .env.example

cp .env.example .env
nano .env   # preencha DOMINIO (ex.: 129-146-10-5.nip.io, trocando pelo seu IP) e BASIC_AUTH_USER

# gerar o hash da senha:
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'escolha-uma-senha-forte'
# cole o resultado em BASIC_AUTH_HASH no .env

docker compose up -d
docker compose exec ollama ollama pull llama3.1   # VM com 24GB de RAM (A1)
# docker compose exec ollama ollama pull qwen2.5:0.5b   # VM com só 1GB de RAM (E2.1.Micro)
```

O primeiro acesso ao domínio pode levar alguns segundos enquanto o Caddy
emite o certificado HTTPS automaticamente.

Teste (de qualquer máquina, trocando usuário/senha/domínio):

```bash
curl -u creditix:escolha-uma-senha-forte https://129-146-10-5.nip.io/api/generate \
  -d '{"model":"llama3.1","prompt":"Diga oi em uma palavra","stream":false}'
```

## 5. Configurar a Vercel

No painel do projeto na Vercel (Settings → Environment Variables),
adicione:

| Variável | Valor |
|---|---|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_HOST` | `https://129-146-10-5.nip.io` (seu domínio) |
| `OLLAMA_MODEL` | `llama3.1` (ou o modelo que você baixou) |
| `OLLAMA_BASIC_AUTH_USER` | o mesmo `BASIC_AUTH_USER` do `.env` |
| `OLLAMA_BASIC_AUTH_PASSWORD` | a senha em texto puro (a mesma que você usou no `caddy hash-password`) |

Redeploy o projeto para as variáveis novas valerem. A partir daí, chat e
análise por IA passam a rodar 100% no seu servidor Oracle — nenhum dado
sai para terceiros, e a Vercel só troca mensagens com um servidor
protegido por usuário/senha via HTTPS.

## Escolhendo o modelo

`llama3.1` (8B parâmetros) é um bom padrão para 24GB de RAM em CPU.
Modelos menores (`llama3.2:3b`, `qwen2.5:3b`) respondem mais rápido;
modelos maiores dão respostas melhores mas mais lentas. Troque com
`docker compose exec ollama ollama pull <modelo>` e atualize
`OLLAMA_MODEL` na Vercel.
