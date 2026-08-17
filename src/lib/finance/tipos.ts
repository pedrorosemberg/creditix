export type EstrategiaPriorizacao = "avalanche" | "bola_de_neve" | "juridica_primeiro";

export type DividaParaPlano = {
  id: string;
  credorNome: string;
  valorAtual: number;
  percentualDescontoAvista: number | null;
  valorDescontoAvista: number | null;
  taxaMensalImplicita: number | null;
  veredictoJuridico:
    | "dentro_da_faixa"
    | "zona_de_atencao"
    | "provavelmente_abusivo"
    | "acima_do_teto_legal"
    | "sem_dados_suficientes";
};

export type OpcaoAvista = {
  modalidade: "avista";
  valorTotal: number;
  economia: number;
};

export type OpcaoParcelada = {
  modalidade: "parcelado";
  numParcelas: number;
  valorParcela: number;
  valorTotal: number;
};

export type SimulacaoDivida = {
  dividaId: string;
  credorNome: string;
  avista: OpcaoAvista;
  parcelado: OpcaoParcelada | null;
  alocada: boolean;
  motivoNaoAlocada?: string;
};

export type PlanoRecuperacao = {
  rendaMensal: number;
  gastosEssenciais: number;
  margemDisponivel: number;
  comprometidoMensal: number;
  saldoLivreAposPlano: number;
  estrategia: EstrategiaPriorizacao;
  simulacoes: SimulacaoDivida[];
  recomendarRepactuacaoJudicial: boolean;
  observacoes: string[];
};

export type EntradaPlanoRecuperacao = {
  rendaMensal: number;
  gastosEssenciais: number;
  dividas: DividaParaPlano[];
  estrategia?: EstrategiaPriorizacao;
  maxParcelas?: number;
  minParcelasIdeal?: number;
};
