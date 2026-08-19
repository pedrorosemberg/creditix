import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";
import { CampoLinha } from "@/components/ui/campo-linha";
import { formatarData, formatarMoeda, hojeBrasil } from "@/lib/utils";
import { TIPO_TRANSACAO_LABEL } from "@/lib/constants/labels";
import { RECORRENCIA_LABEL } from "@/lib/finance/periodicidade";
import { criarTransacaoAction, excluirTransacaoAction } from "./actions";
import { NovaTransacaoForm } from "./nova-transacao-form";

export default async function TransacoesPage() {
  const supabase = await createClient();
  const [{ data: transacoes }, { data: dividas }] = await Promise.all([
    supabase.from("transactions").select("*").order("data", { ascending: false }).limit(100),
    supabase.from("debts").select("id, credor_nome").order("credor_nome"),
  ]);

  const hoje = hojeBrasil();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transações</h1>

      <Card>
        <CardTitle>Nova transação</CardTitle>
        <NovaTransacaoForm action={criarTransacaoAction} hoje={hoje} dividas={dividas ?? []} />
      </Card>

      <div className="space-y-3 md:hidden">
        {(transacoes ?? []).map((t) => (
          <div key={t.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{t.descricao}</p>
                <p className="text-xs text-foreground-muted">{formatarData(t.data)}</p>
              </div>
              <form action={excluirTransacaoAction}>
                <input type="hidden" name="id" value={t.id} />
                <DeleteIconButton title="Excluir transação" />
              </form>
            </div>
            <div className="mt-2 divide-y divide-border">
              <CampoLinha label="Tipo">{TIPO_TRANSACAO_LABEL[t.tipo]}</CampoLinha>
              <CampoLinha label="Recorrência">{RECORRENCIA_LABEL[t.recorrencia]}</CampoLinha>
              <CampoLinha label="Valor">
                <span className={t.tipo === "receita" ? "text-success" : "text-danger"}>
                  {t.tipo === "receita" ? "+" : "-"}
                  {formatarMoeda(Number(t.valor))}
                </span>
              </CampoLinha>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-surface-muted text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Recorrência</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(transacoes ?? []).map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-3 text-foreground-muted">{formatarData(t.data)}</td>
                <td className="px-4 py-3">{t.descricao}</td>
                <td className="px-4 py-3 text-foreground-muted">{TIPO_TRANSACAO_LABEL[t.tipo]}</td>
                <td className="px-4 py-3 text-foreground-muted">{RECORRENCIA_LABEL[t.recorrencia]}</td>
                <td
                  className={
                    "px-4 py-3 font-medium " + (t.tipo === "receita" ? "text-success" : "text-danger")
                  }
                >
                  {t.tipo === "receita" ? "+" : "-"}
                  {formatarMoeda(Number(t.valor))}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={excluirTransacaoAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <DeleteIconButton title="Excluir transação" />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
