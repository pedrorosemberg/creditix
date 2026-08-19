import type { ReactNode } from "react";

/**
 * Linha rótulo:valor usada dentro dos cards de dados em telas < md — a
 * mesma informação que uma célula de tabela, só que empilhada, pra não
 * depender de rolagem lateral em telas pequenas (ver dividas/transacoes/
 * admin/relatorios, que trocam a tabela por uma lista desses cards abaixo
 * de md e voltam pra tabela normal a partir daí).
 */
export function CampoLinha({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
