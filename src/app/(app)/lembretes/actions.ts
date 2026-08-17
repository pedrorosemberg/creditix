"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  lembrete_email: z.coerce.boolean(),
  lembrete_dia_mes: z.coerce.number().int().min(1).max(28),
});

export async function atualizarLembreteAction(formData: FormData) {
  const dados = schema.parse({
    lembrete_email: formData.get("lembrete_email") === "on",
    lembrete_dia_mes: formData.get("lembrete_dia_mes"),
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
