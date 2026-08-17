import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

export function Topbar({ nome }: { nome: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <span className="font-display text-base text-brand-blue md:hidden">Creditix</span>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-foreground-muted">Olá, {nome ?? "usuário"}</span>
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
