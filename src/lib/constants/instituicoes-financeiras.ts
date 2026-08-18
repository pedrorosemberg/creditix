/**
 * Lista curada de instituições financeiras, de pagamento, sociedades de
 * crédito direto e financeiras que operam no Brasil, para o usuário
 * relacionar uma conta bancária a uma dívida. Não usamos os logotipos
 * oficiais de terceiros aqui (risco de marca registrada sem autorização)
 * — cada instituição recebe um badge genérico com iniciais e cor
 * derivadas do nome (ver `bank-badge.tsx`).
 *
 * Não é uma lista exaustiva de todas as instituições registradas no
 * Banco Central — cobre os grandes bancos, os principais bancos digitais
 * e fintechs, cooperativas e financeiras mais conhecidas. Se a
 * instituição do usuário não estiver aqui, ele pode cadastrar com um
 * nome livre (categoria "Outra instituição").
 */
export type CategoriaInstituicao =
  | "banco_tradicional"
  | "banco_digital"
  | "cooperativa"
  | "instituicao_pagamento"
  | "credito_direto"
  | "financeira"
  | "corretora";

export const CATEGORIA_INSTITUICAO_LABEL: Record<CategoriaInstituicao, string> = {
  banco_tradicional: "Banco tradicional",
  banco_digital: "Banco digital / fintech",
  cooperativa: "Cooperativa de crédito",
  instituicao_pagamento: "Instituição de pagamento",
  credito_direto: "Sociedade de crédito direto (SCD)",
  financeira: "Financeira / crédito e financiamento",
  corretora: "Corretora de investimentos",
};

export type InstituicaoFinanceira = {
  id: string;
  nome: string;
  categoria: CategoriaInstituicao;
};

