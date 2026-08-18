import { describe, expect, it } from "vitest";
import { gerarLinkIndicacao } from "./referral";

describe("gerarLinkIndicacao", () => {
  it("monta o link de cadastro com o código de indicação na query string", () => {
    const link = gerarLinkIndicacao("AB12CD34");
    const url = new URL(link);
    expect(url.pathname).toBe("/cadastro");
    expect(url.searchParams.get("ref")).toBe("AB12CD34");
  });
});
