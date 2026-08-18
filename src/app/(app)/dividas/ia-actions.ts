"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analisarDividaComIa } from "@/lib/ai/analyze-debt";
import { checarLimite } from "@/lib/security/rate-limit";
import { uuidSchema } from "@/lib/security/validation";
import { registrarLog } from "@/lib/activity-log";

export type AnaliseIaState = { error?: string } | undefined;

export async function gerarAnaliseIaAction(
  _prev: AnaliseIaState,
  formData: FormData,
): Promise<AnaliseIaState> {
  const dividaId = uuidSchema.parse(formData.get("debt_id"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const limite = await checarLimite(`ia:${user.id}`, 10, 60 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Limite de análises por IA atingido nesta hora. Tente novamente mais tarde." };
  }

  const { data: divida } = await supabase.from("debts").select("*").eq("id", dividaId).maybeSingle();
  if (!divida) return { error: "Dívida não encontrada." };

  try {
    const resultado = await analisarDividaComIa(divida);

    const { error } = await supabase.from("ai_analyses").insert({
      user_id: user.id,
      debt_id: divida.id,
      provider: resultado.provider,
      model: resultado.model,
      content: resultado.content,
      structured: null,
    });
    if (error) throw error;
  } catch (err) {
    console.error("[ia-actions] Falha ao gerar análise por IA:", err);
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: `Falha ao gerar análise por IA (dívida: ${divida.credor_nome})`,
      descricao: err instanceof Error ? err.message : String(err),
    });
    return {
      error:
        "Não foi possível gerar a análise por IA agora. Verifique se o provedor configurado (Ollama/Gemini/local) está disponível.",
    };
  }

  revalidatePath(`/dividas/${dividaId}`);
  return undefined;
}
