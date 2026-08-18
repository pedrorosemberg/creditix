"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema, incomeSchema, uuidSchema } from "@/lib/security/validation";

/**
 * Renda e gasto recorrentes nascem em Transações (sincronizarOrcamento) —
 * aqui só cabe editar o que já existe (corrigir valor/recorrência/nome) ou
 * excluir. Ter um segundo formulário de criação aqui reabriria a
 * duplicidade que a centralização em Transações resolveu.
 */
export async function atualizarRendaAction(id: string, formData: FormData) {
  const rendaId = uuidSchema.parse(id);
  const dados = incomeSchema.parse({
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    recorrencia: formData.get("recorrencia") || "mensal",
  });

  const supabase = await createClient();
  const { error } = await supabase.from("incomes").update(dados).eq("id", rendaId);
  if (error) throw new Error("Não foi possível atualizar a renda.");
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

export async function atualizarGastoAction(id: string, formData: FormData) {
  const gastoId = uuidSchema.parse(id);
  const dados = expenseSchema.parse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") || "outros",
    valor: formData.get("valor"),
    recorrencia: formData.get("recorrencia") || "mensal",
    dia_vencimento: formData.get("dia_vencimento") || undefined,
    essencial: formData.get("essencial") === "on",
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({ ...dados, dia_vencimento: dados.dia_vencimento ?? null })
    .eq("id", gastoId);
  if (error) throw new Error("Não foi possível atualizar o gasto.");
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
