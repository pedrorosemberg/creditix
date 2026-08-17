import "server-only";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";
import type { AiProvider } from "./provider";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import type { Debt } from "@/types/database.types";

function obterProvedor(): AiProvider {
  const escolhido = process.env.AI_PROVIDER === "gemini" ? "gemini" : "ollama";
  return escolhido === "gemini" ? new GeminiProvider() : new OllamaProvider();
}

function montarPrompt(divida: Debt): string {
  const { analise, prescricao } = analisarDivida(divida);

  return `Você é um assistente que ajuda um consumidor brasileiro a entender uma dívida negativada e a
se preparar para negociá-la. NÃO é um advogado e sua resposta não é aconselhamento jurídico formal.

Dados da dívida:
- Credor: ${divida.credor_nome} (${divida.tipo_credor === "instituicao_financeira" ? "instituição financeira" : "credor não financeiro"})
- Produto/serviço: ${divida.produto_servico}
- Valor original: R$ ${Number(divida.valor_original).toFixed(2)}
- Valor atual: R$ ${Number(divida.valor_atual).toFixed(2)}
- Status: ${divida.status}
- Negativada: ${divida.negativado ? "sim" : "não"}

Análise automática já calculada pelo sistema (use como base, não recalcule):
- Taxa de juros mensal estimada: ${analise.taxaMensalImplicita !== null ? (analise.taxaMensalImplicita * 100).toFixed(2) + "%" : "não calculável"}
- Veredicto: ${analise.veredicto}
- Possível prescrição: ${prescricao.possivelmentePrescrita ? "sim" : "não"}

Escreva, em português do Brasil, um parecer curto (no máximo 250 palavras) e prático com:
1. Um resumo em 1-2 frases da situação.
2. Uma recomendação objetiva do melhor caminho (negociar à vista, parcelar, contestar, ou buscar órgão de defesa do consumidor).
3. Um alerta claro se algo parecer irregular.
Seja direto, evite jargão jurídico excessivo, e não invente números que não foram fornecidos.`;
}

export async function analisarDividaComIa(divida: Debt) {
  const provider = obterProvedor();
  const prompt = montarPrompt(divida);
  return provider.gerar(prompt);
}
