import { SidebarNavLinks } from "@/components/layout/sidebar-nav";
import { OPERADOR } from "@/lib/config/operador";

export function Sidebar({ isAdminGlobal = false }: { isAdminGlobal?: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg tracking-wide text-brand-red">Creditix</span>
      </div>
      <SidebarNavLinks isAdminGlobal={isAdminGlobal} />
      <div className="border-t border-border p-4 text-xs text-foreground-muted">
        Um produto{" "}
        <a
          href={OPERADOR.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display tracking-wide text-brand-red hover:underline"
        >
          {OPERADOR.nome}
        </a>
      </div>
    </aside>
  );
}
