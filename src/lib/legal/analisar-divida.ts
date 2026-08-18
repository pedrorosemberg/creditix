import { analisarJuros } from "./juros";
import { verificarPrescricao } from "./prescricao";
import type { Debt } from "@/types/database.types";

export function analisarDivida(divida: Debt) {
  const dataInicio = divida.data_contratacao ?? divida.data_vencimento;
  const analise = analisarJuros({
    valorOriginal: Number(divida.valor_original),
    valorAtual: Number(divida.valor_atual),
    dataInicio: dataInicio ? new Date(dataInicio) : null,
    tipoCredor: divida.tipo_credor,
    produtoServico: divida.produto_servico,
  });
  const prescricao = verificarPrescricao(
    divida.data_vencimento ? new Date(divida.data_vencimento) : null,
  );
  return { analise, prescricao };
}
