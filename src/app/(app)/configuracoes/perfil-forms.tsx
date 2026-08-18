"use client";

import { useActionState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { atualizarAvatarAction, atualizarEmailAction, atualizarSenhaAction, type PerfilState } from "./actions";

const initialState: PerfilState = undefined;

export function PerfilForms({ avatarSignedUrl, emailAtual }: { avatarSignedUrl: string | null; emailAtual: string }) {
  const [avatarState, avatarAction, avatarPending] = useActionState(atualizarAvatarAction, initialState);
  const [emailState, emailAction, emailPending] = useActionState(atualizarEmailAction, initialState);
  const [senhaState, senhaAction, senhaPending] = useActionState(atualizarSenhaAction, initialState);

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Foto de perfil</CardTitle>
        <form action={avatarAction} className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface-muted">
            {avatarSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSignedUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-8 w-8 text-foreground-muted" />
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Input type="file" name="avatar" accept="image/png,image/jpeg,image/webp" className="max-w-xs" required />
            <Button type="submit" size="sm" disabled={avatarPending}>
              {avatarPending ? "Enviando..." : "Atualizar foto"}
            </Button>
          </div>
        </form>
        {avatarState?.error && <p className="mt-2 text-sm text-danger">{avatarState.error}</p>}
        {avatarState?.success && <p className="mt-2 text-sm text-success">{avatarState.success}</p>}
        <p className="mt-2 text-xs text-foreground-muted">PNG, JPG ou WEBP, até 3MB. Armazenada de forma privada.</p>
      </Card>

      <Card>
        <CardTitle>E-mail de acesso</CardTitle>
        <p className="mt-1 text-sm text-foreground-muted">Atual: {emailAtual}</p>
        <form action={emailAction} className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Novo e-mail" htmlFor="novo_email">
            <Input id="novo_email" name="novo_email" type="email" required autoComplete="email" className="min-w-64" />
          </Field>
          <Button type="submit" size="sm" disabled={emailPending}>
            {emailPending ? "Enviando..." : "Trocar e-mail"}
          </Button>
        </form>
        {emailState?.error && <p className="mt-2 text-sm text-danger">{emailState.error}</p>}
        {emailState?.success && <p className="mt-2 text-sm text-success">{emailState.success}</p>}
        <p className="mt-2 text-xs text-foreground-muted">
          Por segurança, enviamos um link de confirmação para o e-mail atual e outro para o novo — os dois precisam
          ser confirmados.
        </p>
      </Card>

      <Card>
        <CardTitle>Senha de acesso</CardTitle>
        <form action={senhaAction} className="mt-3 grid gap-3 md:grid-cols-3">
          <Field label="Senha atual" htmlFor="senha_atual">
            <Input id="senha_atual" name="senha_atual" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="Nova senha" htmlFor="senha_nova">
            <Input id="senha_nova" name="senha_nova" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={senhaPending}>
              {senhaPending ? "Salvando..." : "Atualizar senha"}
            </Button>
          </div>
        </form>
        {senhaState?.error && <p className="mt-2 text-sm text-danger">{senhaState.error}</p>}
        {senhaState?.success && <p className="mt-2 text-sm text-success">{senhaState.success}</p>}
      </Card>
    </div>
  );
}
