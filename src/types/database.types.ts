/**
 * Tipos do banco escritos manualmente a partir de
 * supabase/migrations/20260817000000_init_schema.sql.
 *
 * Se você tiver um projeto Supabase real (cloud ou self-hosted acessível),
 * prefira gerar estes tipos automaticamente:
 *   npx supabase gen types typescript --local > src/types/database.types.ts
 */

export type TipoCredorDb = "instituicao_financeira" | "nao_financeiro";
export type StatusDividaDb =
  | "ativa"
  | "negociando"
  | "acordo_fechado"
  | "quitada"
  | "contestada"
  | "em_processo_judicial";
export type RecorrenciaDb = "mensal" | "unica";
export type TipoTransacaoDb = "receita" | "despesa" | "pagamento_divida";
export type ModalidadePagamentoDb = "avista" | "parcelado";
export type StatusPlanoDb = "simulado" | "proposto" | "aceito" | "recusado";
export type ProvedorIaDb = "ollama" | "gemini" | "local";
export type FrequenciaLembreteDb = "semanal" | "quinzenal" | "mensal";

export type Profile = {
  id: string;
  display_name: string | null;
  renda_mensal: number | null;
  avatar_url: string | null;
  lembrete_email: boolean;
  lembrete_dia_mes: number;
  lembrete_frequencia: FrequenciaLembreteDb;
  lembrete_dia_semana: number;
  lembrete_dividas: boolean;
  lembrete_contas: boolean;
  lembrete_preencher_transacoes: boolean;
  created_at: string;
  updated_at: string;
};

export type Debt = {
  id: string;
  user_id: string;
  credor_nome: string;
  credor_documento: string | null;
  numero_contrato: string | null;
  produto_servico: string;
  tipo_credor: TipoCredorDb;
  data_contratacao: string | null;
  data_vencimento: string | null;
  valor_original: number;
  valor_atual: number;
  negativado: boolean;
  data_negativacao: string | null;
  percentual_desconto_avista: number | null;
  valor_desconto_avista: number | null;
  status: StatusDividaDb;
  fonte: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Income = {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  recorrencia: RecorrenciaDb;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  recorrencia: RecorrenciaDb;
  dia_vencimento: number | null;
  essencial: boolean;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  debt_id: string | null;
  descricao: string;
  categoria: string;
  tipo: TipoTransacaoDb;
  valor: number;
  data: string;
  recorrente: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoveryPlanSnapshot = {
  id: string;
  user_id: string;
  renda_mensal_considerada: number;
  gastos_essenciais_considerados: number;
  margem_disponivel: number;
  estrategia: string;
  plano: unknown;
  created_at: string;
};

export type DebtPaymentPlan = {
  id: string;
  user_id: string;
  debt_id: string;
  modalidade: ModalidadePagamentoDb;
  num_parcelas: number | null;
  valor_parcela: number | null;
  valor_total: number;
  status: StatusPlanoDb;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type AiAnalysis = {
  id: string;
  user_id: string;
  debt_id: string | null;
  provider: ProvedorIaDb;
  model: string;
  content: string;
  structured: unknown;
  created_at: string;
};

export type ReminderSend = {
  id: string;
  user_id: string;
  mes_referencia: string;
  destinatario: string;
  status: string;
  resend_id: string | null;
  created_at: string;
};

export type EmailEvent = {
  id: string;
  resend_email_id: string | null;
  event_type: string;
  payload: unknown;
  created_at: string;
};

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string }>;
      debts: TableDef<
        Debt,
        Omit<Debt, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      incomes: TableDef<
        Income,
        Omit<Income, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      expenses: TableDef<
        Expense,
        Omit<Expense, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      transactions: TableDef<
        Transaction,
        Omit<Transaction, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      recovery_plan_snapshots: TableDef<
        RecoveryPlanSnapshot,
        Omit<RecoveryPlanSnapshot, "id" | "created_at"> & { id?: string }
      >;
      debt_payment_plans: TableDef<
        DebtPaymentPlan,
        Omit<DebtPaymentPlan, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      ai_analyses: TableDef<
        AiAnalysis,
        Omit<AiAnalysis, "id" | "created_at"> & { id?: string }
      >;
      reminder_sends: TableDef<
        ReminderSend,
        Omit<ReminderSend, "id" | "created_at"> & { id?: string }
      >;
      email_events: TableDef<
        EmailEvent,
        Omit<EmailEvent, "id" | "created_at"> & { id?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
