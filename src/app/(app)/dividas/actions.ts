"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { debtSchema, uuidSchema } from "@/lib/security/validation";

function vazioParaNull(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s === "" ? undefined : s;
}

function parseFormData(formData: FormData) {
  return debtSchema.parse({
    credor_nome: formData.get("credor_nome"),
    credor_documento: vazioParaNull(formData.get("credor_documento")) ?? "",
    numero_contrato: vazioParaNull(formData.get("numero_contrato")) ?? "",
    produto_servico: formData.get("produto_servico"),
    tipo_credor: formData.get("tipo_credor"),
    data_contratacao: vazioParaNull(formData.get("data_contratacao")) ?? "",
    data_vencimento: vazioParaNull(formData.get("data_vencimento")) ?? "",
    valor_original: formData.get("valor_original"),
    valor_atual: formData.get("valor_atual"),
    negativado: formData.get("negativado") === "on",
    data_negativacao: vazioParaNull(formData.get("data_negativacao")) ?? "",
    percentual_desconto_avista: vazioParaNull(formData.get("percentual_desconto_avista")),
    valor_desconto_avista: vazioParaNull(formData.get("valor_desconto_avista")),
    status: formData.get("status") || "ativa",
    observacoes: vazioParaNull(formData.get("observacoes")) ?? "",
  });
}

export async function criarDividaAction(formData: FormData) {
  const dados = parseFormData(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    credor_nome: dados.credor_nome,
    credor_documento: dados.credor_documento || null,
    numero_contrato: dados.numero_contrato || null,
    produto_servico: dados.produto_servico,
    tipo_credor: dados.tipo_credor,
    data_contratacao: dados.data_contratacao || null,
    data_vencimento: dados.data_vencimento || null,
    valor_original: dados.valor_original,
    valor_atual: dados.valor_atual,
    negativado: dados.negativado,
    data_negativacao: dados.data_negativacao || null,
    percentual_desconto_avista: dados.percentual_desconto_avista ?? null,
    valor_desconto_avista: dados.valor_desconto_avista ?? null,
    status: dados.status,
    fonte: "manual",
    observacoes: dados.observacoes || null,
  });

  if (error) throw new Error("Não foi possível salvar a dívida.");

  revalidatePath("/dividas");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
  redirect("/dividas");
}

export async function atualizarDividaAction(id: string, formData: FormData) {
  const dividaId = uuidSchema.parse(id);
  const dados = parseFormData(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("debts")
    .update({
      credor_nome: dados.credor_nome,
      credor_documento: dados.credor_documento || null,
      numero_contrato: dados.numero_contrato || null,
      produto_servico: dados.produto_servico,
      tipo_credor: dados.tipo_credor,
      data_contratacao: dados.data_contratacao || null,
      data_vencimento: dados.data_vencimento || null,
      valor_original: dados.valor_original,
      valor_atual: dados.valor_atual,
      negativado: dados.negativado,
      data_negativacao: dados.data_negativacao || null,
      percentual_desconto_avista: dados.percentual_desconto_avista ?? null,
      valor_desconto_avista: dados.valor_desconto_avista ?? null,
      status: dados.status,
      observacoes: dados.observacoes || null,
    })
    .eq("id", dividaId);

  if (error) throw new Error("Não foi possível atualizar a dívida.");

  revalidatePath("/dividas");
  revalidatePath(`/dividas/${dividaId}`);
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
  redirect(`/dividas/${dividaId}`);
}

export async function excluirDividaAction(formData: FormData) {
  const dividaId = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", dividaId);
  if (error) throw new Error("Não foi possível excluir a dívida.");
  revalidatePath("/dividas");
  revalidatePath("/recuperacao");
  revalidatePath("/dashboard");
  redirect("/dividas");
}
