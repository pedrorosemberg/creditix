import type { RecorrenciaDb } from "@/types/database.types";

export const RECORRENCIA_LABEL: Record<RecorrenciaDb, string> = {
  unica: "Única",
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  semestral: "Semestral",
  anual: "Anual",
};

export const RECORRENCIAS_ORDENADAS: RecorrenciaDb[] = [
  "unica",
  "diaria",
  "semanal",
  "quinzenal",
  "mensal",
  "semestral",
  "anual",
];

// Fator pra converter cada periodicidade num valor "por mês" comparável —
// mesma lógica de qualquer planilha de orçamento pessoal (mês médio de
// 30,44 dias = 365/12; semana = 52/12 semanas por mês). "única" não entra
// no total recorrente: é um valor pontual, não uma fonte de renda/gasto
// contínua, então não deve inflar a margem mensal do plano de recuperação.
const FATOR_MENSAL: Record<RecorrenciaDb, number> = {
  unica: 0,
  diaria: 30.44,
  semanal: 52 / 12,
  quinzenal: 26 / 12,
  mensal: 1,
  semestral: 1 / 6,
  anual: 1 / 12,
};

export function valorMensalEquivalente(valor: number, recorrencia: RecorrenciaDb): number {
  return valor * FATOR_MENSAL[recorrencia];
}

export function somaMensalEquivalente(
  itens: { valor: number | string; recorrencia: RecorrenciaDb }[],
): number {
  return itens.reduce((acc, item) => acc + valorMensalEquivalente(Number(item.valor), item.recorrencia), 0);
}
