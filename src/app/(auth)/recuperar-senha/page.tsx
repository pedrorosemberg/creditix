"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenhaAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: AuthState = undefined;

export default function RecuperarSenhaPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacaoSenhaAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl text-brand-blue">Creditix</span>
          <p className="mt-1 text-sm text-foreground-muted">Recuperar acesso à conta</p>
        </div>

        {state?.success ? (
          <p className="text-sm text-success">{state.success}</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </Field>
            {state?.error && <p className="text-sm text-danger">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-foreground-muted">
          <Link href="/login" className="font-medium text-brand-blue hover:underline">
            Voltar para o login
          </Link>
        </p>
      </Card>
    </div>
  );
}
