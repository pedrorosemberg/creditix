import "server-only";
import { after } from "next/server";
import type { createClient } from "@/lib/supabase/server";
import { registrarLog } from "@/lib/activity-log";
import { saoEquivalentes, saoParecidos } from "./dedupe";
import { verificarDuplicidadeComIa } from "@/lib/ai/dedupe-check";
import type { RecorrenciaDb } from "@/types/database.types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type NovoLancamentoRecorrente = {
  descricao: string;
  categoria: string;
  tipo: "receita" | "despesa";
  valor: number;
  recorrencia: RecorrenciaDb;
  dia_vencimento?: number;
  essencial: boolean;
};

/**
 * Mantém o Orçamento (renda/gasto usado no plano de recuperação) em
 * sincronia com transações recorrentes lançadas em Transações — ponto
 * único de lançamento, sem formulário de criação separado em /orcamento.
 *
 * - Nome já cadastrado (equivalente, ignorando maiúsculas/acentos) →
 *   ATUALIZA o item existente (nunca duplica um "Salário" lançado todo
 *   mês).
 * - Nome "parecido" mas não idêntico → cria um novo item (nunca funde
 *   dois itens só numa suspeita) e pede, em segundo plano, uma segunda
 *   opinião ao provedor de IA já configurado (Ollama/local — nunca um
 *   provedor de terceiros) só pra decidir se vale avisar o usuário nos
 *   Logs. Nunca bloqueia esta função nem falha por causa disso.
 * - Sem nenhum nome parecido → só cria o novo item, sem checagem extra.
 * - Transações "única" nunca chegam aqui (ver criarTransacaoAction).
 */
export async function sincronizarOrcamento(
  supabase: SupabaseClient,
  userId: string,
  novo: NovoLancamentoRecorrente,
) {
  const tabela = novo.tipo === "receita" ? "incomes" : "expenses";
  const { data } = await supabase.from(tabela).select("*").eq("user_id", userId);
  const existentes = data ?? [];

  const exato = existentes.find((item) => saoEquivalentes(item.descricao, novo.descricao));
  if (exato) {
    await supabase.from(tabela).update({ valor: novo.valor, recorrencia: novo.recorrencia }).eq("id", exato.id);
    await registrarLog(supabase, userId, {
      tipo: "info",
      titulo: `${novo.tipo === "receita" ? "Renda" : "Gasto"} do Orçamento atualizado a partir de uma transação`,
      descricao: `"${novo.descricao}": valor atualizado para R$ ${novo.valor.toFixed(2)} a partir do lançamento recorrente em Transações.`,
    });
    return;
  }

  const parecido = existentes.find((item) => saoParecidos(item.descricao, novo.descricao));

  if (novo.tipo === "receita") {
    await supabase
      .from("incomes")
      .insert({ descricao: novo.descricao, valor: novo.valor, recorrencia: novo.recorrencia, user_id: userId });
  } else {
    await supabase.from("expenses").insert({
      descricao: novo.descricao,
      categoria: novo.categoria,
      valor: novo.valor,
      recorrencia: novo.recorrencia,
      dia_vencimento: novo.dia_vencimento ?? null,
      essencial: novo.essencial,
      user_id: userId,
    });
  }

  if (!parecido) return;

  after(async () => {
    try {
      const resultado = await verificarDuplicidadeComIa({
        tipo: novo.tipo === "receita" ? "renda" : "gasto",
        novoDescricao: novo.descricao,
        novoValor: novo.valor,
        candidatoDescricao: parecido.descricao,
        candidatoValor: Number(parecido.valor),
      });
      if (resultado.provavelDuplicado) {
        await registrarLog(supabase, userId, {
          tipo: "aviso",
          titulo: `Possível ${novo.tipo === "receita" ? "renda" : "gasto"} duplicado no Orçamento`,
          descricao: `"${novo.descricao}" pode ser a mesma coisa que "${parecido.descricao}" (${resultado.justificativa}). Revise em Orçamento e exclua o que estiver repetido.`,
        });
      }
    } catch (err) {
      console.error("[sincronizar-orcamento] Falha best-effort na checagem de duplicidade por IA:", err);
    }
  });
}
