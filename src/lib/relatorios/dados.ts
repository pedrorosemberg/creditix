import type { createClient } from "@/lib/supabase/server";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { montarPlanoRecuperacao } from "@/lib/finance/recovery-plan";
import { somaMensalEquivalente } from "@/lib/finance/periodicidade";
import type { PlanoRecuperacao } from "@/lib/finance/tipos";
import type { VeredictoJuros } from "@/lib/legal/tipos";
import type { Debt, Transaction } from "@/types/database.types";
import type { FiltrosRelatorio } from "./tipos";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type DividaRelatorio = Debt & {
  taxaMensalImplicita: number | null;
  veredictoJuridico: VeredictoJuros;
};

export type DadosRelatorio = {
  dividas: DividaRelatorio[];
  transacoes: Transaction[];
  plano: PlanoRecuperacao | null;
  totalDividas: number;
  totalReceitas: number;
  totalDespesas: number;
};

/**
 * Busca os dados do relatório consolidado sempre através do client
 * autenticado da sessão (RLS por auth.uid()) — usado tanto pela
 * pré-visualização em /relatorios quanto pelas exportações em PDF/CSV, para
 * que o arquivo baixado reflita exatamente os mesmos filtros da tela.
 */
export async function obterDadosRelatorio(
  supabase: SupabaseClient,
  filtros: FiltrosRelatorio,
): Promise<DadosRelatorio> {
  const incluirDividas = filtros.secoes.includes("dividas");
  const incluirTransacoes = filtros.secoes.includes("transacoes");
  const incluirRecuperacao = filtros.secoes.includes("recuperacao");

  let dividas: DividaRelatorio[] = [];
  if (incluirDividas) {
    let query = supabase.from("debts").select("*");
    if (filtros.dividaIds.length > 0) query = query.in("id", filtros.dividaIds);
    if (filtros.statusDivida.length > 0) query = query.in("status", filtros.statusDivida);
    if (filtros.inicio) query = query.gte("data_contratacao", filtros.inicio);
    if (filtros.fim) query = query.lte("data_contratacao", filtros.fim);
    const { data } = await query.order("valor_atual", { ascending: false });
    dividas = (data ?? []).map((d) => {
      const { analise } = analisarDivida(d);
      return { ...d, taxaMensalImplicita: analise.taxaMensalImplicita, veredictoJuridico: analise.veredicto };
    });
  }

  let transacoes: Transaction[] = [];
  if (incluirTransacoes) {
    let query = supabase.from("transactions").select("*");
    if (filtros.dividaIds.length > 0) query = query.in("debt_id", filtros.dividaIds);
    if (filtros.tipoTransacao.length > 0) query = query.in("tipo", filtros.tipoTransacao);
    if (filtros.inicio) query = query.gte("data", filtros.inicio);
    if (filtros.fim) query = query.lte("data", filtros.fim);
    const { data } = await query.order("data", { ascending: false });
    transacoes = data ?? [];
  }

  let plano: PlanoRecuperacao | null = null;
  if (incluirRecuperacao) {
    const [{ data: dividasAtivas }, { data: incomes }, { data: expenses }] = await Promise.all([
      supabase.from("debts").select("*").in("status", ["ativa", "negociando", "contestada"]),
      supabase.from("incomes").select("valor, recorrencia"),
      supabase.from("expenses").select("valor, recorrencia, essencial"),
    ]);

    const rendaMensal = somaMensalEquivalente(incomes ?? []);
    const gastosEssenciais = somaMensalEquivalente((expenses ?? []).filter((e) => e.essencial));

    const dividasParaPlano = (dividasAtivas ?? []).map((d) => {
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

    plano = montarPlanoRecuperacao({ rendaMensal, gastosEssenciais, dividas: dividasParaPlano });
  }

  const totalDividas = dividas.reduce((acc, d) => acc + Number(d.valor_atual), 0);
  const totalReceitas = transacoes.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + Number(t.valor), 0);
  const totalDespesas = transacoes
    .filter((t) => t.tipo !== "receita")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  return { dividas, transacoes, plano, totalDividas, totalReceitas, totalDespesas };
}
