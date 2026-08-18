import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URL pública da aplicação, usada em todo link enviado por e-mail ou
 * compartilhado (auth, indicação). "||" (não "??") é proposital: em
 * alguns ambientes a variável chega como string vazia, não
 * undefined/null, e "??" não cai no fallback nesse caso — já nos mordeu
 * uma vez no build da Vercel.
 */
export function urlPublicaApp(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://creditix.metadax.com.br";
}

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarPercentual(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${(valor * 100).toFixed(casas)}%`;
}

export function formatarData(data: string | Date | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Data "de hoje" no fuso de Brasília, no formato YYYY-MM-DD. Servidores
// (Vercel, cron) rodam em UTC — usar new Date().toISOString() direto vira
// o dia ~3h antes da meia-noite local, o que já causou lembrete disparando
// no dia errado e formulário de transação sugerindo a data de amanhã.
export function hojeBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function formatarDataHora(data: string | Date | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}
