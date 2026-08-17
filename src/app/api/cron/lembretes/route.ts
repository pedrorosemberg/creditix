import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, REMETENTE_PADRAO } from "@/lib/email/resend";
import { obterItensDoMes, renderLembreteHtml } from "@/lib/email/lembrete-mensal";

export const dynamic = "force-dynamic";

/**
 * Cron mensal de lembretes. Protegido por CRON_SECRET (não por sessão de
 * usuário) — configure seu orquestrador (Vercel Cron, cron do sistema
 * operacional, etc.) para chamar esta rota uma vez por dia enviando
 * `Authorization: Bearer <CRON_SECRET>`. A rotina só envia, de fato, para
 * usuários cujo dia de lembrete configurado é hoje, e no máximo uma vez
 * por mês por usuário (controlado por reminder_sends).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const hoje = new Date();
  const diaHoje = hoje.getUTCDate();
  const mesReferencia = `${hoje.getUTCFullYear()}-${String(hoje.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creditix.metadax.com.br";

  const { data: perfis, error: perfisError } = await admin
    .from("profiles")
    .select("id, display_name, lembrete_email, lembrete_dia_mes")
    .eq("lembrete_email", true)
    .eq("lembrete_dia_mes", diaHoje);

  if (perfisError) {
    return NextResponse.json({ error: perfisError.message }, { status: 500 });
  }

  const resend = getResendClient();
  let enviados = 0;
  const falhas: string[] = [];

  for (const perfil of perfis ?? []) {
    try {
      const { data: jaEnviado } = await admin
        .from("reminder_sends")
        .select("id")
        .eq("user_id", perfil.id)
        .eq("mes_referencia", mesReferencia)
        .maybeSingle();
      if (jaEnviado) continue;

      const { data: usuario } = await admin.auth.admin.getUserById(perfil.id);
      const email = usuario?.user?.email;
      if (!email) continue;

      const itens = await obterItensDoMes(admin, perfil.id);
      if (itens.dividasPendentes.length === 0 && itens.gastosMensais.length === 0) continue;

      const html = renderLembreteHtml({
        nome: perfil.display_name,
        mesReferencia: hoje,
        itens,
        appUrl,
      });

      let resendId: string | null = null;
      if (resend) {
        const { data } = await resend.emails.send({
          from: REMETENTE_PADRAO,
          to: email,
          subject: "Seu resumo mensal Creditix",
          html,
        });
        resendId = data?.id ?? null;
      }

      await admin.from("reminder_sends").insert({
        user_id: perfil.id,
        mes_referencia: mesReferencia,
        destinatario: email,
        status: resend ? "enviado" : "resend_nao_configurado",
        resend_id: resendId,
      });
      enviados += 1;
    } catch {
      falhas.push(perfil.id);
    }
  }

  return NextResponse.json({ enviados, falhas: falhas.length });
}
