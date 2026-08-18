import type {
  DividaParaPlano,
  EntradaPlanoRecuperacao,
  EstrategiaPriorizacao,
  ModalidadeEscolhida,
  OpcaoAvista,
  OpcaoParcelada,
  PassoTimeline,
  PlanoRecuperacao,
  ResultadoDividaPlano,
} from "./tipos";

const PESO_VEREDICTO: Record<DividaParaPlano["veredictoJuridico"], number> = {
  acima_do_teto_legal: 0,
  provavelmente_abusivo: 1,
  zona_de_atencao: 2,
  sem_dados_suficientes: 3,
  dentro_da_faixa: 4,
};

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularOpcaoAvista(divida: DividaParaPlano): OpcaoAvista {
  const valorTotal =
    divida.valorDescontoAvista ??
    (divida.percentualDescontoAvista
      ? divida.valorAtual * (1 - divida.percentualDescontoAvista / 100)
      : divida.valorAtual);

  return {
    modalidade: "avista",
    valorTotal: arredondar(valorTotal),
    economia: arredondar(divida.valorAtual - valorTotal),
  };
}

export function calcularOpcaoParcelada(valorAtual: number, numParcelas: number): OpcaoParcelada {
  const valorParcela = arredondar(valorAtual / numParcelas);
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

function planoVazio(entrada: {
  rendaMensal: number;
  gastosEssenciais: number;
  margemDisponivel: number;
  reservaSeguranca: number;
  margemParaDividas: number;
  estrategia: EstrategiaPriorizacao;
  janelaAcumulacaoMeses: number;
  dividas: DividaParaPlano[];
  observacoes: string[];
}): PlanoRecuperacao {
  const resultados: ResultadoDividaPlano[] = entrada.dividas.map((d) => ({
    dividaId: d.id,
    credorNome: d.credorNome,
    avista: calcularOpcaoAvista(d),
    modalidadeEscolhida: "nao_alocada",
    mesQuitacao: null,
    mesInicioParcelamento: null,
    parcelado: null,
    motivo: "Sem margem mensal disponível para comprometer com dívidas no momento.",
  }));

  return {
    rendaMensal: entrada.rendaMensal,
    gastosEssenciais: entrada.gastosEssenciais,
    margemDisponivel: entrada.margemDisponivel,
    reservaSeguranca: entrada.reservaSeguranca,
    margemParaDividas: entrada.margemParaDividas,
    estrategia: entrada.estrategia,
    janelaAcumulacaoMeses: entrada.janelaAcumulacaoMeses,
    resultados,
    timeline: [],
    totalEconomizadoComDescontos: 0,
    recomendarRepactuacaoJudicial: resultados.length > 0,
    observacoes: entrada.observacoes,
  };
}

/**
 * Monta um plano de recuperação priorizando juntar a margem mensal por
 * algumas poucas parcelas (janelaAcumulacaoMeses) e quitar dívidas à
 * vista sequencialmente — em vez de parcelar tudo em paralelo, o que na
 * prática soma um compromisso mensal inviável (ex.: 3 dívidas em 24x
 * simultâneas). Só recorre a parcelamento para o que sobrar depois da
 * janela de acúmulo, sempre dentro da margem mensal disponível. Nunca
 * propõe empréstimo/crédito novo, e reserva uma fração da margem (mínimo
 * existencial) que nunca é comprometida com dívidas.
 */
export function montarPlanoRecuperacao(entrada: EntradaPlanoRecuperacao): PlanoRecuperacao {
  const {
    rendaMensal,
    gastosEssenciais,
    dividas,
    estrategia = "avalanche",
    janelaAcumulacaoMeses = 2,
    percentualReservaSeguranca = 0.15,
    maxParcelas = 24,
    minParcelasIdeal = 3,
    horizonteMaximoMeses = 12,
  } = entrada;

  const margemDisponivel = arredondar(rendaMensal - gastosEssenciais);
  const reservaSeguranca = arredondar(Math.max(margemDisponivel, 0) * percentualReservaSeguranca);
  const margemParaDividas = arredondar(Math.max(margemDisponivel - reservaSeguranca, 0));

  if (dividas.length === 0) {
    return planoVazio({
      rendaMensal,
      gastosEssenciais,
      margemDisponivel,
      reservaSeguranca,
      margemParaDividas,
      estrategia,
      janelaAcumulacaoMeses,
      dividas,
      observacoes: [],
    });
  }

  if (margemParaDividas <= 0) {
    return planoVazio({
      rendaMensal,
      gastosEssenciais,
      margemDisponivel,
      reservaSeguranca,
      margemParaDividas,
      estrategia,
      janelaAcumulacaoMeses,
      dividas,
      observacoes: [
        "A renda mensal informada não deixa margem após os gastos essenciais e a reserva de segurança (mínimo existencial). Reveja o orçamento antes de comprometer qualquer valor com dívidas — nenhum plano deve propor isso.",
      ],
    });
  }

  const ordenadas = ordenarDividas(dividas, estrategia);
  const resultados = new Map<string, ResultadoDividaPlano>(
    ordenadas.map((d) => [
      d.id,
      {
        dividaId: d.id,
        credorNome: d.credorNome,
        avista: calcularOpcaoAvista(d),
        modalidadeEscolhida: "nao_alocada" as ModalidadeEscolhida,
        mesQuitacao: null,
        mesInicioParcelamento: null,
        parcelado: null,
        motivo: "",
      },
    ]),
  );

  const timeline: PassoTimeline[] = [];
  const observacoes: string[] = [];
  const fila = [...ordenadas];
  let pot = 0;
  let mes = 0;

  // Fase 1 — juntar a margem mensal e quitar à vista sequencialmente,
  // na ordem de prioridade, enquanto durar a janela de acúmulo.
  while (fila.length > 0 && mes < janelaAcumulacaoMeses) {
    mes += 1;
    pot = arredondar(pot + margemParaDividas);
    timeline.push({ mes, evento: "acumulo", potAcumulado: pot });

    let avancou = true;
    while (avancou && fila.length > 0) {
      avancou = false;
      const proxima = fila[0];
      const avista = calcularOpcaoAvista(proxima);
      if (avista.valorTotal <= pot) {
        pot = arredondar(pot - avista.valorTotal);
        const r = resultados.get(proxima.id)!;
        r.modalidadeEscolhida = "avista_acumulado";
        r.mesQuitacao = mes;
        r.motivo = `Quitada à vista no mês ${mes} com o valor juntado${
          avista.economia > 0 ? ` (economia de ${avista.economia.toFixed(2)} com o desconto)` : ""
        }.`;
        timeline.push({ mes, evento: "pagamento_avista", dividaId: proxima.id, credorNome: proxima.credorNome, valor: avista.valorTotal });
        fila.shift();
        avancou = true;
      }
    }
  }

  // Fase 2 — o que sobrou depois da janela de acúmulo: o valor ainda
  // guardado (se houver) abate diretamente a próxima dívida da fila, e o
  // restante é parcelado dentro da margem mensal (agora livre das
  // dívidas já quitadas na fase 1).
  const mesInicioParcelamento = Math.max(mes, 1);
  let margemRestante = margemParaDividas;
  let potResidual = pot;

  for (const divida of fila) {
    const r = resultados.get(divida.id)!;
    let valorBase = divida.valorAtual;
    let prefixoMotivo = "";

    if (potResidual > 0) {
      const abatimento = arredondar(Math.min(potResidual, valorBase));
      valorBase = arredondar(valorBase - abatimento);
      potResidual = arredondar(potResidual - abatimento);
      prefixoMotivo = `Abatida em ${abatimento.toFixed(2)} com o valor já juntado. `;
    }

    if (valorBase <= 0.01) {
      r.modalidadeEscolhida = "avista_acumulado";
      r.mesQuitacao = mesInicioParcelamento;
      r.motivo = `${prefixoMotivo}Quitada integralmente no mês ${mesInicioParcelamento} com o saldo acumulado.`;
      timeline.push({
        mes: mesInicioParcelamento,
        evento: "pagamento_avista",
        dividaId: divida.id,
        credorNome: divida.credorNome,
        valor: divida.valorAtual,
      });
      continue;
    }

    let alocada = false;
    for (let n = minParcelasIdeal; n <= maxParcelas; n += n < 12 ? 3 : 6) {
      const opcao = calcularOpcaoParcelada(valorBase, n);
      if (opcao.valorParcela <= margemRestante) {
        r.modalidadeEscolhida = "parcelado";
        r.parcelado = opcao;
        r.mesInicioParcelamento = mesInicioParcelamento;
        r.mesQuitacao = mesInicioParcelamento + n - 1;
        r.motivo = `${prefixoMotivo}Parcelada em ${n}x de ${opcao.valorParcela.toFixed(2)} a partir do mês ${mesInicioParcelamento} — só o necessário foi parcelado, o resto já foi quitado à vista.`;
        timeline.push({
          mes: mesInicioParcelamento,
          evento: "inicio_parcelamento",
          dividaId: divida.id,
          credorNome: divida.credorNome,
          numParcelas: n,
          valorParcela: opcao.valorParcela,
        });
        margemRestante = arredondar(margemRestante - opcao.valorParcela);
        alocada = true;
        break;
      }
    }

    if (!alocada) {
      const opcaoMaxima = calcularOpcaoParcelada(valorBase, maxParcelas);
      r.modalidadeEscolhida = "nao_alocada";
      r.parcelado = opcaoMaxima;
      r.motivo = `${prefixoMotivo}Mesmo em ${maxParcelas}x, a parcela (${opcaoMaxima.valorParcela.toFixed(2)}) excede a margem mensal restante (${margemRestante.toFixed(2)}) sem mexer na reserva de segurança.`;
    }

    if (horizonteMaximoMeses > 0 && r.mesQuitacao && r.mesQuitacao > horizonteMaximoMeses) {
      observacoes.push(
        `A dívida de ${divida.credorNome} só quitaria dentro de ${r.mesQuitacao} meses no ritmo atual — vale renegociar prazo/desconto diretamente com o credor.`,
      );
    }
  }

  const resultadosArray = ordenadas.map((d) => resultados.get(d.id)!);
  const naoAlocadas = resultadosArray.filter((r) => r.modalidadeEscolhida === "nao_alocada");
  const totalDividas = dividas.reduce((acc, d) => acc + d.valorAtual, 0);
  const recomendarRepactuacaoJudicial = naoAlocadas.length > 0 && totalDividas > rendaMensal * 12;

  if (naoAlocadas.length > 0) {
    observacoes.push(
      `${naoAlocadas.length} dívida(s) não couberam no orçamento mesmo parceladas no limite — nenhum plano deve resolver isso com empréstimo novo; considere renegociar diretamente ou buscar repactuação (Lei 14.181/2021).`,
    );
  }
  if (recomendarRepactuacaoJudicial) {
    observacoes.push(
      "O volume total de dívidas em relação à renda sugere avaliar a repactuação global judicial prevista na Lei do Superendividamento, reunindo todos os credores em uma única negociação supervisionada.",
    );
  }

  const totalEconomizadoComDescontos = arredondar(
    resultadosArray
      .filter((r) => r.modalidadeEscolhida === "avista_acumulado")
      .reduce((acc, r) => acc + r.avista.economia, 0),
  );

  return {
    rendaMensal,
    gastosEssenciais,
    margemDisponivel,
    reservaSeguranca,
    margemParaDividas,
    estrategia,
    janelaAcumulacaoMeses,
    resultados: resultadosArray,
    timeline,
    totalEconomizadoComDescontos,
    recomendarRepactuacaoJudicial,
    observacoes,
  };
}
