const ANOS_PRESCRICAO_PADRAO = 5; // Código Civil, art. 206, §5º, I

export type ResultadoPrescricao = {
  possivelmentePrescrita: boolean;
  anosDecorridos: number | null;
  dataLimite: Date | null;
  explicacao: string;
};

/**
 * Estimativa de prescrição com base no prazo geral de 5 anos para dívidas
 * líquidas constantes de instrumento particular (CC, art. 206, §5º, I).
 * É uma triagem: causas de interrupção/suspensão do prazo (reconhecimento
 * da dívida, protesto, citação em ação judicial etc.) não são consideradas
 * automaticamente e exigem análise do histórico completo do caso.
 */
export function verificarPrescricao(
  dataVencimento: Date | null,
  dataReferencia: Date = new Date(),
): ResultadoPrescricao {
  if (!dataVencimento) {
    return {
      possivelmentePrescrita: false,
      anosDecorridos: null,
      dataLimite: null,
      explicacao: "Sem data de vencimento informada, não é possível estimar a prescrição.",
    };
  }

  const anosDecorridos =
    (dataReferencia.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const dataLimite = new Date(dataVencimento);
  dataLimite.setFullYear(dataLimite.getFullYear() + ANOS_PRESCRICAO_PADRAO);

  const possivelmentePrescrita = anosDecorridos >= ANOS_PRESCRICAO_PADRAO;

  const explicacao = possivelmentePrescrita
    ? `Já se passaram mais de ${ANOS_PRESCRICAO_PADRAO} anos desde o vencimento (${anosDecorridos.toFixed(1)} anos). A dívida pode estar prescrita (CC, art. 206, §5º, I) — nesse caso, a manutenção da negativação também é indevida (CDC, art. 43, §1º). Confirme se não houve reconhecimento da dívida, protesto ou ação judicial que tenha interrompido o prazo.`
    : `Ainda não se completou o prazo prescricional de ${ANOS_PRESCRICAO_PADRAO} anos (${anosDecorridos.toFixed(1)} anos decorridos).`;

  return { possivelmentePrescrita, anosDecorridos, dataLimite, explicacao };
}
