import type { CategoriaProduto, FaixaReferencia } from "./tipos";

/**
 * Faixas de referência APROXIMADAS de taxa de juros mensal por modalidade,
 * usadas apenas como triagem inicial. Não substituem a série oficial do
 * Banco Central (bcb.gov.br/estatisticas/txjuros), que deve ser consultada
 * para confirmar abusividade em um caso concreto — conforme Súmula 382/STJ.
 */
export const FAIXAS_REFERENCIA: FaixaReferencia[] = [
  {
    categoria: "cartao_credito_rotativo",
    rotulo: "Cartão de crédito (rotativo)",
    taxaMensalMin: 0.08,
    taxaMensalMax: 0.16,
  },
  {
    categoria: "cheque_especial",
    rotulo: "Cheque especial",
    taxaMensalMin: 0.06,
    taxaMensalMax: 0.12,
  },
  {
    categoria: "credito_pessoal_nao_consignado",
    rotulo: "Crédito pessoal (não consignado)",
    taxaMensalMin: 0.03,
    taxaMensalMax: 0.08,
  },
  {
    categoria: "credito_consignado",
    rotulo: "Crédito consignado",
    taxaMensalMin: 0.012,
    taxaMensalMax: 0.025,
  },
  {
    categoria: "financiamento_veiculo",
    rotulo: "Financiamento de veículo",
    taxaMensalMin: 0.01,
    taxaMensalMax: 0.025,
  },
  {
    categoria: "crediario_loja",
    rotulo: "Crediário / carnê de loja",
    taxaMensalMin: 0.02,
    taxaMensalMax: 0.05,
  },
];

const PALAVRAS_CHAVE: Array<{ categoria: CategoriaProduto; termos: RegExp }> = [
  { categoria: "cartao_credito_rotativo", termos: /cart[ãa]o.*(rotativo|cr[ée]dito)|fatura/i },
  { categoria: "cheque_especial", termos: /cheque\s*especial/i },
  { categoria: "credito_consignado", termos: /consignad[oa]/i },
  { categoria: "financiamento_veiculo", termos: /financiamento.*(ve[íi]culo|auto|carro|moto)|cdc\s*ve[íi]culo/i },
  { categoria: "crediario_loja", termos: /crediário|carn[êe]|loja/i },
  { categoria: "credito_pessoal_nao_consignado", termos: /empr[ée]stimo|cr[ée]dito\s*pessoal/i },
];

export function detectarCategoria(produtoServico: string): CategoriaProduto {
  for (const { categoria, termos } of PALAVRAS_CHAVE) {
    if (termos.test(produtoServico)) return categoria;
  }
  return "outros";
}

export function faixaParaCategoria(categoria: CategoriaProduto): FaixaReferencia | null {
  return FAIXAS_REFERENCIA.find((f) => f.categoria === categoria) ?? null;
}
