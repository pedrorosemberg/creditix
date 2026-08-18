# Imagem única (Ollama + Caddy na frente cuidando de autenticação básica)
# pronta pra rodar no Google Cloud Run — sem VM, sem SSH, sem firewall pra
# configurar. O Cloud Run já cuida do HTTPS na borda; o Caddy aqui dentro só
# exige usuário/senha antes de repassar pro Ollama (que não tem
# autenticação própria). O modelo já vai embutido na imagem (baixado
# durante o build), então não depende de rede em runtime.
#
# Uso: veja docs/OLLAMA_CLOUD_RUN_GRATUITO.md para o passo a passo completo
# (build + push + deploy via Cloud Shell).

FROM ollama/ollama:latest

# Modelo a embutir na imagem — troque via `--build-arg OLLAMA_MODEL=...`
ARG OLLAMA_MODEL=qwen2.5:3b
ENV OLLAMA_MODEL=${OLLAMA_MODEL}

# Baixa o Caddy (binário estático oficial, sem precisar de apt/repo extra)
ADD https://caddyserver.com/api/download?os=linux&arch=amd64 /usr/bin/caddy
RUN chmod +x /usr/bin/caddy

# Baixa o modelo durante o build — fica embutido na imagem, sem precisar de
# rede nenhuma em runtime (nem pra baixar pesos, nem pra qualquer outra coisa).
RUN ollama serve & \
    sleep 5 && \
    ollama pull "${OLLAMA_MODEL}" && \
    (pkill ollama || true)

COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# O Cloud Run injeta a porta real via $PORT em runtime (normalmente 8080) —
# o Caddyfile lê essa variável, então não precisa fixar aqui além do EXPOSE
# informativo.
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
