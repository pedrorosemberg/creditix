import type { StatusDividaDb, TipoTransacaoDb } from "@/types/database.types";

export const STATUS_DIVIDA_LABEL: Record<StatusDividaDb, string> = {
  ativa: "Ativa",
  negociando: "Negociando",
  acordo_fechado: "Acordo fechado",
  quitada: "Quitada",
  contestada: "Contestada",
  em_processo_judicial: "Em processo judicial",
};

export const TIPO_TRANSACAO_LABEL: Record<TipoTransacaoDb, string> = {
  receita: "Receita",
  despesa: "Despesa",
  pagamento_divida: "Pagamento de dívida",
};
