import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/utils";
import { somaMensalEquivalente } from "@/lib/finance/periodicidade";
import { atualizarGastoAction, atualizarRendaAction, excluirGastoAction, excluirRendaAction } from "./actions";
import { ItemRenda } from "./item-renda";
import { ItemGasto } from "./item-gasto";

export default async function OrcamentoPage() {
  const supabase = await createClient();
  const [{ data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("incomes").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("created_at", { ascending: false }),
  ]);

  const totalRenda = somaMensalEquivalente(incomes ?? []);
  const totalGastos = somaMensalEquivalente(expenses ?? []);
  const totalEssenciais = somaMensalEquivalente((expenses ?? []).filter((e) => e.essencial));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Orçamento</h1>
        <CardDescription>
          Renda e gastos recorrentes se cadastram em{" "}
          <Link href="/transacoes" className="text-brand-red underline">
            Transações
          </Link>{" "}
          — lançar de novo algo com o mesmo nome atualiza o valor aqui em vez de duplicar. Aqui você só edita ou
          remove o que já existe.
        </CardDescription>
      </div>

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
          {(incomes ?? []).length === 0 ? (
            <CardDescription>Nenhuma renda cadastrada ainda.</CardDescription>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {(incomes ?? []).map((i) => (
                <ItemRenda
                  key={i.id}
                  renda={i}
                  atualizarAction={atualizarRendaAction.bind(null, i.id)}
                  excluirAction={excluirRendaAction}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Gastos</CardTitle>
          {(expenses ?? []).length === 0 ? (
            <CardDescription>Nenhum gasto cadastrado ainda.</CardDescription>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {(expenses ?? []).map((e) => (
                <ItemGasto
                  key={e.id}
                  gasto={e}
                  atualizarAction={atualizarGastoAction.bind(null, e.id)}
                  excluirAction={excluirGastoAction}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
