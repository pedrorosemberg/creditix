import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60; // 5 minutos, para mitigar replay de requisições antigas

/**
 * Verifica a assinatura de um webhook no formato Svix (usado pelo Resend).
 * Documentação do formato: https://docs.svix.com/receiving/verifying-payloads/how
 *
 * O segredo (RESEND_WEBHOOK_API_KEY) vem no formato "whsec_<base64>". A
 * assinatura esperada é HMAC-SHA256("<id>.<timestamp>.<corpo>", segredo),
 * em base64. O header svix-signature pode trazer múltiplas assinaturas
 * separadas por espaço (ex.: rotação de segredo), cada uma prefixada com
 * "v1,".
 */
export function verificarAssinaturaSvix(params: {
  secret: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  body: string;
}): boolean {
  const { secret, svixId, svixTimestamp, svixSignature, body } = params;
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const timestampSeconds = Number(svixTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const agora = Math.floor(Date.now() / 1000);
  if (Math.abs(agora - timestampSeconds) > TOLERANCE_SECONDS) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const conteudoAssinado = `${svixId}.${svixTimestamp}.${body}`;
  const assinaturaEsperada = createHmac("sha256", secretBytes).update(conteudoAssinado).digest();

  const assinaturasRecebidas = svixSignature
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter((s): s is string => Boolean(s));

  return assinaturasRecebidas.some((assinatura) => {
    let recebida: Buffer;
    try {
      recebida = Buffer.from(assinatura, "base64");
    } catch {
      return false;
    }
    if (recebida.length !== assinaturaEsperada.length) return false;
    return timingSafeEqual(recebida, assinaturaEsperada);
  });
}
