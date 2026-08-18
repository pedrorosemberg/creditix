"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
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
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea
        name="mensagem"
        placeholder="Pergunte sobre suas dívidas, orçamento ou o plano de recuperação..."
        required
        maxLength={2000}
        className="min-h-20"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <Send className="h-4 w-4" />
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
