import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Debt, Expense } from "@/types/database.types";
import { formatarMoeda } from "@/lib/utils";

export type ItensLembreteMes = {
  dividasPendentes: Debt[];
  gastosMensais: Expense[];
};

export async function obterItensDoMes(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ItensLembreteMes> {
  const [{ data: dividas }, { data: gastos }] = await Promise.all([
    supabase
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["ativa", "negociando", "contestada"]),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("recorrencia", "mensal"),
  ]);

  return { dividasPendentes: dividas ?? [], gastosMensais: gastos ?? [] };
}

export function renderLembreteHtml(params: {
  nome: string | null;
  mesReferencia: Date;
  itens: ItensLembreteMes;
  appUrl: string;
}): string {
  const { nome, mesReferencia, itens, appUrl } = params;
  const mesFormatado = mesReferencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const linhasDividas = itens.dividasPendentes
    .map(
      (d) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3e5e9">${d.credor_nome} — ${d.produto_servico}</td><td style="padding:8px 0;border-bottom:1px solid #e3e5e9;text-align:right;font-weight:600">${formatarMoeda(Number(d.valor_atual))}</td></tr>`,
    )
    .join("");

  const linhasGastos = itens.gastosMensais
    .map(
      (g) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3e5e9">${g.descricao}${g.dia_vencimento ? ` (dia ${g.dia_vencimento})` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #e3e5e9;text-align:right;font-weight:600">${formatarMoeda(Number(g.valor))}</td></tr>`,
    )
    .join("");

  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e1e1e">
    <h1 style="color:#0056B3;font-size:20px;margin-bottom:4px">Creditix</h1>
    <p style="color:#5b5f66;margin-top:0">Seu resumo de ${mesFormatado}</p>
    <p>Olá${nome ? `, ${nome}` : ""}. Aqui está o que precisa da sua atenção este mês:</p>

    ${
      itens.dividasPendentes.length > 0
        ? `<h2 style="font-size:15px;color:#0056B3">Dívidas em aberto</h2>
           <table style="width:100%;border-collapse:collapse;font-size:14px">${linhasDividas}</table>`
        : ""
    }

    ${
      itens.gastosMensais.length > 0
        ? `<h2 style="font-size:15px;color:#0056B3;margin-top:20px">Contas fixas do mês</h2>
           <table style="width:100%;border-collapse:collapse;font-size:14px">${linhasGastos}</table>`
        : ""
    }

    <p style="margin-top:24px">
      <a href="${appUrl}/dashboard" style="background:#0056B3;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Ver painel completo</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#5b5f66">
      Você recebeu este e-mail porque os lembretes mensais estão ativados na sua conta Creditix. Você pode
      desativá-los a qualquer momento em Configurações.
    </p>
  </div>`;
}
