"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { obterProvedor } from "@/lib/ai/get-provider";
import { montarPromptChat, type ContextoFinanceiroChat, type MensagemHistorico } from "@/lib/ai/chat";
import { montarPlanoRecuperacao } from "@/lib/finance/recovery-plan";
import { somaMensalEquivalente } from "@/lib/finance/periodicidade";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { checarLimite } from "@/lib/security/rate-limit";
import { registrarLog } from "@/lib/activity-log";

export type ChatState = { error?: string } | undefined;

const mensagemSchema = z.string().trim().min(1, "Digite uma mensagem.").max(2000, "Mensagem muito longa (máx. 2000 caracteres).");

const HISTORICO_MAXIMO = 10;

/**
 * Monta o resumo financeiro do usuário SEMPRE a partir do client
 * autenticado da sessão (RLS por auth.uid()) — nunca do client de service
 * role. É estruturalmente impossível esta função enxergar dados de outro
 * usuário: toda query aqui roda sob a política RLS do próprio usuário logado.
 */
async function montarContexto(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ContextoFinanceiroChat> {
  const [{ data: dividas }, { data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("debts").select("*").in("status", ["ativa", "negociando", "contestada"]),
    supabase.from("incomes").select("valor, recorrencia"),
    supabase.from("expenses").select("valor, recorrencia, essencial"),
  ]);

  const rendaMensal = somaMensalEquivalente(incomes ?? []);
  const gastosEssenciais = somaMensalEquivalente((expenses ?? []).filter((e) => e.essencial));

  const dividasParaPlano = (dividas ?? []).map((d) => {
    const { analise } = analisarDivida(d);
    return {
      id: d.id,
      credorNome: d.credor_nome,
      valorAtual: Number(d.valor_atual),
      percentualDescontoAvista: d.percentual_desconto_avista,
      valorDescontoAvista: d.valor_desconto_avista,
      taxaMensalImplicita: analise.taxaMensalImplicita,
      veredictoJuridico: analise.veredicto,
    };
  });

  const plano = montarPlanoRecuperacao({ rendaMensal, gastosEssenciais, dividas: dividasParaPlano });

  return {
    rendaMensal,
    gastosEssenciais,
    margemParaDividas: plano.margemParaDividas,
    reservaSeguranca: plano.reservaSeguranca,
    quantidadeDividasAtivas: dividasParaPlano.length,
    totalDividasAtivas: dividasParaPlano.reduce((acc, d) => acc + d.valorAtual, 0),
    observacoesPlano: plano.observacoes,
    dividas: dividasParaPlano.map((d) => ({ credorNome: d.credorNome, valorAtual: d.valorAtual })),
  };
}

export async function enviarMensagemChatAction(_prev: ChatState, formData: FormData): Promise<ChatState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const limite = checarLimite(`chat:${user.id}`, 15, 10 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas mensagens em pouco tempo. Aguarde alguns minutos." };
  }

  const parsed = mensagemSchema.safeParse(formData.get("mensagem"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  }

  const { data: historicoRows, error: historicoError } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(HISTORICO_MAXIMO);
  if (historicoError) {
    return { error: "Não foi possível carregar o histórico da conversa." };
  }
  const historico: MensagemHistorico[] = (historicoRows ?? [])
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  const { error: insertUsuarioError } = await supabase
    .from("ai_chat_messages")
    .insert({ user_id: user.id, role: "usuario", content: parsed.data, provider: null, model: null });
  if (insertUsuarioError) {
    return { error: "Não foi possível enviar sua mensagem. Tente novamente." };
  }

  try {
    const contexto = await montarContexto(supabase);
    const prompt = montarPromptChat({ contexto, historico, novaMensagem: parsed.data });
    const resposta = await obterProvedor().gerar(prompt);

    const { error: insertAssistenteError } = await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "assistente",
      content: resposta.content,
      provider: resposta.provider,
      model: resposta.model,
    });
    if (insertAssistenteError) {
      return { error: "Resposta gerada, mas não foi possível salvá-la." };
    }
  } catch (err) {
    console.error("[chat] Falha ao gerar resposta da IA:", err);
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao gerar resposta do chat de IA",
      descricao: err instanceof Error ? err.message : String(err),
    });
    return {
      error: "O assistente de IA está indisponível no momento. Sua mensagem foi salva — tente novamente em instantes.",
    };
  }

  revalidatePath("/chat");
  return undefined;
}

export async function limparConversaAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
  revalidatePath("/chat");
}
