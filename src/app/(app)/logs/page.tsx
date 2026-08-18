import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge, toneClasses } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn, formatarDataHora } from "@/lib/utils";
import { TIPO_LOG_CONFIG, TIPOS_LOG_ORDENADOS } from "@/lib/constants/log-tipos";
import type { TipoLogDb } from "@/types/database.types";
import { limparLogsAction } from "./actions";

const LIMITE_LOGS = 200;

function tipoValido(valor: string | undefined): valor is TipoLogDb {
  return !!valor && (TIPOS_LOG_ORDENADOS as string[]).includes(valor);
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: tipoParam } = await searchParams;
  const filtroTipo = tipoValido(tipoParam) ? tipoParam : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(LIMITE_LOGS);
  if (filtroTipo) query = query.eq("tipo", filtroTipo);
  const { data: logs } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Logs</h1>
          <p className="text-sm text-foreground-muted">
            Erros, avisos, informações, e-mails enviados, exclusões e eventos agendados (como o lembrete mensal) da
            sua conta.
          </p>
        </div>
        {logs && logs.length > 0 && (
          <form action={limparLogsAction}>
            <SubmitButton variant="secondary" size="sm" pendingText="Limpando...">
              Limpar logs
            </SubmitButton>
          </form>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/logs"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !filtroTipo ? "bg-foreground text-background" : "bg-surface-muted text-foreground-muted hover:bg-border",
          )}
        >
          Todos
        </Link>
        {TIPOS_LOG_ORDENADOS.map((tipo) => (
          <Link
            key={tipo}
            href={`/logs?tipo=${tipo}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filtroTipo === tipo ? toneClasses[TIPO_LOG_CONFIG[tipo].tone] : "bg-surface-muted text-foreground-muted hover:bg-border",
            )}
          >
            {TIPO_LOG_CONFIG[tipo].label}
          </Link>
        ))}
      </div>

      <Card>
        {!logs || logs.length === 0 ? (
          <CardDescription>Nenhum registro ainda.</CardDescription>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => {
              const config = TIPO_LOG_CONFIG[log.tipo];
              const Icone = config.icon;
              return (
                <li key={log.id} className="flex items-start gap-3 py-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      toneClasses[config.tone],
                    )}
                  >
                    <Icone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{log.titulo}</p>
                      <Badge tone={config.tone}>{config.label}</Badge>
                    </div>
                    {log.descricao && (
                      <p className="mt-0.5 break-words text-xs text-foreground-muted">{log.descricao}</p>
                    )}
                    <p className="mt-1 text-xs text-foreground-muted">{formatarDataHora(log.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
