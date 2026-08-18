import { z } from "zod";

/**
 * Schemas de validação usados em Server Actions e Route Handlers. Toda
 * mutação passa por aqui antes de tocar o banco — nunca confiamos em
 * validação feita apenas no cliente.
 */

export const tipoCredorSchema = z.enum(["instituicao_financeira", "nao_financeiro"]);
export const statusDividaSchema = z.enum([
  "ativa",
  "negociando",
  "acordo_fechado",
  "quitada",
  "contestada",
  "em_processo_judicial",
]);

export const debtSchema = z.object({
  credor_nome: z.string().trim().min(2, "Informe o nome do credor").max(200),
  credor_documento: z.string().trim().max(32).optional().or(z.literal("")),
  numero_contrato: z.string().trim().max(100).optional().or(z.literal("")),
  produto_servico: z.string().trim().min(2, "Informe o produto/serviço").max(200),
  tipo_credor: tipoCredorSchema,
  data_contratacao: z.string().date().optional().or(z.literal("")),
  data_vencimento: z.string().date().optional().or(z.literal("")),
  valor_original: z.coerce.number().min(0).max(999_999_999),
  valor_atual: z.coerce.number().min(0).max(999_999_999),
  negativado: z.coerce.boolean().default(true),
  data_negativacao: z.string().date().optional().or(z.literal("")),
  percentual_desconto_avista: z.coerce.number().min(0).max(100).optional(),
  valor_desconto_avista: z.coerce.number().min(0).max(999_999_999).optional(),
  status: statusDividaSchema.default("ativa"),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
  bank_account_id: z.string().uuid().optional().or(z.literal("")),
});

export const bankAccountSchema = z.object({
  instituicao_id: z.string().trim().min(1).max(100),
  instituicao_nome: z.string().trim().min(2, "Informe o nome da instituição").max(200),
  apelido: z.string().trim().min(2, "Dê um apelido para a conta").max(100),
  numero_conta: z.string().trim().max(50).optional().or(z.literal("")),
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const recorrenciaSchema = z.enum([
  "unica",
  "diaria",
  "semanal",
  "quinzenal",
  "mensal",
  "semestral",
  "anual",
]);

export const incomeSchema = z.object({
  descricao: z.string().trim().min(2).max(200),
  valor: z.coerce.number().min(0).max(999_999_999),
  recorrencia: recorrenciaSchema.default("mensal"),
});

export const expenseSchema = z.object({
  descricao: z.string().trim().min(2).max(200),
  categoria: z.string().trim().min(1).max(100).default("outros"),
  valor: z.coerce.number().min(0).max(999_999_999),
  recorrencia: recorrenciaSchema.default("mensal"),
  dia_vencimento: z.coerce.number().int().min(1).max(31).optional(),
  essencial: z.coerce.boolean().default(true),
});

export const transactionSchema = z.object({
  descricao: z.string().trim().min(2).max(200),
  categoria: z.string().trim().min(1).max(100).default("outros"),
  tipo: z.enum(["receita", "despesa", "pagamento_divida"]),
  valor: z.coerce.number().min(0).max(999_999_999),
  data: z.string().date(),
  debt_id: z.string().uuid().optional().or(z.literal("")),
  recorrencia: recorrenciaSchema.default("unica"),
  // Só usados quando recorrencia !== "unica" e tipo === "despesa" — a
  // transação também alimenta o gasto correspondente no Orçamento.
  dia_vencimento: z.coerce.number().int().min(1).max(31).optional(),
  essencial: z.coerce.boolean().default(true),
});

export const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(120).optional(),
  renda_mensal: z.coerce.number().min(0).max(999_999_999).optional(),
  lembrete_email: z.coerce.boolean().default(true),
  lembrete_dia_mes: z.coerce.number().int().min(1).max(28).default(5),
});

export const uuidSchema = z.string().uuid();
