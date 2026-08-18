import { calcularOpcaoAvista } from "@/lib/finance/recovery-plan";
import type { DividaParaPlano } from "@/lib/finance/tipos";

/**
 * Análise simples e individual por dívida — cálculo direto (valor ÷ sobra
 * mensal, sem juros/otimização), diferente do motor de
 * src/lib/finance/recovery-plan.ts, que decide o que quitar primeiro. Aqui
 * a pergunta é mais direta: "se eu dedicasse toda a sobra só a esta dívida,
 * quantos meses levaria?" — útil para dar uma noção rápida de tamanho antes
 * de olhar o plano otimizado.
 */

export type AnaliseIndividualDivida = {
  dividaId: string;
  credorNome: string;
  valorAtual: number;
  veredictoJuridico: DividaParaPlano["veredictoJuridico"];
  taxaMensalImplicita: number | null;
  valorAvista: number;
  economiaAvista: number;
  mesesSozinha: number | null;
  mesesSozinhaAvista: number | null;
};

export type AnaliseSimplesGeral = {
  margemMensal: number;
  totalDividas: number;
  totalAvista: number;
  mesesTodasSequencial: number | null;
  mesesTodasAvista: number | null;
  individuais: AnaliseIndividualDivida[];
};

function calcularMeses(valor: number, margemMensal: number): number | null {
  if (margemMensal <= 0 || valor <= 0) return null;
  return Math.ceil(valor / margemMensal);
}

export function montarAnaliseSimples(params: {
  margemMensal: number;
  dividas: DividaParaPlano[];
}): AnaliseSimplesGeral {
  const { margemMensal, dividas } = params;

  const individuais: AnaliseIndividualDivida[] = dividas.map((d) => {
    const avista = calcularOpcaoAvista(d);
    return {
      dividaId: d.id,
      credorNome: d.credorNome,
      valorAtual: d.valorAtual,
      veredictoJuridico: d.veredictoJuridico,
      taxaMensalImplicita: d.taxaMensalImplicita,
      valorAvista: avista.valorTotal,
      economiaAvista: avista.economia,
      mesesSozinha: calcularMeses(d.valorAtual, margemMensal),
      mesesSozinhaAvista: calcularMeses(avista.valorTotal, margemMensal),
    };
  });

  const totalDividas = dividas.reduce((acc, d) => acc + d.valorAtual, 0);
  const totalAvista = individuais.reduce((acc, i) => acc + i.valorAvista, 0);

  return {
    margemMensal,
    totalDividas,
    totalAvista,
    mesesTodasSequencial: calcularMeses(totalDividas, margemMensal),
    mesesTodasAvista: calcularMeses(totalAvista, margemMensal),
    individuais,
  };
}

/** Soma N meses à data de hoje — usado para mostrar uma data estimada de quitação. */
export function dataDaquiAMeses(meses: number): Date {
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  return data;
}
