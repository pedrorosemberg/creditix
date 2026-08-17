import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatarData, formatarMoeda } from "@/lib/utils";
import type { Debt } from "@/types/database.types";

const STATUS_LABEL: Record<Debt["status"], string> = {
  ativa: "Ativa",
  negociando: "Negociando",
  acordo_fechado: "Acordo fechado",
  quitada: "Quitada",
  contestada: "Contestada",
  em_processo_judicial: "Em processo judicial",
};

export default async function DividasPage() {
  const supabase = await createClient();
  const { data: dividas } = await supabase
    .from("debts")
    .select("*")
    .order("valor_atual", { ascending: false });

  const total = (dividas ?? []).reduce((acc, d) => acc + Number(d.valor_atual), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dívidas</h1>
          <p className="text-sm text-foreground-muted">
            {dividas?.length ?? 0} dívida(s) · total atual {formatarMoeda(total)}
          </p>
        </div>
        <Link href="/dividas/nova">
          <Button>
            <Plus className="h-4 w-4" /> Nova dívida
          </Button>
        </Link>
      </div>

      {!dividas || dividas.length === 0 ? (
        <Card>
          <CardTitle>Nenhuma dívida cadastrada</CardTitle>
          <CardDescription>
            Cadastre as dívidas do seu relatório do Serasa (ou de qualquer outra fonte) para começar a
            análise de juros e montar seu plano de recuperação.
          </CardDescription>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-surface-muted text-left text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Credor</th>
                <th className="px-4 py-3 font-medium">Produto/serviço</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor atual</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dividas.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/dividas/${d.id}`} className="font-medium text-brand-blue hover:underline">
                      {d.credor_nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{d.produto_servico}</td>
                  <td className="px-4 py-3 text-foreground-muted">{formatarData(d.data_vencimento)}</td>
                  <td className="px-4 py-3 font-medium">{formatarMoeda(Number(d.valor_atual))}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.status === "quitada" ? "success" : "neutral"}>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
