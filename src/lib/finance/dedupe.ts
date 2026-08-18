function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function palavras(s: string): Set<string> {
  return new Set(normalizarTexto(s).split(" ").filter(Boolean));
}

// Similaridade de Jaccard sobre as palavras da descrição — leve, sem
// dependência externa, e suficiente pra pegar variações de digitação
// ("Salario" vs "Salário CLT") sem confundir coisas genuinamente
// diferentes ("Aluguel" vs "Internet").
function similaridade(a: string, b: string): number {
  const pa = palavras(a);
  const pb = palavras(b);
  if (pa.size === 0 || pb.size === 0) return 0;
  let intersecao = 0;
  for (const p of pa) if (pb.has(p)) intersecao++;
  const uniao = pa.size + pb.size - intersecao;
  return uniao === 0 ? 0 : intersecao / uniao;
}

export function saoEquivalentes(descricaoA: string, descricaoB: string): boolean {
  return normalizarTexto(descricaoA) === normalizarTexto(descricaoB);
}

const LIMIAR_SIMILARIDADE = 0.5;

export function saoParecidos(descricaoA: string, descricaoB: string): boolean {
  return similaridade(descricaoA, descricaoB) >= LIMIAR_SIMILARIDADE;
}
