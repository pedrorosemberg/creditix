"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: AuthState = undefined;

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl text-brand-blue">Creditix</span>
          <p className="mt-1 text-sm text-foreground-muted">Entre na sua conta</p>
        </div>
        <form action={formAction} className="space-y-4">
          <Field label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Senha" htmlFor="password">
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </Field>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand-blue hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </div>
  );
}
