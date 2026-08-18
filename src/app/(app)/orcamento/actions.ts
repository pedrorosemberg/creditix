"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema, incomeSchema, uuidSchema } from "@/lib/security/validation";

export async function criarRendaAction(formData: FormData) {
  const dados = incomeSchema.parse({
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    recorrencia: formData.get("recorrencia") || "mensal",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("incomes").insert({ ...dados, user_id: user.id });
  if (error) throw new Error("Não foi possível salvar a renda.");
  revalidatePath("/orcamento");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
}

export async function excluirRendaAction(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("incomes").delete().eq("id", id);
  revalidatePath("/orcamento");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
}

export async function criarGastoAction(formData: FormData) {
  const dados = expenseSchema.parse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") || "outros",
    valor: formData.get("valor"),
    recorrencia: formData.get("recorrencia") || "mensal",
    dia_vencimento: formData.get("dia_vencimento") || undefined,
    essencial: formData.get("essencial") === "on",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("expenses").insert({
    ...dados,
    dia_vencimento: dados.dia_vencimento ?? null,
    user_id: user.id,
  });
  if (error) throw new Error("Não foi possível salvar o gasto.");
  revalidatePath("/orcamento");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
}

export async function excluirGastoAction(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/orcamento");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
}
