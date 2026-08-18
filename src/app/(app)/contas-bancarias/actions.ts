"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema, uuidSchema } from "@/lib/security/validation";
import { registrarLog } from "@/lib/activity-log";
import { INSTITUICOES_FINANCEIRAS, OUTRA_INSTITUICAO_ID } from "@/lib/constants/instituicoes-financeiras";

function resolverNomeInstituicao(instituicaoId: string, nomeInformado: string): string {
  if (instituicaoId === OUTRA_INSTITUICAO_ID) return nomeInformado;
  const encontrada = INSTITUICOES_FINANCEIRAS.find((i) => i.id === instituicaoId);
  return encontrada?.nome ?? nomeInformado;
}

export async function criarContaBancariaAction(formData: FormData) {
  const instituicaoId = (formData.get("instituicao_id") ?? "").toString();
  const dados = bankAccountSchema.parse({
    instituicao_id: instituicaoId,
    instituicao_nome: resolverNomeInstituicao(instituicaoId, (formData.get("instituicao_nome_outra") ?? "").toString()),
    apelido: formData.get("apelido"),
    numero_conta: formData.get("numero_conta") ?? "",
    observacoes: formData.get("observacoes") ?? "",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("bank_accounts").insert({
    user_id: user.id,
    instituicao_id: dados.instituicao_id,
    instituicao_nome: dados.instituicao_nome,
    apelido: dados.apelido,
    numero_conta: dados.numero_conta || null,
    observacoes: dados.observacoes || null,
  });

  if (error) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao cadastrar conta bancária",
      descricao: error.message,
    });
    throw new Error("Não foi possível salvar a conta bancária.");
  }

  await registrarLog(supabase, user.id, {
    tipo: "conta",
    titulo: "Conta bancária cadastrada",
    descricao: `${dados.apelido} (${dados.instituicao_nome})`,
  });

  revalidatePath("/contas-bancarias");
  revalidatePath("/dividas");
  revalidatePath("/dividas/nova");
}

export async function excluirContaBancariaAction(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao excluir conta bancária",
      descricao: error.message,
    });
    throw new Error("Não foi possível excluir a conta bancária.");
  }

  await registrarLog(supabase, user.id, {
    tipo: "exclusao",
    titulo: "Conta bancária excluída",
  });

  revalidatePath("/contas-bancarias");
  revalidatePath("/dividas");
}
