"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarLog } from "@/lib/activity-log";
import { checarLimite } from "@/lib/security/rate-limit";
import { getResendClient, REMETENTE_PADRAO } from "@/lib/email/resend";
import { obterItensLembrete, renderLembreteHtml } from "@/lib/email/lembrete-mensal";
import { z } from "zod";

const schema = z.object({
  lembrete_email: z.coerce.boolean(),
  lembrete_frequencia: z.enum(["semanal", "quinzenal", "mensal"]),
  lembrete_dia_semana: z.coerce.number().int().min(0).max(6),
  lembrete_dia_mes: z.coerce.number().int().min(1).max(28),
  lembrete_dividas: z.coerce.boolean(),
  lembrete_contas: z.coerce.boolean(),
  lembrete_preencher_transacoes: z.coerce.boolean(),
});

export async function atualizarLembreteAction(formData: FormData) {
  const dados = schema.parse({
    lembrete_email: formData.get("lembrete_email") === "on",
    lembrete_frequencia: formData.get("lembrete_frequencia"),
    lembrete_dia_semana: formData.get("lembrete_dia_semana"),
    lembrete_dia_mes: formData.get("lembrete_dia_mes"),
    lembrete_dividas: formData.get("lembrete_dividas") === "on",
    lembrete_contas: formData.get("lembrete_contas") === "on",
    lembrete_preencher_transacoes: formData.get("lembrete_preencher_transacoes") === "on",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").update(dados).eq("id", user.id);
  if (error) throw new Error("Não foi possível salvar as preferências de lembrete.");

  await registrarLog(supabase, user.id, { tipo: "conta", titulo: "Preferências de lembrete atualizadas" });

  revalidatePath("/lembretes");
}

export type TesteLembreteState = { error?: string; sucesso?: string } | undefined;

/**
 * Dispara o e-mail de lembrete pra você mesmo, agora — não passa pelo
 * cron, não depende da frequência configurada e não marca nada em
 * reminder_sends (não conta como o envio do dia). Existe só pra
 * confirmar, na hora, que o Resend está mesmo entregando.
 */
export async function enviarLembreteTesteAction(
  _prev: TesteLembreteState,
  _formData: FormData,
): Promise<TesteLembreteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email) return { error: "Sua conta não tem um e-mail cadastrado." };

  const limite = await checarLimite(`lembrete-teste:${user.id}`, 5, 60 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Limite de envios de teste atingido nesta hora. Tente novamente mais tarde." };
  }

  const resend = getResendClient();
  if (!resend) {
    return { error: "RESEND_API_KEY não está configurada neste ambiente — não há como enviar e-mails." };
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const prefs = {
    lembreteDividas: profile?.lembrete_dividas ?? true,
    lembreteContas: profile?.lembrete_contas ?? true,
    lembretePreencherTransacoes: profile?.lembrete_preencher_transacoes ?? true,
  };
  const itens = await obterItensLembrete(supabase, user.id, prefs);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creditix.metadax.com.br";
  const html = renderLembreteHtml({ nome: profile?.display_name ?? null, itens, appUrl });

  const { error } = await resend.emails.send({
    from: REMETENTE_PADRAO,
    to: user.email,
    subject: "[Teste] Seu resumo financeiro Creditix",
    html,
  });

  if (error) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao enviar e-mail de teste do lembrete",
      descricao: error.message,
    });
    return { error: `O Resend recusou o envio: ${error.message}` };
  }

  await registrarLog(supabase, user.id, {
    tipo: "email",
    titulo: "Lembrete de teste enviado por e-mail",
    descricao: `Disparo manual pelo próprio usuário, para ${user.email}.`,
  });

  return { sucesso: `E-mail de teste enviado para ${user.email}. Confira sua caixa de entrada (e o spam).` };
}
