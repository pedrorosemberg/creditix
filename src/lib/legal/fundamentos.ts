/**
 * Base de fundamentos jurídicos citados pelo motor de análise de dívidas.
 *
 * Escopo: legislação federal brasileira e súmulas de tribunais superiores.
 * Este conteúdo é orientativo — não substitui aconselhamento jurídico
 * individualizado por advogado(a) ou Defensoria Pública. A redação das
 * normas pode ser alterada; em caso de dúvida, confira o texto vigente em
 * planalto.gov.br, stj.jus.br e bcb.gov.br.
 */

export type Fundamento = {
  id: string;
  titulo: string;
  resumo: string;
  fonteUrl?: string;
};

export const FUNDAMENTOS: Record<string, Fundamento> = {
  cdc_art6: {
    id: "cdc_art6",
    titulo: "CDC, art. 6º, III e VI",
    resumo:
      "Direito básico do consumidor à informação clara e adequada sobre produtos e serviços financeiros (incluindo taxas e encargos) e à prevenção/reparação de danos patrimoniais.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  cdc_art39: {
    id: "cdc_art39",
    titulo: "CDC, art. 39",
    resumo:
      "Veda práticas abusivas do fornecedor, como exigir vantagem manifestamente excessiva do consumidor.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  cdc_art42: {
    id: "cdc_art42",
    titulo: "CDC, art. 42, parágrafo único",
    resumo:
      "Quem cobra dívida indevidamente tem direito à repetição do indébito, em dobro, do valor pago em excesso, salvo engano justificável do credor.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  cdc_art43: {
    id: "cdc_art43",
    titulo: "CDC, art. 43, §1º e §5º",
    resumo:
      "Cadastros de inadimplentes não podem conter informações negativas por período superior a 5 anos, e dívidas prescritas não podem gerar anotação negativa.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  cdc_art51: {
    id: "cdc_art51",
    titulo: "CDC, art. 51",
    resumo:
      "Considera nulas de pleno direito cláusulas contratuais que coloquem o consumidor em desvantagem exagerada ou sejam incompatíveis com a boa-fé/equidade.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  cdc_art52: {
    id: "cdc_art52",
    titulo: "CDC, art. 52, §1º",
    resumo:
      "Em operações de crédito, o fornecedor deve informar previamente juros, CET e demais encargos; a multa moratória contratual não pode exceder 2% do valor da prestação.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  lei_superendividamento: {
    id: "lei_superendividamento",
    titulo: "Lei 14.181/2021 (Lei do Superendividamento) — CDC arts. 54-A a 54-G",
    resumo:
      "Institui a prevenção e o tratamento do superendividamento, o direito ao mínimo existencial e a possibilidade de repactuação global de dívidas via conciliação (inclusive judicial, com todos os credores em conjunto).",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm",
  },
  lei_usura: {
    id: "lei_usura",
    titulo: "Decreto 22.626/1933 (Lei de Usura), art. 1º",
    resumo:
      "Limita a taxa de juros remuneratórios/moratórios a 12% ao ano (1% ao mês) entre particulares e empresas não integrantes do Sistema Financeiro Nacional.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d22626.htm",
  },
  stf_sumula_596: {
    id: "stf_sumula_596",
    titulo: "Súmula 596 do STF",
    resumo:
      "O limite de 12% a.a. da Lei de Usura não se aplica às taxas de juros cobradas por instituições que integram o Sistema Financeiro Nacional — mas isso não impede o controle judicial de abusividade caso a caso.",
    fonteUrl: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
  },
  stj_sumula_382: {
    id: "stj_sumula_382",
    titulo: "Súmula 382 do STJ",
    resumo:
      "A estipulação de juros remuneratórios superiores a 12% ao ano, por si só, não indica abusividade — é preciso comparar com a taxa média de mercado do BACEN para a mesma modalidade.",
    fonteUrl: "https://www.stj.jus.br/",
  },
  stj_sumula_296: {
    id: "stj_sumula_296",
    titulo: "Súmula 296 do STJ",
    resumo:
      "Os juros remuneratórios em período de inadimplência devem seguir a taxa média de mercado divulgada pelo Banco Central, limitada ao percentual contratado.",
    fonteUrl: "https://www.stj.jus.br/",
  },
  stj_sumula_379: {
    id: "stj_sumula_379",
    titulo: "Súmula 379 do STJ",
    resumo:
      "Nos contratos bancários sem legislação específica, os juros moratórios podem ser convencionados até o limite de 1% ao mês.",
    fonteUrl: "https://www.stj.jus.br/",
  },
  stj_sumula_472: {
    id: "stj_sumula_472",
    titulo: "Súmula 472 do STJ",
    resumo:
      "A cobrança de comissão de permanência não pode ultrapassar a soma dos encargos remuneratórios e moratórios previstos no contrato, e exclui a cobrança cumulada de juros, mora e multa.",
    fonteUrl: "https://www.stj.jus.br/",
  },
  stj_sumula_539: {
    id: "stj_sumula_539",
    titulo: "Súmula 539 do STJ",
    resumo:
      "É permitida a capitalização de juros com periodicidade inferior à anual em contratos bancários celebrados após 31/03/2000, desde que expressamente pactuada.",
    fonteUrl: "https://www.stj.jus.br/",
  },
  cc_art206: {
    id: "cc_art206",
    titulo: "Código Civil, art. 206, §5º, I",
    resumo:
      "Prescreve em 5 anos a pretensão de cobrança de dívidas líquidas constantes de instrumento particular (o que costuma se aplicar a dívidas bancárias e de consumo em geral).",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
  },
  cc_art406: {
    id: "cc_art406",
    titulo: "Código Civil, art. 406",
    resumo:
      "Fixa os juros moratórios legais quando não convencionados; o STJ pacificou o entendimento de que essa taxa corresponde à taxa Selic (vedada cumulação com correção monetária pelo mesmo índice implícito).",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
  },
  lei_9099_juizado: {
    id: "lei_9099_juizado",
    titulo: "Lei 9.099/1995, arts. 3º e 9º (Juizados Especiais Cíveis)",
    resumo:
      "Causas de até 40 salários mínimos podem ser ajuizadas no Juizado Especial Cível, sem custas em 1ª instância; até 20 salários mínimos, sem necessidade de advogado.",
    fonteUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm",
  },
  bacen_rdr: {
    id: "bacen_rdr",
    titulo: "Registro de Reclamações do Banco Central (RDR)",
    resumo:
      "Canal oficial para reclamar formalmente contra instituições financeiras e de pagamento reguladas pelo BACEN; a instituição é obrigada a responder em prazo determinado.",
    fonteUrl: "https://www.bcb.gov.br/acessoinformacao/rdr",
  },
  bacen_taxas_juros: {
    id: "bacen_taxas_juros",
    titulo: "Estatísticas de taxas de juros do Banco Central (SGS)",
    resumo:
      "Série histórica oficial das taxas médias de juros praticadas no mercado por modalidade de crédito, usada como parâmetro de comparação para aferir abusividade.",
    fonteUrl: "https://www.bcb.gov.br/estatisticas/txjuros",
  },
  procon: {
    id: "procon",
    titulo: "PROCON",
    resumo:
      "Órgão de defesa do consumidor competente para mediar conflitos e aplicar sanções administrativas a fornecedores/credores não regulados pelo BACEN.",
  },
};

export function fundamento(id: keyof typeof FUNDAMENTOS): Fundamento {
  return FUNDAMENTOS[id];
}
