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

export function itensNav(isAdminGlobal: boolean): ItemNav[] {
  return isAdminGlobal ? [...ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }] : ITEMS;
}

/**
 * Lista de links de navegação, compartilhada entre a sidebar fixa (desktop)
 * e o menu toggle (mobile/tablet) — mesmo item ativo, mesmos data-tour, um
 * só lugar pra manter em sincronia.
 */
export function SidebarNavLinks({
  isAdminGlobal = false,
  onNavigate,
}: {
  isAdminGlobal?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {itensNav(isAdminGlobal).map(({ href, label, icon: Icon, tour }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            onClick={onNavigate}
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
  );
}
