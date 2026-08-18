"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Gerando..." : analiseExistente ? "Gerar novo parecer" : "Gerar parecer"}
          </Button>
        </form>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {analiseExistente ? (
        <div className="rounded-[var(--radius-md)] bg-surface-muted p-4">
          <Markdown>{analiseExistente.content}</Markdown>
        </div>
      ) : (
        !state?.error && (
          <p className="text-sm text-foreground-muted">
            Gere um parecer objetivo processado inteiramente no servidor (Ollama local por padrão, ou Gemini se
            configurado) sobre a melhor estratégia para esta dívida.
          </p>
        )
      )}
    </Card>
  );
}
