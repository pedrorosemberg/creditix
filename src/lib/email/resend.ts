import "server-only";
import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export const REMETENTE_PADRAO = process.env.RESEND_FROM_EMAIL ?? "Creditix <lembretes@creditix.metadax.com.br>";
