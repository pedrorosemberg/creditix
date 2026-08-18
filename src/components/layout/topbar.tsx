import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

export function Topbar({ nome, avatarUrl }: { nome: string | null; avatarUrl: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <span className="font-display text-base text-brand-red md:hidden">Creditix</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-foreground-muted">Olá, {nome ?? "usuário"}</span>
        <Link
          href="/configuracoes"
          title="Meu perfil"
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-muted ring-1 ring-border transition-shadow hover:ring-brand-red"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Meu perfil" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-4 w-4 text-foreground-muted" />
          )}
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
