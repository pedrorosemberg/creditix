import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VeredictoBadge } from "@/components/dividas/veredicto-badge";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { formatarMoeda } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: dividas }, { data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("debts").select("*"),
    supabase.from("incomes").select("valor"),
    supabase.from("expenses").select("valor, essencial"),
  ]);

  const totalDividaOriginal = (dividas ?? []).reduce((acc, d) => acc + Number(d.valor_original), 0);
  const totalDividaAtual = (dividas ?? []).reduce((acc, d) => acc + Number(d.valor_atual), 0);
  const totalRenda = (incomes ?? []).reduce((acc, i) => acc + Number(i.valor), 0);
  const totalEssenciais = (expenses ?? [])
    .filter((e) => e.essencial)
    .reduce((acc, e) => acc + Number(e.valor), 0);

  const analises = (dividas ?? []).map((d) => ({ divida: d, ...analisarDivida(d) }));
  const alertas = analises.filter((a) =>
    ["provavelmente_abusivo", "acima_do_teto_legal"].includes(a.analise.veredicto),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Painel</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardDescription>Dívidas cadastradas</CardDescription>
          <CardTitle className="text-2xl">{dividas?.length ?? 0}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Valor original total</CardDescription>
          <CardTitle className="text-2xl">{formatarMoeda(totalDividaOriginal)}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Valor atual total</CardDescription>
          <CardTitle className="text-2xl">{formatarMoeda(totalDividaAtual)}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Margem mensal (renda − essenciais)</CardDescription>
          <CardTitle className="text-2xl">{formatarMoeda(totalRenda - totalEssenciais)}</CardTitle>
        </Card>
      </div>

      {alertas.length > 0 && (
        <Card className="border-danger bg-danger-soft">
          <CardTitle className="text-danger">
            {alertas.length} dívida(s) com indício de juros abusivos
          </CardTitle>
          <ul className="mt-3 space-y-2">
            {alertas.map(({ divida, analise }) => (
              <li key={divida.id} className="flex items-center justify-between text-sm">
                <Link href={`/dividas/${divida.id}`} className="font-medium text-brand-blue hover:underline">
                  {divida.credor_nome}
                </Link>
                <VeredictoBadge veredicto={analise.veredicto} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dividas">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Gerenciar dívidas</CardTitle>
            <CardDescription>Cadastre e acompanhe suas dívidas negativadas.</CardDescription>
          </Card>
        </Link>
        <Link href="/recuperacao">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Plano de recuperação</CardTitle>
            <CardDescription>Simule à vista, parcelado e priorização.</CardDescription>
          </Card>
        </Link>
        <Link href="/orcamento">
          <Card className="transition-shadow hover:shadow-md">
            <CardTitle>Orçamento</CardTitle>
            <CardDescription>Registre renda e gastos para calibrar seu plano.</CardDescription>
          </Card>
        </Link>
      </div>
    </div>
  );
}
