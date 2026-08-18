"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  revalidatePath("/lembretes");
}
