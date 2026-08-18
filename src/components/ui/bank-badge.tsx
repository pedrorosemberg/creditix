import { cn } from "@/lib/utils";

/**
 * Badge genérico (iniciais + cor) para instituições financeiras — de
 * propósito não usa o logotipo oficial de nenhuma marca de terceiros
 * (risco de uso indevido de marca registrada sem autorização). A cor é
 * derivada deterministicamente do nome, então a mesma instituição sempre
 * recebe a mesma cor em qualquer lugar do app.
 */
function iniciais(nome: string): string {
  const palavras = nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1 || /[A-Za-zÀ-ÿ]/.test(p));
  if (palavras.length === 0) return "?";
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return (palavras[0][0] + palavras[1][0]).toUpperCase();
}

function hashCorHsl(texto: string): string {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  const matiz = Math.abs(hash) % 360;
  return `hsl(${matiz}, 55%, 40%)`;
}

export function BankBadge({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: hashCorHsl(nome) }}
      title={nome}
    >
      {iniciais(nome)}
    </span>
  );
}
