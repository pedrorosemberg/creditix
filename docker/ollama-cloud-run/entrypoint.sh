#!/bin/sh
set -e

# Ollama só escuta localmente — quem fica exposto pro Cloud Run é o Caddy
# (com autenticação básica) na porta $PORT.
export OLLAMA_HOST=127.0.0.1:11434
ollama serve &

# Espera o Ollama subir antes do Caddy começar a repassar requisições.
sleep 5

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
