"use client";

import { useActionState } from "react";
import { redefinirSenhaAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: AuthState = undefined;

export default function RedefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(redefinirSenhaAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl text-brand-blue">Creditix</span>
          <p className="mt-1 text-sm text-foreground-muted">Escolha uma nova senha</p>
        </div>
        <form action={formAction} className="space-y-4">
          <Field label="Nova senha" htmlFor="password">
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
