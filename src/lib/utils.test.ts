import { describe, expect, it } from "vitest";
import { formatarDataHora } from "./utils";

describe("formatarDataHora", () => {
  it("converte um timestamp UTC para o horário de Brasília (UTC-3)", () => {
    // 23:00 UTC de 17/08 é 20:00 em Brasília, ainda no mesmo dia.
    expect(formatarDataHora("2026-08-17T23:00:00Z")).toBe("17/08/2026, 20:00");
  });

  it("mostra o dia anterior quando o horário UTC já virou a meia-noite mas em Brasília ainda não", () => {
    // 01:30 UTC de 18/08 é 22:30 de 17/08 em Brasília — sem o fuso correto
    // isso apareceria como 18/08, um dia à frente do real.
    expect(formatarDataHora("2026-08-18T01:30:00Z")).toBe("17/08/2026, 22:30");
  });
});
