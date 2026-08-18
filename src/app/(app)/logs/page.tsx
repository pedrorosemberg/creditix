import { AlertTriangle, UserCog } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatarDataHora } from "@/lib/utils";
import { limparLogsAction } from "./actions";

const LIMITE_LOGS = 200;

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(LIMITE_LOGS);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Logs</h1>
          <p className="text-sm text-foreground-muted">
            Erros do sistema (ex.: falhas da IA) e mudanças feitas na sua conta.
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

      <Card>
        {!logs || logs.length === 0 ? (
          <CardDescription>Nenhum registro ainda.</CardDescription>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 py-3">
                <div
                  className={
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                    (log.tipo === "erro" ? "bg-danger-soft text-danger" : "bg-brand-red-soft text-brand-red")
                  }
                >
                  {log.tipo === "erro" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <UserCog className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{log.titulo}</p>
                    <Badge tone={log.tipo === "erro" ? "danger" : "brand"}>
                      {log.tipo === "erro" ? "Erro" : "Conta"}
                    </Badge>
                  </div>
                  {log.descricao && (
                    <p className="mt-0.5 break-words text-xs text-foreground-muted">{log.descricao}</p>
                  )}
                  <p className="mt-1 text-xs text-foreground-muted">{formatarDataHora(log.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
