"use client";

import { useActionState, useEffect, useRef } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { enviarMensagemChatAction, type ChatState } from "./actions";

const initialState: ChatState = undefined;

export function ChatForm() {
  const [state, formAction, pending] = useActionState(enviarMensagemChatAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <div className="space-y-3">
      {pending && (
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
            <span>
              Pensando... pode levar até 1 minuto na primeira mensagem (o servidor de IA precisa &quot;acordar&quot;).
            </span>
          </div>
        </div>
      )}
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea
          name="mensagem"
          placeholder="Pergunte sobre suas dívidas, orçamento ou o plano de recuperação..."
          required
          maxLength={2000}
          disabled={pending}
          className="min-h-20"
        />
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
