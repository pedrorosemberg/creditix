"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema, uuidSchema } from "@/lib/security/validation";

export async function criarTransacaoAction(formData: FormData) {
  const debtIdRaw = (formData.get("debt_id") ?? "").toString();
  const dados = transactionSchema.parse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") || "outros",
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    data: formData.get("data"),
    debt_id: debtIdRaw,
    recorrente: formData.get("recorrente") === "on",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("transactions").insert({
    ...dados,
    debt_id: dados.debt_id || null,
    user_id: user.id,
  });
  if (error) throw new Error("Não foi possível salvar a transação.");
  revalidatePath("/transacoes");
}

export async function excluirTransacaoAction(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transacoes");
}
