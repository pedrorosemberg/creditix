import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Registra uma entrada na aba "Logs" do usuário (mudanças na conta e erros
 * de sistema, como falhas da IA) — best-effort: uma falha ao gravar o log
 * nunca deve derrubar a ação que estava sendo executada.
 */
export async function registrarLog(
  supabase: SupabaseClient,
  userId: string,
  params: { tipo: "conta" | "erro"; titulo: string; descricao?: string | null },
) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      tipo: params.tipo,
      titulo: params.titulo,
      descricao: params.descricao ?? null,
    });
  } catch {
    // best-effort — nunca propaga erro de log para a ação chamadora.
  }
}
