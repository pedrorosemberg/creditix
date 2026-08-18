import { describe, expect, it } from "vitest";
import { saoEquivalentes, saoParecidos } from "./dedupe";

describe("saoEquivalentes", () => {
  it("ignora maiúsculas, acentos e espaços nas pontas", () => {
    expect(saoEquivalentes("Salário", "  salario  ")).toBe(true);
    expect(saoEquivalentes("Aluguel", "Internet")).toBe(false);
  });
});

describe("saoParecidos", () => {
  it("reconhece variações com palavras em comum", () => {
    expect(saoParecidos("Salário", "Salário CLT")).toBe(true);
    expect(saoParecidos("Aluguel do apartamento", "Aluguel apartamento")).toBe(true);
  });

  it("não confunde descrições sem relação", () => {
    expect(saoParecidos("Aluguel", "Internet")).toBe(false);
  });
});
