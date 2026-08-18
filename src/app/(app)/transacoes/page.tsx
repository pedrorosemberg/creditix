import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { TIPO_TRANSACAO_LABEL } from "@/lib/constants/labels";
import { criarTransacaoAction, excluirTransacaoAction } from "./actions";

export default async function TransacoesPage() {
  const supabase = await createClient();
  const [{ data: transacoes }, { data: dividas }] = await Promise.all([
    supabase.from("transactions").select("*").order("data", { ascending: false }).limit(100),
    supabase.from("debts").select("id, credor_nome").order("credor_nome"),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transações</h1>

      <Card>
        <CardTitle>Nova transação</CardTitle>
        <form action={criarTransacaoAction} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Descrição" htmlFor="descricao_tx">
            <Input id="descricao_tx" name="descricao" required className="md:col-span-1" />
          </Field>
          <Field label="Valor (R$)" htmlFor="valor_tx">
            <Input id="valor_tx" name="valor" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Data" htmlFor="data_tx">
            <Input id="data_tx" name="data" type="date" defaultValue={hoje} required />
          </Field>
          <div>
            <Label htmlFor="tipo_tx">Tipo</Label>
            <Select id="tipo_tx" name="tipo" defaultValue="despesa">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="pagamento_divida">Pagamento de dívida</option>
            </Select>
          </div>
          <Field label="Categoria" htmlFor="categoria_tx">
            <Input id="categoria_tx" name="categoria" defaultValue="outros" />
          </Field>
          <div>
            <Label htmlFor="debt_id_tx">Dívida associada (opcional)</Label>
            <Select id="debt_id_tx" name="debt_id" defaultValue="">
              <option value="">Nenhuma</option>
              {(dividas ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.credor_nome}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <input id="recorrente" name="recorrente" type="checkbox" className="h-4 w-4" />
            <Label htmlFor="recorrente" className="mb-0">
              Recorrente
            </Label>
          </div>
          <div className="col-span-2 flex items-end md:col-span-4">
            <SubmitButton size="sm" pendingText="Adicionando...">
              Adicionar transação
            </SubmitButton>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-surface-muted text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
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
