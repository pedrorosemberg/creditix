import { createClient } from "@/lib/supabase/server";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { uuidSchema } from "@/lib/security/validation";

function csvEscape(valor: string | number | boolean | null) {
  const s = String(valor ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return new Response("ID inválido", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { data: divida } = await supabase.from("debts").select("*").eq("id", parsedId.data).maybeSingle();
  if (!divida) return new Response("Dívida não encontrada", { status: 404 });

  const { analise, prescricao } = analisarDivida(divida);

  const linhas = [
    ["campo", "valor"],
    ["credor", divida.credor_nome],
    ["produto_servico", divida.produto_servico],
    ["tipo_credor", divida.tipo_credor],
    ["valor_original", divida.valor_original],
    ["valor_atual", divida.valor_atual],
    ["data_contratacao", divida.data_contratacao ?? ""],
    ["data_vencimento", divida.data_vencimento ?? ""],
    ["taxa_mensal_estimada_pct", analise.taxaMensalImplicita !== null ? (analise.taxaMensalImplicita * 100).toFixed(2) : ""],
    ["taxa_anual_estimada_pct", analise.taxaAnualImplicita !== null ? (analise.taxaAnualImplicita * 100).toFixed(2) : ""],
    ["veredicto_juros", analise.veredicto],
    ["possivel_prescricao", prescricao.possivelmentePrescrita],
  ];

  const csv = linhas.map((linha) => linha.map(csvEscape).join(";")).join("\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="divida-${divida.id}.csv"`,
    },
  });
}
