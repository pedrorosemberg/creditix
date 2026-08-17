import "server-only";

/**
 * Rate limit best-effort em memória de processo. Suficiente para uma
 * instância única (ex.: self-hosted em VPS/Docker Compose). Se você
 * escalar para múltiplas instâncias (ex.: Vercel serverless com vários
 * workers), troque por um contador compartilhado (Redis/Upstash) — a
 * interface abaixo foi desenhada para ser trocável sem mexer nos chamadores.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

export function checarLimite(chave: string, limite: number, janelaMs: number): RateLimitResult {
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

// Evita crescimento ilimitado do Map em processos de longa duração.
setInterval(
  () => {
    const agora = Date.now();
    for (const [chave, bucket] of buckets) {
      if (bucket.resetAt <= agora) buckets.delete(chave);
    }
  },
  5 * 60 * 1000,
).unref?.();
