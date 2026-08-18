import { describe, expect, it } from "vitest";
import { montarAnaliseSimples } from "./simples";
import type { DividaParaPlano } from "@/lib/finance/tipos";

const dividaA: DividaParaPlano = {
  id: "a",
  credorNome: "Banco A",
  valorAtual: 1000,
  percentualDescontoAvista: 20,
  valorDescontoAvista: null,
  taxaMensalImplicita: 0.05,
  veredictoJuridico: "dentro_da_faixa",
};

const dividaB: DividaParaPlano = {
  ...dividaA,
  id: "b",
  credorNome: "Banco B",
  valorAtual: 500,
  percentualDescontoAvista: null,
};

describe("montarAnaliseSimples", () => {
  it("calcula meses para quitar cada dívida sozinha por divisão simples", () => {
    const analise = montarAnaliseSimples({ margemMensal: 250, dividas: [dividaA, dividaB] });
    const a = analise.individuais.find((i) => i.dividaId === "a")!;
    const b = analise.individuais.find((i) => i.dividaId === "b")!;

    expect(a.valorAvista).toBe(800); // 20% de desconto
    expect(a.mesesSozinhaAvista).toBe(Math.ceil(800 / 250));
    expect(b.valorAvista).toBe(500); // sem desconto
    expect(b.mesesSozinha).toBe(2);
  });

  it("calcula o total e os meses para quitar tudo em sequência", () => {
    const analise = montarAnaliseSimples({ margemMensal: 300, dividas: [dividaA, dividaB] });
    expect(analise.totalDividas).toBe(1500);
    expect(analise.mesesTodasSequencial).toBe(Math.ceil(1500 / 300));
    expect(analise.totalAvista).toBe(1300); // 800 + 500
    expect(analise.mesesTodasAvista).toBe(Math.ceil(1300 / 300));
  });

  it("retorna null quando não há margem mensal disponível", () => {
    const analise = montarAnaliseSimples({ margemMensal: 0, dividas: [dividaA] });
    expect(analise.individuais[0].mesesSozinha).toBeNull();
    expect(analise.mesesTodasSequencial).toBeNull();
  });
});
