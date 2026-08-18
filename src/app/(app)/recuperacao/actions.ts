"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { montarPlanoRecuperacao } from "@/lib/finance/recovery-plan";
import { somaMensalEquivalente } from "@/lib/finance/periodicidade";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import type { EstrategiaPriorizacao } from "@/lib/finance/tipos";

export async function salvarPlanoAction(formData: FormData) {
  const estrategia = (formData.get("estrategia") as EstrategiaPriorizacao) ?? "avalanche";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const plano = montarPlanoRecuperacao({
    rendaMensal,
    gastosEssenciais,
    dividas: dividasParaPlano,
    estrategia,
  });

  const { error } = await supabase.from("recovery_plan_snapshots").insert({
    user_id: user.id,
    renda_mensal_considerada: rendaMensal,
    gastos_essenciais_considerados: gastosEssenciais,
    margem_disponivel: plano.margemDisponivel,
    estrategia,
    plano,
  });
  if (error) throw new Error("Não foi possível salvar o plano.");

  revalidatePath("/recuperacao");
}
