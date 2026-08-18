import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Debt, Expense } from "@/types/database.types";
import { formatarMoeda } from "@/lib/utils";
import { RECORRENCIA_LABEL, valorMensalEquivalente } from "@/lib/finance/periodicidade";

export type PreferenciasLembrete = {
  lembreteDividas: boolean;
  lembreteContas: boolean;
  lembretePreencherTransacoes: boolean;
};

export type ItensLembrete = {
  dividasPendentes: Debt[];
  gastosMensais: Expense[];
  diasSemRegistrarTransacao: number | null;
};

const LIMIAR_DIAS_SEM_REGISTRO = 5;

export async function obterItensLembrete(
  supabase: SupabaseClient<Database>,
  userId: string,
  prefs: PreferenciasLembrete,
): Promise<ItensLembrete> {
  const [dividasRes, gastosRes, ultimaTransacaoRes] = await Promise.all([
    prefs.lembreteDividas
      ? supabase.from("debts").select("*").eq("user_id", userId).in("status", ["ativa", "negociando", "contestada"])
      : Promise.resolve({ data: [] as Debt[] }),
    prefs.lembreteContas
      ? supabase.from("expenses").select("*").eq("user_id", userId).neq("recorrencia", "unica")
      : Promise.resolve({ data: [] as Expense[] }),
    prefs.lembretePreencherTransacoes
      ? supabase.from("transactions").select("data").eq("user_id", userId).order("data", { ascending: false }).limit(1)
      : Promise.resolve({ data: [] as { data: string }[] }),
  ]);

  let diasSemRegistrarTransacao: number | null = null;
  if (prefs.lembretePreencherTransacoes) {
    const ultima = ultimaTransacaoRes.data?.[0]?.data;
    if (!ultima) {
      diasSemRegistrarTransacao = LIMIAR_DIAS_SEM_REGISTRO + 1;
    } else {
      const dias = Math.floor((Date.now() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24));
      diasSemRegistrarTransacao = dias >= LIMIAR_DIAS_SEM_REGISTRO ? dias : null;
    }
  }

  return {
    dividasPendentes: dividasRes.data ?? [],
    gastosMensais: gastosRes.data ?? [],
    diasSemRegistrarTransacao,
  };
}

export function renderLembreteHtml(params: {
  nome: string | null;
  itens: ItensLembrete;
  appUrl: string;
}): string {
  const { nome, itens, appUrl } = params;

  const linhasDividas = itens.dividasPendentes
    .map(
      (d) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3e5e9">${d.credor_nome} — ${d.produto_servico}</td><td style="padding:8px 0;border-bottom:1px solid #e3e5e9;text-align:right;font-weight:600">${formatarMoeda(Number(d.valor_atual))}</td></tr>`,
    )
    .join("");

  const linhasGastos = itens.gastosMensais
    .map(
      (g) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3e5e9">${g.descricao}${g.dia_vencimento ? ` (dia ${g.dia_vencimento})` : ""} — ${RECORRENCIA_LABEL[g.recorrencia]}</td><td style="padding:8px 0;border-bottom:1px solid #e3e5e9;text-align:right;font-weight:600">${formatarMoeda(Number(g.valor))}</td></tr>`,
    )
    .join("");
  const totalGastosMensal = itens.gastosMensais.reduce(
    (acc, g) => acc + valorMensalEquivalente(Number(g.valor), g.recorrencia),
    0,
  );

  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e1e1e">
    <h1 style="color:#DC2626;font-size:20px;margin-bottom:4px">Creditix</h1>
    <p style="color:#5b5f66;margin-top:0">Seu resumo financeiro</p>
    <p>Olá${nome ? `, ${nome}` : ""}. Aqui está o que precisa da sua atenção:</p>

    ${
      itens.diasSemRegistrarTransacao !== null
        ? `<div style="background:#fee2e2;border-radius:8px;padding:12px 16px;margin:16px 0">
             <strong>Faz ${itens.diasSemRegistrarTransacao} dias que você não registra uma transação.</strong>
             <p style="margin:4px 0 0">Manter seus gastos atualizados é o que faz seu plano de recuperação ficar preciso.</p>
           </div>`
        : ""
    }

    ${
      itens.dividasPendentes.length > 0
        ? `<h2 style="font-size:15px;color:#DC2626">Dívidas em aberto</h2>
           <table style="width:100%;border-collapse:collapse;font-size:14px">${linhasDividas}</table>`
        : ""
    }

    ${
      itens.gastosMensais.length > 0
        ? `<h2 style="font-size:15px;color:#DC2626;margin-top:20px">Contas fixas</h2>
           <table style="width:100%;border-collapse:collapse;font-size:14px">${linhasGastos}</table>
           <p style="margin:6px 0 0;font-size:13px;color:#5b5f66">Equivalente mensal somado: <strong>${formatarMoeda(totalGastosMensal)}</strong></p>`
        : ""
    }

    <p style="margin-top:24px">
      <a href="${appUrl}/dashboard" style="background:#DC2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Ver painel completo</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#5b5f66">
      Você recebeu este e-mail porque os lembretes estão ativados na sua conta Creditix. Ajuste o conteúdo e a
      frequência a qualquer momento em Lembretes.
    </p>
  </div>`;
}
