"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { TesteLembreteState } from "./actions";

const initialState: TesteLembreteState = undefined;

export function TestarLembreteButton({
  action,
}: {
  action: (prev: TesteLembreteState, formData: FormData) => Promise<TesteLembreteState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Enviando..." : "Enviar e-mail de teste agora"}
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.sucesso && <p className="text-sm text-success">{state.sucesso}</p>}
    </form>
  );
}
