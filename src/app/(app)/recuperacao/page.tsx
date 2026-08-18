import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
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

const MODALIDADE_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  avista_acumulado: { label: "Quitada à vista", tone: "success" },
  parcelado: { label: "Parcelada", tone: "warning" },
  nao_alocada: { label: "Não coube no orçamento", tone: "danger" },
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
            Recalculado automaticamente com base nas suas dívidas, renda e gastos atuais. Prioriza juntar
            dinheiro por {plano.janelaAcumulacaoMeses} mês(es) e quitar à vista — só parcela o que realmente
            não couber assim.
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
            Cadastre suas dívidas na aba <Link href="/dividas" className="text-brand-red">Dívidas</Link> para gerar
            o plano.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardDescription>Margem mensal (renda − essenciais)</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.margemDisponivel)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Reserva de segurança (mínimo existencial)</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.reservaSeguranca)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Disponível de fato para dívidas</CardDescription>
              <CardTitle className="text-2xl">{formatarMoeda(plano.margemParaDividas)}</CardTitle>
            </Card>
            <Card>
              <CardDescription>Economia total com descontos à vista</CardDescription>
              <CardTitle className="text-2xl text-success">{formatarMoeda(plano.totalEconomizadoComDescontos)}</CardTitle>
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

          {plano.timeline.length > 0 && (
            <Card>
              <CardTitle>Linha do tempo</CardTitle>
              <ol className="mt-3 space-y-3">
                {Array.from(new Set(plano.timeline.map((p) => p.mes)))
                  .sort((a, b) => a - b)
                  .map((mesAtual) => {
                    const eventosDoMes = plano.timeline.filter((p) => p.mes === mesAtual);
                    return (
                      <li key={mesAtual} className="rounded-[var(--radius-md)] border border-border p-3">
                        <p className="mb-1.5 text-sm font-semibold">Mês {mesAtual}</p>
                        <ul className="space-y-1 text-sm text-foreground-muted">
                          {eventosDoMes.map((ev, i) => {
                            if (ev.evento === "acumulo") {
                              return (
                                <li key={i}>
                                  Guarde o que sobra do mês — total acumulado:{" "}
                                  <strong className="text-foreground">{formatarMoeda(ev.potAcumulado)}</strong>
                                </li>
                              );
                            }
                            if (ev.evento === "pagamento_avista") {
                              return (
                                <li key={i} className="text-success">
                                  Pague <strong>{ev.credorNome}</strong> à vista: {formatarMoeda(ev.valor)}
                                </li>
                              );
                            }
                            return (
                              <li key={i}>
                                Comece a parcelar <strong className="text-foreground">{ev.credorNome}</strong> em{" "}
                                {ev.numParcelas}x de {formatarMoeda(ev.valorParcela)}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  })}
              </ol>
            </Card>
          )}

          <div className="space-y-3">
            {plano.resultados.map((resultado, i) => {
              const config = MODALIDADE_LABEL[resultado.modalidadeEscolhida];
              return (
                <Card key={resultado.dividaId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{i + 1}º</Badge>
                      <Link href={`/dividas/${resultado.dividaId}`} className="font-medium text-brand-red hover:underline">
                        {resultado.credorNome}
                      </Link>
                    </div>
                    <Badge tone={config.tone}>{config.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground-muted">{resultado.motivo}</p>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] bg-surface-muted p-3">
                      <p className="text-foreground-muted">Valor à vista (referência)</p>
                      <p className="font-semibold">{formatarMoeda(resultado.avista.valorTotal)}</p>
                      {resultado.avista.economia > 0 && (
                        <p className="text-xs text-success">Economia de {formatarMoeda(resultado.avista.economia)}</p>
                      )}
                    </div>
                    {resultado.parcelado && (
                      <div className="rounded-[var(--radius-md)] bg-surface-muted p-3">
                        <p className="text-foreground-muted">
                          {resultado.modalidadeEscolhida === "nao_alocada" ? "Simulação no limite" : "Parcelamento"}
                        </p>
                        <p className="font-semibold">
                          {resultado.parcelado.numParcelas}x de {formatarMoeda(resultado.parcelado.valorParcela)}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <form action={salvarPlanoAction}>
            <input type="hidden" name="estrategia" value={estrategia} />
            <SubmitButton variant="secondary" pendingText="Salvando...">
              Salvar este plano no histórico
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
