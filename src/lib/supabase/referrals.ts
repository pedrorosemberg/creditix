import "server-only";
import { createAdminClient } from "./admin";

/**
 * Registra uma indicação "pendente" quando alguém se cadastra através
 * do link de um indicador (?ref=CODIGO em /cadastro). Best-effort: nunca
 * deve impedir o cadastro em si — se o código for inválido, de alguém
 * que já foi excluído, ou se a própria escrita falhar, apenas não há
 * indicação (silenciosamente).
 */
export async function registrarIndicacaoPendente(params: {
  codigoIndicacao: string;
  novoUsuarioId: string;
}): Promise<void> {
  const codigo = params.codigoIndicacao.trim().toUpperCase();
  if (!codigo) return;

  try {
    const admin = createAdminClient();
    const { data: perfilIndicador } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", codigo)
      .maybeSingle();

    if (!perfilIndicador || perfilIndicador.id === params.novoUsuarioId) return;

    await admin.from("referrals").insert({
      referrer_id: perfilIndicador.id,
      referred_user_id: params.novoUsuarioId,
      codigo,
      status: "pendente",
    });
  } catch (err) {
    console.error("[referrals] Falha best-effort ao registrar indicação pendente:", err);
  }
}

/**
 * Marca como "aceita" a indicação pendente de quem acabou de confirmar
 * o e-mail de cadastro. Best-effort — uma falha aqui nunca deve impedir
 * a confirmação de conta do usuário.
 */
export async function confirmarIndicacaoAceita(referredUserId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("referrals")
      .update({ status: "aceito", aceito_at: new Date().toISOString() })
      .eq("referred_user_id", referredUserId)
      .eq("status", "pendente");
  } catch (err) {
    console.error("[referrals] Falha best-effort ao confirmar indicação:", err);
  }
}
