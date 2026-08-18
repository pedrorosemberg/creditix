import { describe, expect, it } from "vitest";
import { calcularOpcaoAvista, montarPlanoRecuperacao } from "./recovery-plan";
import type { DividaParaPlano } from "./tipos";

const dividaBase: DividaParaPlano = {
  id: "1",
  credorNome: "Banco X",
  valorAtual: 1000,
  percentualDescontoAvista: 20,
  valorDescontoAvista: null,
  taxaMensalImplicita: 0.05,
  veredictoJuridico: "dentro_da_faixa",
};

describe("calcularOpcaoAvista", () => {
  it("aplica percentual de desconto quando não há valor fixo", () => {
    const r = calcularOpcaoAvista(dividaBase);
    expect(r.valorTotal).toBe(800);
    expect(r.economia).toBe(200);
  });

  it("prioriza valor fixo de desconto quando informado", () => {
    const r = calcularOpcaoAvista({ ...dividaBase, valorDescontoAvista: 750 });
    expect(r.valorTotal).toBe(750);
  });

  it("sem desconto, valor à vista é igual ao valor atual", () => {
    const r = calcularOpcaoAvista({ ...dividaBase, percentualDescontoAvista: null });
    expect(r.valorTotal).toBe(1000);
    expect(r.economia).toBe(0);
  });
});

describe("montarPlanoRecuperacao", () => {
  it("reserva uma fração da margem como mínimo existencial, nunca comprometida com dívidas", () => {
    const plano = montarPlanoRecuperacao({
      rendaMensal: 5000,
      gastosEssenciais: 3000,
      dividas: [dividaBase],
    });
    expect(plano.margemDisponivel).toBe(2000);
    expect(plano.reservaSeguranca).toBe(300); // 15% padrão
    expect(plano.margemParaDividas).toBe(1700);
  });

  it("quita à vista em vez de parcelar quando o valor cabe na margem acumulada", () => {
    // Dívida de 800 (com desconto) cabe na primeira acumulação de margem 1000.
    const plano = montarPlanoRecuperacao({
      rendaMensal: 4000,
      gastosEssenciais: 2823.53, // margem 1176,47 -> reserva 15% -> ~1000 para dívidas
      dividas: [dividaBase],
    });
    const resultado = plano.resultados[0];
    expect(resultado.modalidadeEscolhida).toBe("avista_acumulado");
    expect(resultado.parcelado).toBeNull();
    expect(plano.totalEconomizadoComDescontos).toBe(200);
  });

  it("prioriza quitar a primeira dívida à vista antes de parcelar a segunda em paralelo", () => {
    // Duas dívidas de 800 (à vista) cada; margem para dívidas de 900/mês.
    // Antes: parcelaria as duas em paralelo. Agora: quita a primeira no
    // mês 1 e usa a sobra + acúmulo do mês 2 para resolver a segunda,
    // evitando duas parcelas simultâneas.
    const dividaA: DividaParaPlano = { ...dividaBase, id: "a", credorNome: "A", taxaMensalImplicita: 0.2 };
    const dividaB: DividaParaPlano = { ...dividaBase, id: "b", credorNome: "B", taxaMensalImplicita: 0.1 };
    const plano = montarPlanoRecuperacao({
      rendaMensal: 3058.82,
      gastosEssenciais: 2000, // margem 1058,82 -> reserva 15% -> margemParaDividas = 900
      dividas: [dividaA, dividaB],
      estrategia: "avalanche",
    });

    const resultadoA = plano.resultados.find((r) => r.dividaId === "a")!;
    const resultadoB = plano.resultados.find((r) => r.dividaId === "b")!;
    expect(resultadoA.modalidadeEscolhida).toBe("avista_acumulado");
    expect(resultadoA.mesQuitacao).toBe(1);
    expect(resultadoB.modalidadeEscolhida).toBe("avista_acumulado");
    // nenhuma das duas deveria ter sido parcelada em paralelo
    expect(resultadoA.parcelado).toBeNull();
    expect(resultadoB.parcelado).toBeNull();
  });

  it("só parcela o que sobra depois da janela de acúmulo, dentro da margem", () => {
    const dividaGrande: DividaParaPlano = {
      ...dividaBase,
      id: "grande",
      valorAtual: 10000,
      percentualDescontoAvista: null,
      taxaMensalImplicita: 0.3,
    };
    const plano = montarPlanoRecuperacao({
      rendaMensal: 3000,
      gastosEssenciais: 2000, // margem 1000 -> reserva 150 -> margemParaDividas 850
      dividas: [dividaGrande],
      janelaAcumulacaoMeses: 2,
    });
    const resultado = plano.resultados[0];
    expect(resultado.modalidadeEscolhida).toBe("parcelado");
    expect(resultado.parcelado!.valorParcela).toBeLessThanOrEqual(850);
    // o valor parcelado já deve estar líquido do que foi acumulado nos 2 meses (2 * 850 = 1700)
    expect(resultado.parcelado!.valorTotal).toBeLessThan(10000);
  });

  it("nunca propõe plano quando a margem some após a reserva de segurança", () => {
    const plano = montarPlanoRecuperacao({
      rendaMensal: 2000,
      gastosEssenciais: 2000,
      dividas: [dividaBase],
    });
    expect(plano.margemParaDividas).toBe(0);
    expect(plano.resultados[0].modalidadeEscolhida).toBe("nao_alocada");
    expect(plano.observacoes.some((o) => o.includes("mínimo existencial"))).toBe(true);
  });

  it("recomenda repactuação judicial quando o total de dívidas é muito maior que a renda anual", () => {
    const dividaEnorme: DividaParaPlano = {
      ...dividaBase,
      id: "enorme",
      valorAtual: 200000,
      percentualDescontoAvista: null,
    };
    const plano = montarPlanoRecuperacao({
      rendaMensal: 2000,
      gastosEssenciais: 1500,
      dividas: [dividaEnorme],
    });
    expect(plano.recomendarRepactuacaoJudicial).toBe(true);
  });
});