export const INSTITUICOES_FINANCEIRAS: InstituicaoFinanceira[] = [
  // Bancos tradicionais
  { id: "banco-do-brasil", nome: "Banco do Brasil", categoria: "banco_tradicional" },
  { id: "caixa", nome: "Caixa Econômica Federal", categoria: "banco_tradicional" },
  { id: "itau", nome: "Itaú Unibanco", categoria: "banco_tradicional" },
  { id: "bradesco", nome: "Bradesco", categoria: "banco_tradicional" },
  { id: "santander", nome: "Santander", categoria: "banco_tradicional" },
  { id: "banrisul", nome: "Banrisul", categoria: "banco_tradicional" },
  { id: "safra", nome: "Banco Safra", categoria: "banco_tradicional" },
  { id: "btg-pactual", nome: "BTG Pactual", categoria: "banco_tradicional" },
  { id: "votorantim-bv", nome: "Banco BV (Votorantim)", categoria: "banco_tradicional" },
  { id: "banco-mercantil", nome: "Banco Mercantil do Brasil", categoria: "banco_tradicional" },
  { id: "banco-amazonia", nome: "Banco da Amazônia", categoria: "banco_tradicional" },
  { id: "banco-nordeste", nome: "Banco do Nordeste", categoria: "banco_tradicional" },
  { id: "banco-abc-brasil", nome: "Banco ABC Brasil", categoria: "banco_tradicional" },
  { id: "banco-daycoval", nome: "Banco Daycoval", categoria: "banco_tradicional" },
  { id: "banco-fibra", nome: "Banco Fibra", categoria: "banco_tradicional" },
  { id: "banco-sofisa", nome: "Banco Sofisa", categoria: "banco_tradicional" },
  { id: "banco-pan", nome: "Banco Pan", categoria: "banco_tradicional" },
  { id: "banco-master", nome: "Banco Master", categoria: "banco_tradicional" },
  { id: "banco-topazio", nome: "Banco Topázio", categoria: "banco_tradicional" },
  { id: "banco-bmg", nome: "Banco BMG", categoria: "banco_tradicional" },
  { id: "banco-original", nome: "Banco Original", categoria: "banco_tradicional" },
  { id: "banco-bs2", nome: "Banco BS2", categoria: "banco_tradicional" },
  { id: "banco-modal", nome: "Banco Modal", categoria: "banco_tradicional" },

  // Bancos digitais / fintechs
  { id: "nubank", nome: "Nubank", categoria: "banco_digital" },
  { id: "inter", nome: "Banco Inter", categoria: "banco_digital" },
  { id: "c6-bank", nome: "C6 Bank", categoria: "banco_digital" },
  { id: "neon", nome: "Neon", categoria: "banco_digital" },
  { id: "next", nome: "Next", categoria: "banco_digital" },
  { id: "will-bank", nome: "Will Bank", categoria: "banco_digital" },
  { id: "digio", nome: "Digio", categoria: "banco_digital" },
  { id: "agibank", nome: "Agibank", categoria: "banco_digital" },
  { id: "banco-neon-voiter", nome: "Voiter (ex-Banco Neon)", categoria: "banco_digital" },
  { id: "pagbank", nome: "PagBank (PagSeguro)", categoria: "banco_digital" },

  // Instituições de pagamento / carteiras digitais
  { id: "mercado-pago", nome: "Mercado Pago", categoria: "instituicao_pagamento" },
  { id: "picpay", nome: "PicPay", categoria: "instituicao_pagamento" },
  { id: "recargapay", nome: "RecargaPay", categoria: "instituicao_pagamento" },
  { id: "stone", nome: "Stone", categoria: "instituicao_pagamento" },
  { id: "cielo", nome: "Cielo", categoria: "instituicao_pagamento" },
  { id: "getnet", nome: "Getnet", categoria: "instituicao_pagamento" },
  { id: "rede", nome: "Rede (Itaú)", categoria: "instituicao_pagamento" },
  { id: "ame-digital", nome: "Ame Digital", categoria: "instituicao_pagamento" },
  { id: "iti-itau", nome: "iti (Itaú)", categoria: "instituicao_pagamento" },

  // Sociedades de crédito direto (SCD) / fintechs de crédito
  { id: "creditas", nome: "Creditas", categoria: "credito_direto" },
  { id: "geru", nome: "Geru", categoria: "credito_direto" },
  { id: "simplic", nome: "Simplic", categoria: "credito_direto" },
  { id: "rebel", nome: "Rebel", categoria: "credito_direto" },
  { id: "trigg", nome: "Trigg", categoria: "credito_direto" },
  { id: "n26-tf", nome: "TF Sociedade de Crédito Direto", categoria: "credito_direto" },

  // Financeiras (crédito, financiamento e investimento)
  { id: "crefisa", nome: "Crefisa", categoria: "financeira" },
  { id: "losango", nome: "Losango (HSBC)", categoria: "financeira" },
  { id: "zema", nome: "Zema Crédito, Financiamento e Investimento", categoria: "financeira" },
  { id: "omni-financeira", nome: "Omni Financeira", categoria: "financeira" },
  { id: "fisia-itau", nome: "Fisia Itaú (Financeira Itaú)", categoria: "financeira" },
  { id: "aymore", nome: "Aymoré Crédito, Financiamento e Investimento (Santander)", categoria: "financeira" },
  { id: "financeira-alfa", nome: "Financeira Alfa", categoria: "financeira" },
  { id: "banco-cetelem", nome: "Banco Cetelem", categoria: "financeira" },
  { id: "midway-financeira", nome: "Midway Financeira (Riachuelo)", categoria: "financeira" },
  { id: "realize-cfi", nome: "Realize Crédito, Financiamento e Investimento (Casas Bahia)", categoria: "financeira" },
  { id: "luizacred", nome: "Luizacred (Magazine Luiza)", categoria: "financeira" },

  // Cooperativas de crédito
  { id: "sicoob", nome: "Sicoob", categoria: "cooperativa" },
  { id: "sicredi", nome: "Sicredi", categoria: "cooperativa" },
  { id: "unicred", nome: "Unicred", categoria: "cooperativa" },
  { id: "cresol", nome: "Cresol", categoria: "cooperativa" },
  { id: "ailos", nome: "Ailos", categoria: "cooperativa" },
  { id: "uniprime", nome: "Uniprime", categoria: "cooperativa" },

  // Corretoras (para contas de investimento usadas como reserva)
  { id: "xp-investimentos", nome: "XP Investimentos", categoria: "corretora" },
  { id: "rico", nome: "Rico Investimentos", categoria: "corretora" },
  { id: "clear", nome: "Clear Corretora", categoria: "corretora" },
  { id: "modalmais", nome: "Modalmais", categoria: "corretora" },
  { id: "genial", nome: "Genial Investimentos", categoria: "corretora" },
  { id: "toro", nome: "Toro Investimentos", categoria: "corretora" },
  { id: "avenue", nome: "Avenue Securities", categoria: "corretora" },
];

export const OUTRA_INSTITUICAO_ID = "outra";
