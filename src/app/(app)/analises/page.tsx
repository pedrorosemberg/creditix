import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { VeredictoBadge } from "@/components/dividas/veredicto-badge";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { montarPlanoRecuperacao } from "@/lib/finance/recovery-plan";
import { somaMensalEquivalente } from "@/lib/finance/periodicidade";
import { montarAnaliseSimples, dataDaquiAMeses } from "@/lib/analises/simples";
import { formatarData, formatarMoeda, formatarPercentual } from "@/lib/utils";

function formatarMeses(meses: number | null): string {
  if (meses === null) return "sem margem suficiente";
  if (meses <= 1) return "cerca de 1 mês";
  if (meses < 12) return `cerca de ${meses} meses`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const parteAnos = `${anos} ano${anos > 1 ? "s" : ""}`;
  return resto === 0 ? `cerca de ${parteAnos}` : `cerca de ${parteAnos} e ${resto} mês(es)`;
}

export default async function AnalisesPage() {
  const supabase = await createClient();
  const [{ data: dividas }, { data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("debts").select("*").in("status", ["ativa", "negociando", "contestada"]),
    supabase.from("incomes").select("valor, recorrencia"),
    supabase.from("expenses").select("valor, recorrencia, essencial"),
  ]);

  const rendaMensal = somaMensalEquivalente(incomes ?? []);
  const gastosEssenciais = somaMensalEquivalente((expenses ?? []).filter((e) => e.essencial));

  const dividasParaPlano = (dividas ?? []).map((d) => {
    const { analise } = analisarDivida(d);
    return {
      id: d.id,
      credorNome: d.credor_nome,
      valorAtual: Number(d.valor_atual),
      percentualDescontoAvista: d.percentual_desconto_avista,
      valorDescontoAvista: d.valor_desconto_avista,
      taxaMensalImplicita: analise.taxaMensalImplicita,
      veredictoJuridico: analise.veredicto,
    };
  });

  // Reaproveita a mesma "sobra mensal" (renda - essenciais - reserva de
  // segurança) já calculada pelo plano de recuperação, para os dois
  // números nunca se contradizerem.
  const plano = montarPlanoRecuperacao({ rendaMensal, gastosEssenciais, dividas: dividasParaPlano });
  const analise = montarAnaliseSimples({ margemMensal: plano.margemParaDividas, dividas: dividasParaPlano });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Análises</h1>
        <p className="text-sm text-foreground-muted">
          Estimativa simples e individual: quanto tempo levaria para quitar cada dívida (e todas juntas) só
          com a matemática direta — valor dividido pela sobra mensal. Para um plano que decide a melhor
          ordem de pagamento, veja{" "}
          <Link href="/recuperacao" className="text-brand-red hover:underline">
            Recuperação financeira
          </Link>
          .
        </p>
      </div>

      {dividasParaPlano.length === 0 ? (
        <Card>
          <CardTitle>Sem dívidas ativas</CardTitle>
          <CardDescription>
            Cadastre suas dívidas em <Link href="/dividas" className="text-brand-red">Dívidas</Link> para ver
            as análises.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardDescription>Sobra mensal disponível</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(analise.margemMensal)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Total das dívidas</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(analise.totalDividas)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Quitar tudo, uma de cada vez</CardDescription>
              <CardTitle className="text-xl">{formatarMeses(analise.mesesTodasSequencial)}</CardTitle>
              {analise.mesesTodasSequencial !== null && (
                <p className="mt-1 text-xs text-foreground-muted">
                  por volta de {formatarData(dataDaquiAMeses(analise.mesesTodasSequencial))}
                </p>
              )}
            </Card>
            <Card>
              <CardDescription>Se pagar tudo à vista (com descontos)</CardDescription>
              <CardTitle className="text-xl text-success">{formatarMeses(analise.mesesTodasAvista)}</CardTitle>
              {analise.mesesTodasAvista !== null && (
                <p className="mt-1 text-xs text-foreground-muted">
                  por volta de {formatarData(dataDaquiAMeses(analise.mesesTodasAvista))} · economia total{" "}
                  {formatarMoeda(analise.totalDividas - analise.totalAvista)}
                </p>
              )}
            </Card>
          </div>

          {analise.margemMensal <= 0 && (
            <Card className="border-warning bg-warning-soft">
              <p className="text-sm">
                Sua sobra mensal está zerada (ou negativa) depois da reserva de mínimo existencial — não é
                possível estimar um prazo de quitação enquanto isso não mudar. Revise seus gastos em{" "}
                <Link href="/orcamento" className="text-brand-red hover:underline">
                  Orçamento
                </Link>
                .
              </p>
            </Card>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Por dívida</h2>
            {analise.individuais.map((item) => (
              <Card key={item.dividaId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/dividas/${item.dividaId}`}
                    className="font-medium text-brand-red hover:underline"
                  >
                    {item.credorNome}
                  </Link>
                  <VeredictoBadge veredicto={item.veredictoJuridico} />
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-foreground-muted">Valor atual</p>
                    <p className="font-semibold">{formatarMoeda(item.valorAtual)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">Taxa mensal estimada</p>
                    <p className="font-semibold">
                      {item.taxaMensalImplicita !== null ? formatarPercentual(item.taxaMensalImplicita) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">Só esta dívida (sobra mensal inteira)</p>
                    <p className="font-semibold">{formatarMeses(item.mesesSozinha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">
                      À vista ({formatarMoeda(item.valorAvista)})
                      {item.economiaAvista > 0 && (
                        <span className="text-success"> · economia {formatarMoeda(item.economiaAvista)}</span>
                      )}
                    </p>
                    <p className="font-semibold text-success">{formatarMeses(item.mesesSozinhaAvista)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-border">
            <p className="text-xs text-foreground-muted">
              Estimativas simplificadas: assumem que a sobra mensal inteira é dedicada a uma única dívida por
              vez, sem juros adicionais sobre o saldo enquanto ele não é pago. Na prática, dívidas com juros
              altos crescem enquanto esperam — para uma estratégia que já considera isso, use a Recuperação
              financeira.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
