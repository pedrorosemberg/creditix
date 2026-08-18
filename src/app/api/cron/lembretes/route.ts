import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, REMETENTE_PADRAO } from "@/lib/email/resend";
import { obterItensLembrete, renderLembreteHtml } from "@/lib/email/lembrete-mensal";
import { registrarLog } from "@/lib/activity-log";
import { hojeBrasil } from "@/lib/utils";
import type { FrequenciaLembreteDb } from "@/types/database.types";

export const dynamic = "force-dynamic";

type PerfilLembrete = {
  id: string;
  display_name: string | null;
  lembrete_frequencia: FrequenciaLembreteDb;
  lembrete_dia_semana: number;
  lembrete_dia_mes: number;
  lembrete_dividas: boolean;
  lembrete_contas: boolean;
  lembrete_preencher_transacoes: boolean;
};

function diaSecundarioQuinzenal(diaBase: number): number {
  const somado = diaBase + 15;
  return somado > 28 ? somado - 28 : somado;
}

function deveEnviarHoje(perfil: PerfilLembrete, dataReferencia: string): boolean {
  // dataReferencia já vem no calendário de Brasília (hojeBrasil()); ancora
  // em meio-dia UTC só pra extrair dia/dia-da-semana sem risco de o fuso
  // do processo empurrar pra data adjacente.
  const [ano, mes, dia] = dataReferencia.split("-").map(Number);
  const referencia = new Date(Date.UTC(ano, mes - 1, dia, 12));
  const diaMes = referencia.getUTCDate();
  const diaSemana = referencia.getUTCDay();

  switch (perfil.lembrete_frequencia) {
    case "semanal":
      return diaSemana === perfil.lembrete_dia_semana;
    case "quinzenal":
      return diaMes === perfil.lembrete_dia_mes || diaMes === diaSecundarioQuinzenal(perfil.lembrete_dia_mes);
    case "mensal":
    default:
      return diaMes === perfil.lembrete_dia_mes;
  }
}

/**
 * Cron de lembretes. Protegido por CRON_SECRET (não por sessão de
 * usuário) — configure seu orquestrador (Vercel Cron, cron do sistema
 * operacional, etc.) para chamar esta rota UMA VEZ POR DIA enviando
 * `Authorization: Bearer <CRON_SECRET>`. Cada perfil define sua própria
 * frequência (semanal/quinzenal/mensal), quais conteúdos quer receber
 * (dívidas, contas, lembrete de registrar transações) — reminder_sends
 * evita reenvio no mesmo dia.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const dataReferencia = hojeBrasil();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creditix.metadax.com.br";

  const { data: perfis, error: perfisError } = await admin
    .from("profiles")
    .select(
      "id, display_name, lembrete_frequencia, lembrete_dia_semana, lembrete_dia_mes, lembrete_dividas, lembrete_contas, lembrete_preencher_transacoes",
    )
    .eq("lembrete_email", true);

  if (perfisError) {
    return NextResponse.json({ error: perfisError.message }, { status: 500 });
  }

  const candidatos = (perfis ?? []).filter((p) => deveEnviarHoje(p, dataReferencia));

  const resend = getResendClient();
  let enviados = 0;
  const falhas: string[] = [];

  for (const perfil of candidatos) {
    try {
      const { data: jaEnviado } = await admin
        .from("reminder_sends")
        .select("id")
        .eq("user_id", perfil.id)
        .eq("mes_referencia", dataReferencia)
        .maybeSingle();
      if (jaEnviado) continue;

      const { data: usuario } = await admin.auth.admin.getUserById(perfil.id);
      const email = usuario?.user?.email;
      if (!email) continue;

      const itens = await obterItensLembrete(admin, perfil.id, {
        lembreteDividas: perfil.lembrete_dividas,
        lembreteContas: perfil.lembrete_contas,
        lembretePreencherTransacoes: perfil.lembrete_preencher_transacoes,
      });

      const semNadaParaMostrar =
        itens.dividasPendentes.length === 0 &&
        itens.gastosMensais.length === 0 &&
        itens.diasSemRegistrarTransacao === null;
      if (semNadaParaMostrar) continue;

      const html = renderLembreteHtml({ nome: perfil.display_name, itens, appUrl });

      let resendId: string | null = null;
      if (resend) {
        const { data } = await resend.emails.send({
          from: REMETENTE_PADRAO,
          to: email,
          subject: "Seu resumo financeiro Creditix",
          html,
        });
        resendId = data?.id ?? null;
      }

      await admin.from("reminder_sends").insert({
        user_id: perfil.id,
        mes_referencia: dataReferencia,
        destinatario: email,
        status: resend ? "enviado" : "resend_nao_configurado",
        resend_id: resendId,
      });
      await registrarLog(admin, perfil.id, {
        tipo: "email",
        titulo: "Lembrete mensal enviado por e-mail",
        descricao: `Enviado para ${email} (evento agendado, disparado pelo cron diário).`,
      });
      enviados += 1;
    } catch {
      falhas.push(perfil.id);
    }
  }

  return NextResponse.json({ enviados, falhas: falhas.length, candidatos: candidatos.length });
}
