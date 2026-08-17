import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VeredictoBadge } from "@/components/dividas/veredicto-badge";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { calcularOpcaoAvista } from "@/lib/finance/recovery-plan";
import { simularOpcoesParcelamento } from "@/lib/finance/simulacao";
import { fundamento } from "@/lib/legal/fundamentos";
import { formatarData, formatarMoeda, formatarPercentual } from "@/lib/utils";
import { AnaliseIaPainel } from "@/components/dividas/analise-ia-painel";

// Dá mais tempo à Server Action de análise por IA — em especial o
// provedor "local" (modelo embutido), que pode ser lento no cold start.
// A Vercel aplica o menor valor entre este número e o limite do plano.
export const maxDuration = 60;

export default async function DividaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: divida } = await supabase.from("debts").select("*").eq("id", id).maybeSingle();

  if (!divida) notFound();

  const { analise, prescricao } = analisarDivida(divida);

  const avista = calcularOpcaoAvista({
    id: divida.id,
    credorNome: divida.credor_nome,
    valorAtual: Number(divida.valor_atual),
    percentualDescontoAvista: divida.percentual_desconto_avista,
    valorDescontoAvista: divida.valor_desconto_avista,
    taxaMensalImplicita: analise.taxaMensalImplicita,
    veredictoJuridico: analise.veredicto,
  });
  const parcelamentos = simularOpcoesParcelamento(Number(divida.valor_atual));

  const { data: analisesIa } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("debt_id", divida.id)
    .order("created_at", { ascending: false })
    .limit(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{divida.credor_nome}</h1>
          <p className="text-sm text-foreground-muted">{divida.produto_servico}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dividas/${divida.id}/editar`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <a href={`/api/relatorios/${divida.id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </a>
          <a href={`/api/relatorios/${divida.id}/csv`}>
            <Button variant="secondary">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardDescription>Valor original</CardDescription>
          <CardTitle className="text-2xl">{formatarMoeda(Number(divida.valor_original))}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Valor atual</CardDescription>
          <CardTitle className="text-2xl">{formatarMoeda(Number(divida.valor_atual))}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Vencimento</CardDescription>
          <CardTitle className="text-2xl">{formatarData(divida.data_vencimento)}</CardTitle>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle>Análise de juros</CardTitle>
          <VeredictoBadge veredicto={analise.veredicto} />
        </div>
        <p className="text-sm text-foreground">{analise.explicacao}</p>
        {analise.taxaMensalImplicita !== null && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-foreground-muted">Taxa mensal estimada</p>
              <p className="font-semibold">{formatarPercentual(analise.taxaMensalImplicita)}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Taxa anual estimada</p>
              <p className="font-semibold">{formatarPercentual(analise.taxaAnualImplicita)}</p>
            </div>
            {divida.tipo_credor === "nao_financeiro" && (
              <div>
                <p className="text-foreground-muted">Teto legal (Lei de Usura)</p>
                <p className="font-semibold">1,00% a.m.</p>
              </div>
            )}
            {analise.faixaReferencia && (
              <div>
                <p className="text-foreground-muted">Faixa de referência ({analise.faixaReferencia.rotulo})</p>
                <p className="font-semibold">
                  {formatarPercentual(analise.faixaReferencia.taxaMensalMin)} –{" "}
                  {formatarPercentual(analise.faixaReferencia.taxaMensalMax)} a.m.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Próximos passos recomendados</p>
          <ol className="space-y-2">
            {analise.proximosPassos.map((passo, i) => (
              <li key={i} className="rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm">
                <p className="font-medium">{passo.titulo}</p>
                <p className="mt-0.5 text-foreground-muted">{passo.descricao}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Fundamentos legais citados</p>
          <ul className="space-y-1.5 text-xs text-foreground-muted">
            {analise.fundamentoIds.map((fid) => {
              const f = fundamento(fid as Parameters<typeof fundamento>[0]);
              return (
                <li key={fid}>
                  <span className="font-medium text-foreground">{f.titulo}:</span> {f.resumo}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs italic text-foreground-muted">
            Conteúdo orientativo, não substitui aconselhamento jurídico individualizado.
          </p>
        </div>
      </Card>

      {prescricao.possivelmentePrescrita && (
        <Card className="border-warning bg-warning-soft">
          <CardTitle className="text-warning">Possível prescrição</CardTitle>
          <p className="mt-1 text-sm text-foreground">{prescricao.explicacao}</p>
        </Card>
      )}

      <Card>
        <CardTitle>Formas de pagamento</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-border p-4">
            <p className="text-sm font-medium">À vista</p>
            <p className="mt-1 text-2xl font-semibold text-success">{formatarMoeda(avista.valorTotal)}</p>
            {avista.economia > 0 && (
              <p className="text-sm text-foreground-muted">Economia de {formatarMoeda(avista.economia)}</p>
            )}
          </div>
          <div className="rounded-[var(--radius-md)] border border-border p-4">
            <p className="mb-2 text-sm font-medium">Parcelado</p>
            <ul className="space-y-1 text-sm">
              {parcelamentos
                .filter((p) => p.numParcelas > 1)
                .map((p) => (
                  <li key={p.numParcelas} className="flex justify-between">
                    <span className="text-foreground-muted">{p.numParcelas}x</span>
                    <span className="font-medium">{formatarMoeda(p.valorParcela)}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </Card>

      <AnaliseIaPainel dividaId={divida.id} analiseExistente={analisesIa?.[0] ?? null} />
    </div>
  );
}
