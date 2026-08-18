import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarAssinaturaSvix } from "@/lib/webhooks/svix-verify";

export const dynamic = "force-dynamic";

// Mapeia o tipo de evento do Resend para o status guardado em reminder_sends.
// Documentação dos eventos: https://resend.com/docs/dashboard/webhooks/event-types
const STATUS_POR_EVENTO: Record<string, string> = {
  "email.sent": "enviado",
  "email.delivered": "entregue",
  "email.delivery_delayed": "atrasado",
  "email.bounced": "bounce",
  "email.complained": "reclamacao",
  "email.opened": "aberto",
  "email.clicked": "clicado",
};

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: { email_id?: string; [key: string]: unknown };
};

/**
 * Recebe eventos de entrega/engajamento de e-mail do Resend (configurado
 * no painel do Resend em Webhooks, apontando para esta URL). A assinatura
 * é verificada no formato Svix usando RESEND_WEBHOOK_API_KEY — o mesmo
 * segredo "whsec_..." que o Resend mostra ao criar o webhook.
 *
 * Nunca lemos o corpo como JSON antes de verificar a assinatura: ela é
 * calculada sobre o texto bruto exatamente como o Resend enviou.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_API_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 501 });
  }

  const body = await request.text();
  const assinaturaValida = verificarAssinaturaSvix({
    secret,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    svixSignature: request.headers.get("svix-signature"),
    body,
  });

  if (!assinaturaValida) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let evento: ResendWebhookPayload;
  try {
    evento = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const emailId = evento.data?.email_id ?? null;
  const admin = createAdminClient();

  await admin.from("email_events").insert({
    resend_email_id: emailId,
    event_type: evento.type,
    payload: evento as unknown as Record<string, unknown>,
  });

  const novoStatus = STATUS_POR_EVENTO[evento.type];
  if (emailId && novoStatus) {
    await admin.from("reminder_sends").update({ status: novoStatus }).eq("resend_id", emailId);
  }

  return NextResponse.json({ received: true });
}
