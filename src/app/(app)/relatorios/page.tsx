import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CampoLinha } from "@/components/ui/campo-linha";
import { VeredictoBadge } from "@/components/dividas/veredicto-badge";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { STATUS_DIVIDA_LABEL, TIPO_TRANSACAO_LABEL } from "@/lib/constants/labels";
import { parsearFiltros, searchParamsParaURLSearchParams } from "@/lib/relatorios/filtros";
import { obterDadosRelatorio } from "@/lib/relatorios/dados";
import { SECOES_RELATORIO, type SecaoRelatorio } from "@/lib/relatorios/tipos";
import type { StatusDividaDb, TipoTransacaoDb } from "@/types/database.types";

const SECAO_LABEL: Record<SecaoRelatorio, string> = {
  dividas: "Dívidas",
  transacoes: "Transações",
  recuperacao: "Recuperação financeira",
};

const STATUS_OPCOES: StatusDividaDb[] = [
  "ativa",
  "negociando",
  "acordo_fechado",
  "quitada",
  "contestada",
  "em_processo_judicial",
];

const TIPO_TRANSACAO_OPCOES: TipoTransacaoDb[] = ["receita", "despesa", "pagamento_divida"];

const MODALIDADE_LABEL: Record<string, string> = {
  avista_acumulado: "Quitada à vista",
  parcelado: "Parcelada",
  nao_alocada: "Não coube no orçamento",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const usp = searchParamsParaURLSearchParams(sp);
  const filtros = parsearFiltros(usp);

  const supabase = await createClient();
  const [{ data: todasDividas }, dados] = await Promise.all([
    supabase.from("debts").select("id, credor_nome").order("credor_nome"),
    obterDadosRelatorio(supabase, filtros),
  ]);

  const queryExport = usp.toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-foreground-muted">
          Monte um relatório personalizado — dívidas, transações e recuperação financeira, individual ou em
          grupo, com os filtros abaixo.
        </p>
      </div>

      <Card>
        <CardTitle>Filtros</CardTitle>
        <form method="get" className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="De" htmlFor="inicio">
              <Input id="inicio" name="inicio" type="date" defaultValue={filtros.inicio ?? ""} />
            </Field>
            <Field label="Até" htmlFor="fim">
              <Input id="fim" name="fim" type="date" defaultValue={filtros.fim ?? ""} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Seções do relatório</p>
            <div className="flex flex-wrap gap-4">
              {SECOES_RELATORIO.map((secao) => (
                <div key={secao} className="flex items-center gap-2">
                  <input
                    id={`secao-${secao}`}
                    name="secao"
                    type="checkbox"
                    value={secao}
                    defaultChecked={filtros.secoes.includes(secao)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`secao-${secao}`} className="mb-0">
                    {SECAO_LABEL[secao]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Status da dívida (afeta a seção Dívidas)</p>
              <div className="space-y-1.5">
                {STATUS_OPCOES.map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <input
                      id={`status-${status}`}
                      name="status"
                      type="checkbox"
                      value={status}
                      defaultChecked={filtros.statusDivida.includes(status)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`status-${status}`} className="mb-0 font-normal">
                      {STATUS_DIVIDA_LABEL[status]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Tipo de transação (afeta a seção Transações)</p>
              <div className="space-y-1.5">
                {TIPO_TRANSACAO_OPCOES.map((tipo) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <input
                      id={`tipo-${tipo}`}
                      name="tipoTransacao"
                      type="checkbox"
                      value={tipo}
                      defaultChecked={filtros.tipoTransacao.includes(tipo)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`tipo-${tipo}`} className="mb-0 font-normal">
                      {TIPO_TRANSACAO_LABEL[tipo]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              Dívidas específicas — escolha uma para um relatório individual, várias para um relatório em
              grupo, ou nenhuma para incluir todas
            </p>
            {!todasDividas || todasDividas.length === 0 ? (
              <p className="text-sm text-foreground-muted">Nenhuma dívida cadastrada ainda.</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-[var(--radius-md)] border border-border p-3">
                {todasDividas.map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <input
                      id={`divida-${d.id}`}
                      name="dividaId"
                      type="checkbox"
                      value={d.id}
                      defaultChecked={filtros.dividaIds.includes(d.id)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`divida-${d.id}`} className="mb-0 font-normal">
                      {d.credor_nome}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SubmitButton size="sm" pendingText="Aplicando...">
            Aplicar filtros
          </SubmitButton>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <a href={`/api/relatorios/consolidado/pdf?${queryExport}`} target="_blank" rel="noreferrer">
          <Button variant="secondary">
            <FileText className="h-4 w-4" /> Baixar PDF
          </Button>
        </a>
        <a href={`/api/relatorios/consolidado/csv?${queryExport}`}>
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Baixar CSV
          </Button>
        </a>
      </div>

      {filtros.secoes.includes("dividas") && (
        <Card>
          <CardTitle>Dívidas ({dados.dividas.length})</CardTitle>
          {dados.dividas.length === 0 ? (
            <CardDescription>Nenhuma dívida no filtro selecionado.</CardDescription>
          ) : (
            <>
              <div className="mt-3 space-y-3 md:hidden">
                {dados.dividas.map((d) => (
                  <div key={d.id} className="rounded-[var(--radius-md)] border border-border p-4">
                    <Link href={`/dividas/${d.id}`} className="font-medium text-brand-red hover:underline">
                      {d.credor_nome}
                    </Link>
                    <div className="mt-2 divide-y divide-border">
                      <CampoLinha label="Valor atual">{formatarMoeda(Number(d.valor_atual))}</CampoLinha>
                      <CampoLinha label="Status">
                        <Badge tone={d.status === "quitada" ? "success" : "neutral"}>
                          {STATUS_DIVIDA_LABEL[d.status]}
                        </Badge>
                      </CampoLinha>
                      <CampoLinha label="Veredicto jurídico">
                        <VeredictoBadge veredicto={d.veredictoJuridico} />
                      </CampoLinha>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-border text-left text-foreground-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Credor</th>
                      <th className="py-2 pr-3 font-medium">Valor atual</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Veredicto jurídico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.dividas.map((d) => (
                      <tr key={d.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3">
                          <Link href={`/dividas/${d.id}`} className="font-medium text-brand-red hover:underline">
                            {d.credor_nome}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 font-medium">{formatarMoeda(Number(d.valor_atual))}</td>
                        <td className="py-2 pr-3">
                          <Badge tone={d.status === "quitada" ? "success" : "neutral"}>
                            {STATUS_DIVIDA_LABEL[d.status]}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <VeredictoBadge veredicto={d.veredictoJuridico} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-foreground-muted">
                Total: <span className="font-medium text-foreground">{formatarMoeda(dados.totalDividas)}</span>
              </p>
            </>
          )}
        </Card>
      )}

      {filtros.secoes.includes("transacoes") && (
        <Card>
          <CardTitle>Transações ({dados.transacoes.length})</CardTitle>
          {dados.transacoes.length === 0 ? (
            <CardDescription>Nenhuma transação no filtro selecionado.</CardDescription>
          ) : (
            <>
              <div className="mt-3 space-y-3 md:hidden">
                {dados.transacoes.map((t) => (
                  <div key={t.id} className="rounded-[var(--radius-md)] border border-border p-4">
                    <p className="font-medium">{t.descricao}</p>
                    <p className="text-xs text-foreground-muted">{formatarData(t.data)}</p>
                    <div className="mt-2 divide-y divide-border">
                      <CampoLinha label="Tipo">{TIPO_TRANSACAO_LABEL[t.tipo]}</CampoLinha>
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

              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-border text-left text-foreground-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Data</th>
                      <th className="py-2 pr-3 font-medium">Descrição</th>
                      <th className="py-2 pr-3 font-medium">Tipo</th>
                      <th className="py-2 pr-3 font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.transacoes.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 text-foreground-muted">{formatarData(t.data)}</td>
                        <td className="py-2 pr-3">{t.descricao}</td>
                        <td className="py-2 pr-3 text-foreground-muted">{TIPO_TRANSACAO_LABEL[t.tipo]}</td>
                        <td
                          className={
                            "py-2 pr-3 font-medium " + (t.tipo === "receita" ? "text-success" : "text-danger")
                          }
                        >
                          {t.tipo === "receita" ? "+" : "-"}
                          {formatarMoeda(Number(t.valor))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-foreground-muted">
                <p>
                  Receitas: <span className="font-medium text-success">{formatarMoeda(dados.totalReceitas)}</span>
                </p>
                <p>
                  Despesas/pagamentos:{" "}
                  <span className="font-medium text-danger">{formatarMoeda(dados.totalDespesas)}</span>
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      {filtros.secoes.includes("recuperacao") && dados.plano && (
        <Card>
          <CardTitle>Recuperação financeira (situação atual)</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-foreground-muted">Margem mensal</p>
              <p className="font-semibold">{formatarMoeda(dados.plano.margemDisponivel)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Reserva de segurança</p>
              <p className="font-semibold">{formatarMoeda(dados.plano.reservaSeguranca)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Disponível para dívidas</p>
              <p className="font-semibold">{formatarMoeda(dados.plano.margemParaDividas)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Economia com descontos à vista</p>
              <p className="font-semibold text-success">
                {formatarMoeda(dados.plano.totalEconomizadoComDescontos)}
              </p>
            </div>
          </div>
          {dados.plano.resultados.length > 0 && (
            <ul className="mt-4 divide-y divide-border text-sm">
              {dados.plano.resultados.map((r) => (
                <li key={r.dividaId} className="flex items-center justify-between py-2">
                  <span>{r.credorNome}</span>
                  <span className="text-foreground-muted">
                    {MODALIDADE_LABEL[r.modalidadeEscolhida]}
                    {r.mesQuitacao ? ` · mês ${r.mesQuitacao}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
