import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accordion nativo (<details>/<summary>) — sem JS, funciona com CSS
 * puro e é acessível por padrão (teclado, leitor de tela). Não há
 * biblioteca de accordion neste projeto; um componente hand-rolled é
 * consistente com o resto de src/components/ui.
 */
export function AccordionItem({ pergunta, children }: { pergunta: string; children: ReactNode }) {
  return (
    <details className="group rounded-[var(--radius-md)] border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
        {pergunta}
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-foreground-muted">{children}</div>
    </details>
  );
}

export function Accordion({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
