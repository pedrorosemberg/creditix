"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema, uuidSchema } from "@/lib/security/validation";
import { sincronizarOrcamento } from "@/lib/finance/sincronizar-orcamento";

export async function criarTransacaoAction(formData: FormData) {
  const debtIdRaw = (formData.get("debt_id") ?? "").toString();
  const dados = transactionSchema.parse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") || "outros",
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    data: formData.get("data"),
    debt_id: debtIdRaw,
    recorrencia: formData.get("recorrencia") || "unica",
    dia_vencimento: formData.get("dia_vencimento") || undefined,
    essencial: formData.get("essencial") === "on",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { descricao, categoria, tipo, valor, data, debt_id, recorrencia } = dados;
  const { error } = await supabase.from("transactions").insert({
    descricao,
    categoria,
    tipo,
    valor,
    data,
    recorrencia,
    debt_id: debt_id || null,
    user_id: user.id,
  });
  if (error) throw new Error("Não foi possível salvar a transação.");

  // Uma transação recorrente de receita/despesa também alimenta o
  // Orçamento (usado no plano de recuperação) — pagamento de dívida não
  // entra aqui, o efeito dele já é acompanhado pelo valor_atual da dívida.
  if (recorrencia !== "unica" && (tipo === "receita" || tipo === "despesa")) {
    await sincronizarOrcamento(supabase, user.id, {
      descricao,
      categoria,
      tipo,
      valor,
      recorrencia,
      dia_vencimento: dados.dia_vencimento,
      essencial: dados.essencial,
    });
    revalidatePath("/orcamento");
    revalidatePath("/recuperacao");
  }

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  revalidatePath("/lembretes");
}

export async function excluirTransacaoAction(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  revalidatePath("/lembretes");
}
