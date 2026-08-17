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
  it("aloca dívida única dentro da margem disponível", () => {
    const plano = montarPlanoRecuperacao({
      rendaMensal: 5000,
      gastosEssenciais: 3000,
      dividas: [dividaBase],
    });
    expect(plano.margemDisponivel).toBe(2000);
    expect(plano.simulacoes[0].alocada).toBe(true);
    expect(plano.simulacoes[0].parcelado?.valorParcela).toBeLessThanOrEqual(2000);
  });

  it("prioriza por taxa de juros na estratégia avalanche", () => {
    const dividaJurosAlto: DividaParaPlano = { ...dividaBase, id: "2", taxaMensalImplicita: 0.2, valorAtual: 500 };
    const dividaJurosBaixo: DividaParaPlano = { ...dividaBase, id: "3", taxaMensalImplicita: 0.01, valorAtual: 500 };
    const plano = montarPlanoRecuperacao({
      rendaMensal: 5000,
      gastosEssenciais: 4900,
      dividas: [dividaJurosBaixo, dividaJurosAlto],
      estrategia: "avalanche",
    });
    expect(plano.simulacoes[0].dividaId).toBe("2");
  });

  it("marca dívida como não alocada quando não cabe no orçamento", () => {
    const dividaGrande: DividaParaPlano = { ...dividaBase, valorAtual: 100000 };
    const plano = montarPlanoRecuperacao({
      rendaMensal: 3000,
      gastosEssenciais: 2900,
      dividas: [dividaGrande],
    });
    expect(plano.simulacoes[0].alocada).toBe(false);
    expect(plano.recomendarRepactuacaoJudicial).toBe(true);
  });

  it("recomenda revisar orçamento quando margem é negativa", () => {
    const plano = montarPlanoRecuperacao({
      rendaMensal: 2000,
      gastosEssenciais: 2500,
      dividas: [dividaBase],
    });
    expect(plano.margemDisponivel).toBeLessThan(0);
    expect(plano.observacoes.some((o) => o.includes("gastos essenciais"))).toBe(true);
  });
});
