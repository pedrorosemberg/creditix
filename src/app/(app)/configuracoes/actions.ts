"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/security/validation";

export async function atualizarPerfilAction(formData: FormData) {
  const dados = profileSchema.parse({
    display_name: formData.get("display_name") || undefined,
    renda_mensal: formData.get("renda_mensal") || undefined,
    lembrete_email: formData.get("lembrete_email") === "on",
    lembrete_dia_mes: formData.get("lembrete_dia_mes") || 5,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: dados.display_name ?? null,
      renda_mensal: dados.renda_mensal ?? null,
      lembrete_email: dados.lembrete_email,
      lembrete_dia_mes: dados.lembrete_dia_mes,
    })
    .eq("id", user.id);
  if (error) throw new Error("Não foi possível salvar o perfil.");

  revalidatePath("/configuracoes");
  revalidatePath("/lembretes");
}
