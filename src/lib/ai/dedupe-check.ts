import "server-only";
import { obterProvedor } from "./get-provider";

/**
 * Segunda opinião, best-effort, sobre se um lançamento novo é a mesma
 * fonte de renda/gasto recorrente que um já cadastrado com nome
 * parecido mas não idêntico. Só é chamada quando o casamento por nome
 * (dedupe.ts) já achou um candidato "parecido" — a IA aqui desempata,
 * nunca decide sozinha, e uma falha/indisponibilidade do provedor nunca
 * deve impedir o lançamento da transação (o chamador trata isso como
 * best-effort e ignora exceções).
 */
export async function verificarDuplicidadeComIa(params: {
  tipo: "renda" | "gasto";
  novoDescricao: string;
  novoValor: number;
  candidatoDescricao: string;
  candidatoValor: number;
}): Promise<{ provavelDuplicado: boolean; justificativa: string }> {
  const provider = obterProvedor();

  const prompt = `Você ajuda a identificar se dois lançamentos financeiros recorrentes do mesmo usuário se referem à MESMA fonte de ${params.tipo === "renda" ? "renda" : "gasto"}, só com o nome digitado de um jeito diferente (ex.: "Salario" e "Salário CLT" podem ser a mesma coisa; "Aluguel" e "Internet" não são).

Lançamento já existente no Orçamento: "${params.candidatoDescricao}", valor R$ ${params.candidatoValor.toFixed(2)}.
Lançamento novo, recém-criado: "${params.novoDescricao}", valor R$ ${params.novoValor.toFixed(2)}.

Responda em português, em UMA única linha, exatamente no formato:
SIM: <justificativa em até 20 palavras>
ou
NAO: <justificativa em até 20 palavras>`;

  const resultado = await provider.gerar(prompt);
  const linha = resultado.content.trim();
  const provavelDuplicado = /^sim/i.test(linha);
  return {
    provavelDuplicado,
    justificativa: linha.replace(/^(sim|nao|não)[:\s-]*/i, "").trim() || linha,
  };
}
