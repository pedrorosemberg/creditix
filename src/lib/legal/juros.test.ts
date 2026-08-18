import { describe, expect, it } from "vitest";
import { analisarJuros } from "./juros";
import { verificarPrescricao } from "./prescricao";

const meses = (n: number) => new Date(2026, 0, 1 - n * 30);

describe("analisarJuros", () => {
  it("retorna sem_dados_suficientes quando faltam dados", () => {
    const r = analisarJuros({
      valorOriginal: 0,
      valorAtual: 100,
      dataInicio: null,
      tipoCredor: "instituicao_financeira",
      produtoServico: "Cartão de crédito",
    });
    expect(r.veredicto).toBe("sem_dados_suficientes");
  });

  it("classifica como acima_do_teto_legal para credor não financeiro acima de 1% a.m.", () => {
    // R$1000 -> R$1200 em 6 meses ≈ 3,09% a.m., bem acima de 1% a.m.
    const r = analisarJuros({
      valorOriginal: 1000,
      valorAtual: 1200,
      dataInicio: meses(6),
      dataReferencia: new Date(2026, 0, 1),
      tipoCredor: "nao_financeiro",
      produtoServico: "Crediário loja de móveis",
    });
    expect(r.veredicto).toBe("acima_do_teto_legal");
    expect(r.tetoLegalAplicavel).toBeCloseTo(0.01);
  });

  it("classifica como dentro_da_faixa para credor não financeiro dentro de 1% a.m.", () => {
    // R$1000 -> R$1025 em 3 meses ≈ 0,84% a.m.
    const r = analisarJuros({
      valorOriginal: 1000,
      valorAtual: 1025,
      dataInicio: meses(3),
      dataReferencia: new Date(2026, 0, 1),
      tipoCredor: "nao_financeiro",
      produtoServico: "Crediário loja",
    });
    expect(r.veredicto).toBe("dentro_da_faixa");
  });

  it("classifica cartão rotativo com taxa extrema como provavelmente_abusivo", () => {
    // R$1000 -> R$6000 em 6 meses ≈ 35% a.m., muito acima da faixa (8%-16%)
    const r = analisarJuros({
      valorOriginal: 1000,
      valorAtual: 6000,
      dataInicio: meses(6),
      dataReferencia: new Date(2026, 0, 1),
      tipoCredor: "instituicao_financeira",
      produtoServico: "Cartão de crédito rotativo",
    });
    expect(r.veredicto).toBe("provavelmente_abusivo");
    expect(r.categoriaDetectada).toBe("cartao_credito_rotativo");
  });

  it("classifica crédito consignado com taxa baixa como dentro_da_faixa", () => {
    // R$1000 -> R$1030 em 2 meses ≈ 1,49% a.m... ajustar para ficar dentro da faixa 1.2%-2.5%
    const r = analisarJuros({
      valorOriginal: 1000,
      valorAtual: 1020,
      dataInicio: meses(1),
      dataReferencia: new Date(2026, 0, 1),
      tipoCredor: "instituicao_financeira",
      produtoServico: "Empréstimo consignado",
    });
    expect(r.veredicto).toBe("dentro_da_faixa");
    expect(r.categoriaDetectada).toBe("credito_consignado");
  });
});

describe("verificarPrescricao", () => {
  it("indica possível prescrição após 5 anos", () => {
    const vencimento = new Date(2019, 0, 1);
    const r = verificarPrescricao(vencimento, new Date(2026, 0, 1));
    expect(r.possivelmentePrescrita).toBe(true);
  });

  it("não indica prescrição antes de 5 anos", () => {
    const vencimento = new Date(2023, 0, 1);
    const r = verificarPrescricao(vencimento, new Date(2026, 0, 1));
    expect(r.possivelmentePrescrita).toBe(false);
  });
});
