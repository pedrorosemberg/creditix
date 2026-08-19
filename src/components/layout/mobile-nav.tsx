"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNavLinks } from "@/components/layout/sidebar-nav";

/**
 * Menu toggle (hamburger) para telas < md, onde a sidebar fixa fica
 * escondida (ver sidebar.tsx) — sem isso não há como navegar entre as
 * seções do app em mobile/tablet-portrait a não ser digitando a URL.
 */
export function MobileNav({ isAdminGlobal = false }: { isAdminGlobal?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);

  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAberto(false);
  }

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const fecharNoEsc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", fecharNoEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fecharNoEsc);
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        aria-expanded={aberto}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-foreground-muted hover:bg-surface-muted hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-[var(--shadow-card)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="font-display text-lg tracking-wide text-brand-red">Creditix</span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNavLinks isAdminGlobal={isAdminGlobal} onNavigate={() => setAberto(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
