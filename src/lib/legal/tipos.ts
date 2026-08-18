export type TipoCredor = "instituicao_financeira" | "nao_financeiro";

export type VeredictoJuros =
  | "dentro_da_faixa"
  | "zona_de_atencao"
  | "provavelmente_abusivo"
  | "acima_do_teto_legal"
  | "sem_dados_suficientes";

export type CategoriaProduto =
  | "cartao_credito_rotativo"
  | "cheque_especial"
  | "credito_pessoal_nao_consignado"
  | "credito_consignado"
  | "financiamento_veiculo"
  | "crediario_loja"
  | "outros";

export type FaixaReferencia = {
  categoria: CategoriaProduto;
  rotulo: string;
  taxaMensalMin: number;
  taxaMensalMax: number;
};

export type EntradaAnaliseJuros = {
  valorOriginal: number;
  valorAtual: number;
  dataInicio: Date | null;
  dataReferencia?: Date;
  tipoCredor: TipoCredor;
  produtoServico: string;
};

export type ResultadoAnaliseJuros = {
  meses: number | null;
  taxaMensalImplicita: number | null;
  taxaAnualImplicita: number | null;
  categoriaDetectada: CategoriaProduto;
  faixaReferencia: FaixaReferencia | null;
  tetoLegalAplicavel: number | null;
  veredicto: VeredictoJuros;
  explicacao: string;
  fundamentoIds: string[];
  proximosPassos: PassoRecomendado[];
};

export type PassoRecomendado = {
  titulo: string;
  descricao: string;
  fundamentoIds: string[];
};
