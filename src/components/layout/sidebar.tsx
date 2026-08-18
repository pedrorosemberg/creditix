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
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dividas", label: "Dívidas", icon: Landmark },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/orcamento", label: "Orçamento", icon: Wallet },
  { href: "/analises", label: "Análises", icon: LineChart },
  { href: "/recuperacao", label: "Recuperação financeira", icon: LifeBuoy },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/chat", label: "Chat com IA", icon: MessageCircle },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg tracking-wide text-brand-red">Creditix</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
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
        Um produto <span className="font-medium text-foreground">METADAX</span>
      </div>
    </aside>
  );
}
