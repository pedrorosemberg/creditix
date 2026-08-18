import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Renderiza markdown (negrito, listas, títulos) das respostas da IA — sem
 * isso, marcações como "**Parecer:**" apareciam literalmente na tela em
 * vez de formatadas. Não interpreta HTML embutido (react-markdown ignora
 * por padrão), então uma tentativa de prompt injection não consegue
 * injetar tags na página.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("space-y-2 text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
