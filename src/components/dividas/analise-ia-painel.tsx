"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Markdown } from "@/components/ui/markdown";
import { gerarAnaliseIaAction, type AnaliseIaState } from "@/app/(app)/dividas/ia-actions";
import type { AiAnalysis } from "@/types/database.types";

const initialState: AnaliseIaState = undefined;

export function AnaliseIaPainel({
  dividaId,
  analiseExistente,
}: {
  dividaId: string;
  analiseExistente: AiAnalysis | null;
}) {
  const [state, formAction, pending] = useActionState(gerarAnaliseIaAction, initialState);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-red" /> Parecer por IA
        </CardTitle>
        <form action={formAction}>
          <input type="hidden" name="debt_id" value={dividaId} />
          <SubmitButton variant="secondary" size="sm" pendingText="Gerando...">
            {analiseExistente ? "Gerar novo parecer" : "Gerar parecer"}
          </SubmitButton>
        </form>
      </div>

      {pending && (
        <div className="mb-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4 text-sm">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-red" />
          <p>
            Gerando parecer — pode levar até 1 minuto, o servidor de IA às vezes precisa &quot;acordar&quot; antes de
            responder. Não saia desta página.
          </p>
        </div>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {analiseExistente && !pending ? (
        <div className="rounded-[var(--radius-md)] bg-surface-muted p-4">
          <Markdown>{analiseExistente.content}</Markdown>
        </div>
      ) : (
        !state?.error &&
        !pending && (
          <p className="text-sm text-foreground-muted">
            Gere um parecer objetivo processado inteiramente no servidor (Ollama local por padrão, ou Gemini se
            configurado) sobre a melhor estratégia para esta dívida.
          </p>
        )
      )}
    </Card>
  );
}
