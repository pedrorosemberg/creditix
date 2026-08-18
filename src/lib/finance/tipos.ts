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

export type ModalidadeEscolhida = "avista_acumulado" | "parcelado" | "nao_alocada";

export type ResultadoDividaPlano = {
  dividaId: string;
  credorNome: string;
  avista: OpcaoAvista;
  modalidadeEscolhida: ModalidadeEscolhida;
  mesQuitacao: number | null;
  mesInicioParcelamento: number | null;
  parcelado: OpcaoParcelada | null;
  motivo: string;
};

export type PassoTimeline =
  | { mes: number; evento: "acumulo"; potAcumulado: number }
  | { mes: number; evento: "pagamento_avista"; dividaId: string; credorNome: string; valor: number }
  | {
      mes: number;
      evento: "inicio_parcelamento";
      dividaId: string;
      credorNome: string;
      numParcelas: number;
      valorParcela: number;
    };

export type PlanoRecuperacao = {
  rendaMensal: number;
  gastosEssenciais: number;
  margemDisponivel: number;
  reservaSeguranca: number;
  margemParaDividas: number;
  estrategia: EstrategiaPriorizacao;
  janelaAcumulacaoMeses: number;
  resultados: ResultadoDividaPlano[];
  timeline: PassoTimeline[];
  totalEconomizadoComDescontos: number;
  recomendarRepactuacaoJudicial: boolean;
  observacoes: string[];
};

export type EntradaPlanoRecuperacao = {
  rendaMensal: number;
  gastosEssenciais: number;
  dividas: DividaParaPlano[];
  estrategia?: EstrategiaPriorizacao;
  /** Quantos meses priorizar juntar dinheiro antes de considerar parcelamento. Padrão: 2. */
  janelaAcumulacaoMeses?: number;
  /** Fração da margem mensal mantida como reserva (mínimo existencial), nunca comprometida com dívidas. Padrão: 0.15. */
  percentualReservaSeguranca?: number;
  maxParcelas?: number;
  minParcelasIdeal?: number;
  horizonteMaximoMeses?: number;
};
