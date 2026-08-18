import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

// ---------------------------------------------------------------------------
// Fallback em memória de processo — usado quando o Upstash Redis não está
// configurado (ex.: self-hosted numa instância só, ou antes de configurar
// UPSTASH_REDIS_REST_URL/TOKEN). Só protege dentro da mesma instância: numa
// Vercel serverless com vários workers concorrentes, cada um tem seu próprio
// contador, então o limite real vira "N vezes o número de instâncias ativas".
// ---------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checarLimiteEmMemoria(chave: string, limite: number, janelaMs: number): RateLimitResult {
  const agora = Date.now();
  const atual = buckets.get(chave);

  if (!atual || atual.resetAt <= agora) {
    const novo: Bucket = { count: 1, resetAt: agora + janelaMs };
    buckets.set(chave, novo);
    return { allowed: true, remaining: limite - 1, resetAt: novo.resetAt };
  }

  if (atual.count >= limite) {
    return { allowed: false, remaining: 0, resetAt: atual.resetAt };
  }

  atual.count += 1;
  return { allowed: true, remaining: limite - atual.count, resetAt: atual.resetAt };
}

setInterval(
  () => {
    const agora = Date.now();
    for (const [chave, bucket] of buckets) {
      if (bucket.resetAt <= agora) buckets.delete(chave);
    }
  },
  5 * 60 * 1000,
).unref?.();

// ---------------------------------------------------------------------------
// Upstash Redis — contador compartilhado entre todas as instâncias
// serverless, de verdade eficaz sob concorrência. Plano gratuito do Upstash
// (10 mil comandos/dia) é sobra pro volume de um app pessoal; ver
// docs/AUTENTICACAO.md pra como configurar. Sem as env vars, cai
// automaticamente no fallback acima — nenhuma configuração é obrigatória.
// ---------------------------------------------------------------------------
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Um Ratelimit por combinação (limite, janela) — reaproveitado entre
// chamadas em vez de recriado a cada requisição.
const limitadoresUpstash = new Map<string, Ratelimit>();

function obterLimitadorUpstash(limite: number, janelaMs: number): Ratelimit {
  const chaveCache = `${limite}:${janelaMs}`;
  const existente = limitadoresUpstash.get(chaveCache);
  if (existente) return existente;

  const novo = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limite, `${janelaMs} ms`),
    analytics: false,
    prefix: "creditix:ratelimit",
  });
  limitadoresUpstash.set(chaveCache, novo);
  return novo;
}

/**
 * Rate limit para ações sensíveis (login, cadastro, recuperação de senha,
 * chat/IA, troca de e-mail/senha). Usa Upstash Redis quando configurado —
 * único contador entre todas as instâncias, resistente a burst distribuído
 * entre workers da Vercel; sem isso, best-effort em memória (suficiente pra
 * self-host numa instância só). Uma falha ao falar com o Upstash nunca
 * bloqueia a ação — cai pro fallback em memória.
 */
export async function checarLimite(chave: string, limite: number, janelaMs: number): Promise<RateLimitResult> {
  if (redis) {
    try {
      const limitador = obterLimitadorUpstash(limite, janelaMs);
      const resultado = await limitador.limit(chave);
      return { allowed: resultado.success, remaining: resultado.remaining, resetAt: resultado.reset };
    } catch (err) {
      console.error("[rate-limit] Falha ao consultar Upstash — usando fallback em memória:", err);
    }
  }
  return checarLimiteEmMemoria(chave, limite, janelaMs);
}
