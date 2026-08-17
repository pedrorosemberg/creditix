import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/lib/utils";
import { montarPlanoRecuperacao } from "@/lib/finance/recovery-plan";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import type { EstrategiaPriorizacao } from "@/lib/finance/tipos";
import { salvarPlanoAction } from "./actions";

const ESTRATEGIA_LABEL: Record<EstrategiaPriorizacao, string> = {
  avalanche: "Avalanche (maior taxa de juros primeiro)",
  bola_de_neve: "Bola de neve (menor valor primeiro)",
  juridica_primeiro: "Jurídica primeiro (contestar antes de pagar)",
};

export default async function RecuperacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ estrategia?: string }>;
}) {
  const { estrategia: estrategiaParam } = await searchParams;
  const estrategia: EstrategiaPriorizacao =
    estrategiaParam === "bola_de_neve" || estrategiaParam === "juridica_primeiro"
      ? estrategiaParam
      : "avalanche";

  const supabase = await createClient();
  const [{ data: dividas }, { data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("debts").select("*").in("status", ["ativa", "negociando", "contestada"]),
    supabase.from("incomes").select("valor"),
    supabase.from("expenses").select("valor, essencial"),
  ]);

  const rendaMensal = (incomes ?? []).reduce((acc, i) => acc + Number(i.valor), 0);
  const gastosEssenciais = (expenses ?? [])
    .filter((e) => e.essencial)
    .reduce((acc, e) => acc + Number(e.valor), 0);

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

  const plano = montarPlanoRecuperacao({
    rendaMensal,
    gastosEssenciais,
    dividas: dividasParaPlano,
    estrategia,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Plano de recuperação financeira</h1>
          <p className="text-sm text-foreground-muted">
            Baseado na sua renda, gastos essenciais e dívidas ativas cadastradas.
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <Select name="estrategia" defaultValue={estrategia} className="w-72">
            {Object.entries(ESTRATEGIA_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" size="sm">
            Recalcular
          </Button>
        </form>
      </div>

      {dividas?.length === 0 ? (
        <Card>
          <CardTitle>Sem dívidas ativas</CardTitle>
          <CardDescription>
            Cadastre suas dívidas na aba <Link href="/dividas" className="text-brand-blue">Dívidas</Link> para gerar
            o plano.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardDescription>Margem mensal disponível</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.margemDisponivel)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Comprometido no plano</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.comprometidoMensal)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Saldo livre após o plano</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.saldoLivreAposPlano)}</CardTitle>
            </Card>
          </div>

          {plano.observacoes.length > 0 && (
            <Card className="border-warning bg-warning-soft">
              <ul className="list-inside list-disc space-y-1 text-sm">
                {plano.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="space-y-3">
            {plano.simulacoes.map((sim, i) => (
              <Card key={sim.dividaId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{i + 1}º</Badge>
                    <Link href={`/dividas/${sim.dividaId}`} className="font-medium text-brand-blue hover:underline">
                      {sim.credorNome}
                    </Link>
                  </div>
                  <Badge tone={sim.alocada ? "success" : "warning"}>
                    {sim.alocada ? "Cabe no orçamento" : "Não cabe no momento"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-[var(--radius-md)] bg-surface-muted p-3">
                    <p className="text-foreground-muted">À vista</p>
                    <p className="font-semibold">{formatarMoeda(sim.avista.valorTotal)}</p>
                    {sim.avista.economia > 0 && (
                      <p className="text-xs text-success">Economia de {formatarMoeda(sim.avista.economia)}</p>
                    )}
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-surface-muted p-3">
                    <p className="text-foreground-muted">Parcelado sugerido</p>
                    {sim.parcelado ? (
                      <p className="font-semibold">
                        {sim.parcelado.numParcelas}x de {formatarMoeda(sim.parcelado.valorParcela)}
                      </p>
                    ) : (
                      <p className="text-foreground-muted">—</p>
                    )}
                    {sim.motivoNaoAlocada && (
                      <p className="mt-1 text-xs text-warning">{sim.motivoNaoAlocada}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <form action={salvarPlanoAction}>
            <input type="hidden" name="estrategia" value={estrategia} />
            <Button type="submit" variant="secondary">
              Salvar este plano no histórico
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
