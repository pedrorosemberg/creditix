import type { StatusDividaDb, TipoTransacaoDb } from "@/types/database.types";

export type SecaoRelatorio = "dividas" | "transacoes" | "recuperacao";

export const SECOES_RELATORIO: SecaoRelatorio[] = ["dividas", "transacoes", "recuperacao"];

export type FiltrosRelatorio = {
  inicio: string | null;
  fim: string | null;
  secoes: SecaoRelatorio[];
  dividaIds: string[];
  statusDivida: StatusDividaDb[];
  tipoTransacao: TipoTransacaoDb[];
};
