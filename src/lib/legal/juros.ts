import { detectarCategoria, faixaParaCategoria } from "./faixas-referencia";
import type {
  EntradaAnaliseJuros,
  PassoRecomendado,
  ResultadoAnaliseJuros,
  VeredictoJuros,
} from "./tipos";

const MESES_POR_ANO = 12;
const TETO_LEI_USURA_MENSAL = 0.01; // 1% a.m. / 12% a.a. — Decreto 22.626/1933, art. 1º

function diferencaEmMeses(inicio: Date, fim: Date): number {
  const ms = fim.getTime() - inicio.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

/**
 * Estima a taxa de juros mensal implícita entre valor original e valor
 * atual de uma dívida, assumindo capitalização composta simples ao longo
 * do período decorrido. É uma ESTIMATIVA: o valor "atual" informado pelo
 * credor/Serasa pode incluir multa, correção monetária e honorários além
 * de juros — por isso o relatório sempre recomenda solicitar o
 * demonstrativo/planilha de cálculo detalhado ao credor (CDC art. 6º, III).
 */
export function analisarJuros(entrada: EntradaAnaliseJuros): ResultadoAnaliseJuros {
  const {
    valorOriginal,
    valorAtual,
    dataInicio,
    dataReferencia = new Date(),
    tipoCredor,
    produtoServico,
  } = entrada;

  const categoriaDetectada = detectarCategoria(produtoServico);
  const faixaReferencia = faixaParaCategoria(categoriaDetectada);
  const tetoLegalAplicavel = tipoCredor === "nao_financeiro" ? TETO_LEI_USURA_MENSAL : null;

  if (!dataInicio || valorOriginal <= 0 || valorAtual <= 0) {
    return {
      meses: null,
      taxaMensalImplicita: null,
      taxaAnualImplicita: null,
      categoriaDetectada,
      faixaReferencia,
      tetoLegalAplicavel,
      veredicto: "sem_dados_suficientes",
      explicacao:
        "Não há dados suficientes (valor original, valor atual e data de contratação/vencimento) para estimar a taxa de juros implícita desta dívida.",
      fundamentoIds: ["cdc_art6"],
      proximosPassos: passoSolicitarExtrato(),
    };
  }

  const meses = diferencaEmMeses(dataInicio, dataReferencia);

  if (meses <= 0) {
    return {
      meses,
      taxaMensalImplicita: null,
      taxaAnualImplicita: null,
      categoriaDetectada,
      faixaReferencia,
      tetoLegalAplicavel,
      veredicto: "sem_dados_suficientes",
      explicacao: "A data de início informada é igual ou posterior à data de referência da análise.",
      fundamentoIds: ["cdc_art6"],
      proximosPassos: passoSolicitarExtrato(),
    };
  }

  const razao = valorAtual / valorOriginal;
  const taxaMensalImplicita = Math.pow(razao, 1 / meses) - 1;
  const taxaAnualImplicita = Math.pow(1 + taxaMensalImplicita, MESES_POR_ANO) - 1;

  const veredicto = classificarVeredicto({
    taxaMensalImplicita,
    tipoCredor,
    tetoLegalAplicavel,
    faixaMax: faixaReferencia?.taxaMensalMax ?? null,
  });

  return {
    meses,
    taxaMensalImplicita,
    taxaAnualImplicita,
    categoriaDetectada,
    faixaReferencia,
    tetoLegalAplicavel,
    veredicto,
    explicacao: explicar({ veredicto, taxaMensalImplicita, taxaAnualImplicita, tipoCredor, faixaReferencia, meses }),
    fundamentoIds: fundamentosParaVeredicto(veredicto, tipoCredor),
    proximosPassos: passosParaVeredicto(veredicto, tipoCredor),
  };
}

function classificarVeredicto(params: {
  taxaMensalImplicita: number;
  tipoCredor: EntradaAnaliseJuros["tipoCredor"];
  tetoLegalAplicavel: number | null;
  faixaMax: number | null;
}): VeredictoJuros {
  const { taxaMensalImplicita, tipoCredor, tetoLegalAplicavel, faixaMax } = params;

  if (tipoCredor === "nao_financeiro" && tetoLegalAplicavel !== null) {
    return taxaMensalImplicita > tetoLegalAplicavel ? "acima_do_teto_legal" : "dentro_da_faixa";
  }

  if (faixaMax === null) return "sem_dados_suficientes";
  if (taxaMensalImplicita <= faixaMax) return "dentro_da_faixa";
  if (taxaMensalImplicita <= faixaMax * 1.5) return "zona_de_atencao";
  return "provavelmente_abusivo";
}

function explicar(params: {
  veredicto: VeredictoJuros;
  taxaMensalImplicita: number;
  taxaAnualImplicita: number;
  tipoCredor: EntradaAnaliseJuros["tipoCredor"];
  faixaReferencia: ResultadoAnaliseJuros["faixaReferencia"];
  meses: number;
}): string {
  const { veredicto, taxaMensalImplicita, taxaAnualImplicita, tipoCredor, faixaReferencia, meses } = params;
  const pctMes = (taxaMensalImplicita * 100).toFixed(2);
  const pctAno = (taxaAnualImplicita * 100).toFixed(1);
  const periodo = meses.toFixed(1);

  const base = `Com base no valor original e no valor atual informados, ao longo de ~${periodo} meses a taxa de juros implícita estimada é de ${pctMes}% ao mês (≈ ${pctAno}% ao ano).`;

  switch (veredicto) {
    case "acima_do_teto_legal":
      return `${base} Como o credor não é instituição financeira, aplica-se o teto de 12% ao ano (1% ao mês) da Lei de Usura — a taxa estimada ultrapassa esse limite.`;
    case "dentro_da_faixa":
      return tipoCredor === "nao_financeiro"
        ? `${base} Esse valor está dentro do teto de 12% ao ano previsto na Lei de Usura para credores não financeiros.`
        : `${base} Esse valor está dentro da faixa de referência típica para ${faixaReferencia?.rotulo ?? "essa modalidade"}.`;
    case "zona_de_atencao":
      return `${base} Esse valor está acima da faixa típica para ${faixaReferencia?.rotulo ?? "essa modalidade"}, mas ainda não é claramente discrepante — vale comparar com a taxa média oficial do Banco Central antes de concluir por abusividade (Súmula 382/STJ).`;
    case "provavelmente_abusivo":
      return `${base} Esse valor está significativamente acima da faixa típica para ${faixaReferencia?.rotulo ?? "essa modalidade"} (mais de 50% acima do teto de referência), o que é um indício relevante de abusividade a ser investigado.`;
    default:
      return base;
  }
}

function fundamentosParaVeredicto(veredicto: VeredictoJuros, tipoCredor: EntradaAnaliseJuros["tipoCredor"]): string[] {
  if (tipoCredor === "nao_financeiro") {
    return ["lei_usura", "cc_art406", "cdc_art51"];
  }
  const base = ["stf_sumula_596", "stj_sumula_382", "bacen_taxas_juros"];
  if (veredicto === "provavelmente_abusivo" || veredicto === "zona_de_atencao") {
    return [...base, "cdc_art51", "cdc_art39"];
  }
  return base;
}

function passoSolicitarExtrato(): PassoRecomendado[] {
  return [
    {
      titulo: "Solicitar demonstrativo detalhado ao credor",
      descricao:
        "Peça por escrito (e-mail ou canal oficial) a planilha de evolução da dívida, com juros, multa, correção monetária e CET aplicados mês a mês.",
      fundamentoIds: ["cdc_art6"],
    },
  ];
}

function passosParaVeredicto(veredicto: VeredictoJuros, tipoCredor: EntradaAnaliseJuros["tipoCredor"]): PassoRecomendado[] {
  const extrato: PassoRecomendado = {
    titulo: "Solicitar demonstrativo detalhado ao credor",
    descricao:
      "Peça por escrito a planilha de evolução da dívida (juros, multa, correção e CET mês a mês) antes de qualquer negociação ou contestação formal.",
    fundamentoIds: ["cdc_art6", "cdc_art52"],
  };

  if (veredicto === "dentro_da_faixa") {
    return [
      extrato,
      {
        titulo: "Negociar diretamente com desconto para pagamento à vista",
        descricao:
          "Como os juros parecem regulares, o caminho mais rápido costuma ser negociação extrajudicial direta, aproveitando eventual desconto informado pelo credor.",
        fundamentoIds: [],
      },
    ];
  }

  if (veredicto === "zona_de_atencao") {
    return [
      extrato,
      {
        titulo: "Comparar com a taxa média do Banco Central",
        descricao:
          "Consulte bcb.gov.br/estatisticas/txjuros para a modalidade específica antes de contestar — a diferença isolada em relação a 12% a.a. não basta (Súmula 382/STJ).",
        fundamentoIds: ["stj_sumula_382", "bacen_taxas_juros"],
      },
    ];
  }

  const extraJudicial: PassoRecomendado[] = [
    extrato,
    {
      titulo: "Notificação extrajudicial ao credor",
      descricao:
        "Envie notificação formal pedindo revisão/readequação da dívida com base na Lei do Superendividamento, antes de qualquer medida judicial.",
      fundamentoIds: ["lei_superendividamento", "cdc_art51"],
    },
    tipoCredor === "instituicao_financeira"
      ? {
          titulo: "Registrar reclamação no Banco Central (RDR)",
          descricao:
            "Instituições financeiras são obrigadas a responder formalmente às reclamações registradas no Registro de Reclamações do BACEN.",
          fundamentoIds: ["bacen_rdr"],
        }
      : {
          titulo: "Registrar reclamação no PROCON",
          descricao: "Para credores não financeiros, o PROCON é o órgão competente para mediar e fiscalizar a cobrança.",
          fundamentoIds: ["procon"],
        },
    {
      titulo: "Avaliar ação revisional no Juizado Especial Cível",
      descricao:
        "Causas de até 40 salários mínimos podem ser ajuizadas no Juizado Especial Cível (sem advogado até 20 salários mínimos); é possível pedir revisão do contrato e devolução em dobro do que foi pago indevidamente.",
      fundamentoIds: ["lei_9099_juizado", "cdc_art42"],
    },
  ];

  return extraJudicial;
}
