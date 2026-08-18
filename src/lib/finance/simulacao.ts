import { calcularOpcaoParcelada } from "./recovery-plan";
import type { OpcaoParcelada } from "./tipos";

const PARCELAS_PADRAO = [1, 3, 6, 12, 18, 24];

export function simularOpcoesParcelamento(
  valorAtual: number,
  opcoesParcelas: number[] = PARCELAS_PADRAO,
): OpcaoParcelada[] {
  return opcoesParcelas.map((n) => calcularOpcaoParcelada(valorAtual, n));
}
