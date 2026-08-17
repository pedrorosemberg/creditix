import type {
  DividaParaPlano,
  EntradaPlanoRecuperacao,
  EstrategiaPriorizacao,
  OpcaoAvista,
  OpcaoParcelada,
  PlanoRecuperacao,
  SimulacaoDivida,
} from "./tipos";

const PESO_VEREDICTO: Record<DividaParaPlano["veredictoJuridico"], number> = {
  acima_do_teto_legal: 0,
  provavelmente_abusivo: 1,
  zona_de_atencao: 2,
  sem_dados_suficientes: 3,
  dentro_da_faixa: 4,
};

export function calcularOpcaoAvista(divida: DividaParaPlano): OpcaoAvista {
  const valorTotal =
    divida.valorDescontoAvista ??
    (divida.percentualDescontoAvista
      ? divida.valorAtual * (1 - divida.percentualDescontoAvista / 100)
      : divida.valorAtual);

  return {
    modalidade: "avista",
    valorTotal: Number(valorTotal.toFixed(2)),
    economia: Number((divida.valorAtual - valorTotal).toFixed(2)),
  };
}

export function calcularOpcaoParcelada(valorAtual: number, numParcelas: number): OpcaoParcelada {
  const valorParcela = Number((valorAtual / numParcelas).toFixed(2));
  return {
    modalidade: "parcelado",
    numParcelas,
    valorParcela,
    valorTotal: valorAtual,
  };
}

function ordenarDividas(dividas: DividaParaPlano[], estrategia: EstrategiaPriorizacao): DividaParaPlano[] {
  const copia = [...dividas];
  switch (estrategia) {
    case "juridica_primeiro":
      return copia.sort(
        (a, b) => PESO_VEREDICTO[a.veredictoJuridico] - PESO_VEREDICTO[b.veredictoJuridico],
      );
    case "bola_de_neve":
      return copia.sort((a, b) => a.valorAtual - b.valorAtual);
    case "avalanche":
    default:
      return copia.sort((a, b) => (b.taxaMensalImplicita ?? 0) - (a.taxaMensalImplicita ?? 0));
  }
}

/**
 * Monta um plano de recuperação alocando a margem mensal disponível
 * (renda - gastos essenciais) entre as dívidas, na ordem definida pela
 * estratégia escolhida. Para cada dívida tenta o prazo mais curto possível
 * (minParcelasIdeal) e, se não couber, estende até maxParcelas antes de
 * marcá-la como não alocável no momento.
 */
export function montarPlanoRecuperacao(entrada: EntradaPlanoRecuperacao): PlanoRecuperacao {
  const { rendaMensal, gastosEssenciais, dividas, estrategia = "avalanche" } = entrada;
  const maxParcelas = entrada.maxParcelas ?? 24;
  const minParcelasIdeal = entrada.minParcelasIdeal ?? 6;

  const margemDisponivel = Number((rendaMensal - gastosEssenciais).toFixed(2));
  const ordenadas = ordenarDividas(dividas, estrategia);

  let margemRestante = margemDisponivel;
  const observacoes: string[] = [];
  const simulacoes: SimulacaoDivida[] = [];

  for (const divida of ordenadas) {
    const avista = calcularOpcaoAvista(divida);
    let parcelado: OpcaoParcelada | null = null;
    let alocada = false;
    let motivoNaoAlocada: string | undefined;

    if (margemRestante <= 0) {
      motivoNaoAlocada = "Margem mensal já comprometida com as dívidas de maior prioridade.";
    } else {
      for (let n = minParcelasIdeal; n <= maxParcelas; n += n < 12 ? 3 : 6) {
        const opcao = calcularOpcaoParcelada(divida.valorAtual, n);
        if (opcao.valorParcela <= margemRestante) {
          parcelado = opcao;
          alocada = true;
          margemRestante = Number((margemRestante - opcao.valorParcela).toFixed(2));
          break;
        }
      }
      if (!alocada) {
        const opcaoMaxima = calcularOpcaoParcelada(divida.valorAtual, maxParcelas);
        parcelado = opcaoMaxima;
        motivoNaoAlocada = `Mesmo em ${maxParcelas}x, a parcela (R$ ${opcaoMaxima.valorParcela.toFixed(2)}) excede a margem mensal restante (R$ ${margemRestante.toFixed(2)}).`;
      }
    }

    simulacoes.push({
      dividaId: divida.id,
      credorNome: divida.credorNome,
      avista,
      parcelado,
      alocada,
      motivoNaoAlocada,
    });
  }

  const comprometidoMensal = Number((margemDisponivel - margemRestante).toFixed(2));
  const naoAlocadas = simulacoes.filter((s) => !s.alocada);

  const totalDividas = dividas.reduce((acc, d) => acc + d.valorAtual, 0);
  const recomendarRepactuacaoJudicial =
    naoAlocadas.length > 0 && (margemDisponivel <= 0 || totalDividas > rendaMensal * 12);

  if (margemDisponivel <= 0) {
    observacoes.push(
      "A renda mensal informada não cobre os gastos essenciais — priorize revisar o orçamento antes de assumir novos parcelamentos.",
    );
  }
  if (naoAlocadas.length > 0) {
    observacoes.push(
      `${naoAlocadas.length} dívida(s) não couberam integralmente no orçamento mensal atual, mesmo em ${maxParcelas}x.`,
    );
  }
  if (recomendarRepactuacaoJudicial) {
    observacoes.push(
      "O volume total de dívidas em relação à renda sugere avaliar a repactuação global judicial prevista na Lei do Superendividamento (Lei 14.181/2021), reunindo todos os credores em uma única negociação supervisionada.",
    );
  }

  return {
    rendaMensal,
    gastosEssenciais,
    margemDisponivel,
    comprometidoMensal,
    saldoLivreAposPlano: Number((margemDisponivel - comprometidoMensal).toFixed(2)),
    estrategia,
    simulacoes,
    recomendarRepactuacaoJudicial,
    observacoes,
  };
}
