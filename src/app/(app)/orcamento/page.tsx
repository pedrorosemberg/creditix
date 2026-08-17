import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/utils";
import {
  criarGastoAction,
  criarRendaAction,
  excluirGastoAction,
  excluirRendaAction,
} from "./actions";

export default async function OrcamentoPage() {
  const supabase = await createClient();
  const [{ data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("incomes").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("created_at", { ascending: false }),
  ]);

  const totalRenda = (incomes ?? []).reduce((acc, i) => acc + Number(i.valor), 0);
  const totalGastos = (expenses ?? []).reduce((acc, e) => acc + Number(e.valor), 0);
  const totalEssenciais = (expenses ?? [])
    .filter((e) => e.essencial)
    .reduce((acc, e) => acc + Number(e.valor), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Orçamento</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-foreground-muted">Renda mensal</p>
          <p className="text-2xl font-semibold text-success">{formatarMoeda(totalRenda)}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground-muted">Gastos mensais</p>
          <p className="text-2xl font-semibold text-danger">{formatarMoeda(totalGastos)}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground-muted">Margem (renda − gastos essenciais)</p>
          <p className="text-2xl font-semibold">{formatarMoeda(totalRenda - totalEssenciais)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Rendas</CardTitle>
          <ul className="mt-3 divide-y divide-border">
            {(incomes ?? []).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{i.descricao}</p>
                  <p className="text-xs text-foreground-muted">{i.recorrencia === "mensal" ? "Mensal" : "Única"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatarMoeda(Number(i.valor))}</span>
                  <form action={excluirRendaAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <button type="submit" className="text-foreground-muted hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <form action={criarRendaAction} className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Descrição" htmlFor="descricao_renda">
              <Input id="descricao_renda" name="descricao" required />
            </Field>
            <Field label="Valor (R$)" htmlFor="valor_renda">
              <Input id="valor_renda" name="valor" type="number" step="0.01" min="0" required />
            </Field>
            <div className="col-span-2">
              <Label htmlFor="recorrencia_renda">Recorrência</Label>
              <Select id="recorrencia_renda" name="recorrencia" defaultValue="mensal">
                <option value="mensal">Mensal</option>
                <option value="unica">Única</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Button type="submit" size="sm">
                Adicionar renda
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle>Gastos</CardTitle>
          <ul className="mt-3 divide-y divide-border">
            {(expenses ?? []).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{e.descricao}</p>
                  <p className="text-xs text-foreground-muted">
                    {e.categoria} · {e.essencial ? "Essencial" : "Não essencial"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatarMoeda(Number(e.valor))}</span>
                  <form action={excluirGastoAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="text-foreground-muted hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <form action={criarGastoAction} className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Descrição" htmlFor="descricao_gasto">
              <Input id="descricao_gasto" name="descricao" required />
            </Field>
            <Field label="Valor (R$)" htmlFor="valor_gasto">
              <Input id="valor_gasto" name="valor" type="number" step="0.01" min="0" required />
            </Field>
            <Field label="Categoria" htmlFor="categoria_gasto">
              <Input id="categoria_gasto" name="categoria" defaultValue="outros" />
            </Field>
            <Field label="Dia de vencimento (1-31)" htmlFor="dia_vencimento">
              <Input id="dia_vencimento" name="dia_vencimento" type="number" min="1" max="31" />
            </Field>
            <div className="col-span-2 flex items-center gap-2">
              <input id="essencial" name="essencial" type="checkbox" defaultChecked className="h-4 w-4" />
              <Label htmlFor="essencial" className="mb-0">
                Gasto essencial (moradia, alimentação, saúde...)
              </Label>
            </div>
            <div className="col-span-2">
              <Button type="submit" size="sm">
                Adicionar gasto
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
