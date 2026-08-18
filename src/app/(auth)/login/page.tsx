"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, solicitarLinkMagicoAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

const initialState: AuthState = undefined;

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [magicState, magicAction, magicPending] = useActionState(solicitarLinkMagicoAction, initialState);
  const [mostrarMagico, setMostrarMagico] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl text-brand-red">Creditix</span>
          <p className="mt-1 text-sm text-foreground-muted">Entre na sua conta</p>
        </div>

        {!mostrarMagico ? (
          <>
            <form action={formAction} className="space-y-4">
              <Field label="E-mail" htmlFor="email">
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </Field>
              <Field label="Senha" htmlFor="password">
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
              </Field>
              <TurnstileWidget />
              {state?.error && <p className="text-sm text-danger">{state.error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-between text-sm">
              <Link href="/recuperar-senha" className="text-brand-red hover:underline">
                Esqueceu a senha?
              </Link>
              <button
                type="button"
                onClick={() => setMostrarMagico(true)}
                className="text-brand-red hover:underline"
              >
                Entrar sem senha
              </button>
            </div>
          </>
        ) : (
          <>
            <form action={magicAction} className="space-y-4">
              <Field label="E-mail" htmlFor="email-magico">
                <Input id="email-magico" name="email" type="email" required autoComplete="email" />
              </Field>
              {magicState?.error && <p className="text-sm text-danger">{magicState.error}</p>}
              {magicState?.success && <p className="text-sm text-success">{magicState.success}</p>}
              <Button type="submit" className="w-full" disabled={magicPending}>
                {magicPending ? "Enviando..." : "Enviar link de acesso"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMostrarMagico(false)}
              className="mt-3 text-sm text-brand-red hover:underline"
            >
              Voltar para entrar com senha
            </button>
          </>
        )}

        <p className="mt-4 text-center text-sm text-foreground-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand-red hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </div>
  );
}
