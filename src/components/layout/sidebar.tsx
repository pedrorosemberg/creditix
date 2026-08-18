"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Wallet,
  LifeBuoy,
  Bell,
  Settings,
  MessageCircle,
  ScrollText,
  FileBarChart,
  LineChart,
  Building2,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OPERADOR } from "@/lib/config/operador";
import type { LucideIcon } from "lucide-react";

type ItemNav = { href: string; label: string; icon: LucideIcon; tour?: string };

const ITEMS: ItemNav[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard, tour: "painel" },
  { href: "/dividas", label: "Dívidas", icon: Landmark, tour: "dividas" },
  { href: "/contas-bancarias", label: "Contas bancárias", icon: Building2 },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/orcamento", label: "Orçamento", icon: Wallet, tour: "orcamento" },
  { href: "/analises", label: "Análises", icon: LineChart },
  { href: "/recuperacao", label: "Recuperação financeira", icon: LifeBuoy, tour: "recuperacao" },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/chat", label: "Chat com IA", icon: MessageCircle, tour: "chat" },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
  { href: "/convite", label: "Convite", icon: Gift, tour: "convite" },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ isAdminGlobal = false }: { isAdminGlobal?: boolean }) {
  const pathname = usePathname();
  const itens = isAdminGlobal
    ? [...ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : ITEMS;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg tracking-wide text-brand-red">Creditix</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {itens.map(({ href, label, icon: Icon, tour }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              data-tour={tour}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-red-soft text-brand-red"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
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
