import { describe, expect, it } from "vitest";
import { somaMensalEquivalente, valorMensalEquivalente } from "./periodicidade";

describe("valorMensalEquivalente", () => {
  it("mantém o valor mensal como está", () => {
    expect(valorMensalEquivalente(1000, "mensal")).toBe(1000);
  });

  it("converte anual e semestral pra fração mensal", () => {
    expect(valorMensalEquivalente(1200, "anual")).toBeCloseTo(100, 5);
    expect(valorMensalEquivalente(600, "semestral")).toBeCloseTo(100, 5);
  });

  it("converte semanal e quinzenal pro equivalente mensal", () => {
    expect(valorMensalEquivalente(100, "semanal")).toBeCloseTo(433.33, 1);
    expect(valorMensalEquivalente(100, "quinzenal")).toBeCloseTo(216.67, 1);
  });

  it("não conta um valor 'única' como recorrência mensal", () => {
    expect(valorMensalEquivalente(5000, "unica")).toBe(0);
  });
});

describe("somaMensalEquivalente", () => {
  it("soma itens de periodicidades diferentes no equivalente mensal, ignorando 'única'", () => {
    const total = somaMensalEquivalente([
      { valor: 1000, recorrencia: "mensal" },
      { valor: 1200, recorrencia: "anual" },
      { valor: 9999, recorrencia: "unica" },
    ]);
    expect(total).toBeCloseTo(1100, 5);
  });
});
