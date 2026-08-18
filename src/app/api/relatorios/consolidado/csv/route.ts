import { createClient } from "@/lib/supabase/server";
import { parsearFiltros } from "@/lib/relatorios/filtros";
import { obterDadosRelatorio } from "@/lib/relatorios/dados";
import { STATUS_DIVIDA_LABEL, TIPO_TRANSACAO_LABEL } from "@/lib/constants/labels";
import { veredictoLabel } from "@/components/dividas/veredicto-badge";

const MODALIDADE_LABEL: Record<string, string> = {
  avista_acumulado: "Quitada à vista",
  parcelado: "Parcelada",
  nao_alocada: "Não coube no orçamento",
};

function csvEscape(valor: string | number | boolean | null | undefined) {
  const s = String(valor ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function linhasParaCsv(linhas: (string | number | boolean | null | undefined)[][]) {
  return linhas.map((linha) => linha.map(csvEscape).join(";")).join("\n");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const filtros = parsearFiltros(searchParams);
  const dados = await obterDadosRelatorio(supabase, filtros);

  const blocos: string[] = [];

  if (filtros.secoes.includes("dividas")) {
    blocos.push(
      linhasParaCsv([
        ["DÍVIDAS"],
        ["credor", "produto_servico", "valor_atual", "status", "veredicto_juridico"],
        ...dados.dividas.map((d) => [
          d.credor_nome,
          d.produto_servico,
          Number(d.valor_atual),
          STATUS_DIVIDA_LABEL[d.status],
          veredictoLabel(d.veredictoJuridico),
        ]),
        ["", "", "", "", ""],
        ["total", "", dados.totalDividas, "", ""],
      ]),
    );
  }

  if (filtros.secoes.includes("transacoes")) {
    blocos.push(
      linhasParaCsv([
        ["TRANSAÇÕES"],
        ["data", "descricao", "tipo", "valor"],
        ...dados.transacoes.map((t) => [t.data, t.descricao, TIPO_TRANSACAO_LABEL[t.tipo], Number(t.valor)]),
        ["", "", "", ""],
        ["total_receitas", "", "", dados.totalReceitas],
        ["total_despesas_pagamentos", "", "", dados.totalDespesas],
      ]),
    );
  }

  if (filtros.secoes.includes("recuperacao") && dados.plano) {
    blocos.push(
      linhasParaCsv([
        ["RECUPERAÇÃO FINANCEIRA"],
        ["margem_mensal", dados.plano.margemDisponivel],
        ["reserva_seguranca", dados.plano.reservaSeguranca],
        ["disponivel_para_dividas", dados.plano.margemParaDividas],
        ["economia_com_descontos_avista", dados.plano.totalEconomizadoComDescontos],
        ["", ""],
        ["credor", "estrategia", "mes_quitacao"],
        ...dados.plano.resultados.map((r) => [
          r.credorNome,
          MODALIDADE_LABEL[r.modalidadeEscolhida],
          r.mesQuitacao ?? "",
        ]),
      ]),
    );
  }

  const csv = blocos.join("\n\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-creditix.csv"`,
    },
  });
}
