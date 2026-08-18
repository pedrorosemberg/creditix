import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/utils";
import { obterItensLembrete } from "@/lib/email/lembrete-mensal";
import { atualizarLembreteAction } from "./actions";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function LembretesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();

  const prefs = {
    lembreteDividas: profile?.lembrete_dividas ?? true,
    lembreteContas: profile?.lembrete_contas ?? true,
    lembretePreencherTransacoes: profile?.lembrete_preencher_transacoes ?? true,
  };
  const itens = await obterItensLembrete(supabase, user!.id, prefs);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Lembretes</h1>

      <Card>
        <CardTitle>Preferências</CardTitle>
        <CardDescription>
          Escolha o que você quer receber por e-mail (via Resend) e com que frequência.
        </CardDescription>
        <form action={atualizarLembreteAction} className="mt-4 space-y-5">
          <div className="flex items-center gap-2">
            <input
              id="lembrete_email"
              name="lembrete_email"
              type="checkbox"
              defaultChecked={profile?.lembrete_email ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor="lembrete_email" className="mb-0">
              Receber lembretes por e-mail
            </Label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">O que você quer receber</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="lembrete_dividas"
                  name="lembrete_dividas"
                  type="checkbox"
                  defaultChecked={profile?.lembrete_dividas ?? true}
                  className="h-4 w-4"
                />
                <Label htmlFor="lembrete_dividas" className="mb-0">
                  Dívidas em aberto
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="lembrete_contas"
                  name="lembrete_contas"
                  type="checkbox"
                  defaultChecked={profile?.lembrete_contas ?? true}
                  className="h-4 w-4"
                />
                <Label htmlFor="lembrete_contas" className="mb-0">
                  Contas fixas a pagar
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="lembrete_preencher_transacoes"
                  name="lembrete_preencher_transacoes"
                  type="checkbox"
                  defaultChecked={profile?.lembrete_preencher_transacoes ?? true}
                  className="h-4 w-4"
                />
                <Label htmlFor="lembrete_preencher_transacoes" className="mb-0">
                  Lembrete para registrar transações e gastos (se eu esquecer de lançar)
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="lembrete_frequencia">Frequência</Label>
              <Select id="lembrete_frequencia" name="lembrete_frequencia" defaultValue={profile?.lembrete_frequencia ?? "mensal"}>
                <option value="semanal">Semanal (toda semana, ~4-5x por mês)</option>
                <option value="quinzenal">Quinzenal (a cada 15 dias)</option>
                <option value="mensal">Mensal (1x por mês)</option>
              </Select>
            </div>
            <Field label="Dia da semana (se semanal)" htmlFor="lembrete_dia_semana">
              <Select id="lembrete_dia_semana" name="lembrete_dia_semana" defaultValue={profile?.lembrete_dia_semana ?? 1}>
                {DIAS_SEMANA.map((nome, i) => (
                  <option key={i} value={i}>
                    {nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dia do mês (se mensal/quinzenal)" htmlFor="lembrete_dia_mes">
              <Input
                id="lembrete_dia_mes"
                name="lembrete_dia_mes"
                type="number"
                min={1}
                max={28}
                defaultValue={profile?.lembrete_dia_mes ?? 5}
              />
            </Field>
          </div>

          <SubmitButton size="sm" pendingText="Salvando...">
            Salvar
          </SubmitButton>
        </form>
      </Card>

      <Card>
        <CardTitle>Prévia com as preferências atuais</CardTitle>
        {itens.dividasPendentes.length === 0 && itens.gastosMensais.length === 0 && itens.diasSemRegistrarTransacao === null ? (
          <CardDescription>Nada pendente por enquanto.</CardDescription>
        ) : (
          <div className="mt-3 space-y-4">
            {itens.diasSemRegistrarTransacao !== null && (
              <div className="rounded-[var(--radius-md)] bg-brand-red-soft p-3 text-sm">
                Faz {itens.diasSemRegistrarTransacao} dias que você não registra uma transação.
              </div>
            )}
            {itens.dividasPendentes.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Dívidas em aberto</p>
                <ul className="divide-y divide-border text-sm">
                  {itens.dividasPendentes.map((d) => (
                    <li key={d.id} className="flex justify-between py-1.5">
                      <span>{d.credor_nome}</span>
                      <span className="font-medium">{formatarMoeda(Number(d.valor_atual))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {itens.gastosMensais.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Contas fixas do mês</p>
                <ul className="divide-y divide-border text-sm">
                  {itens.gastosMensais.map((g) => (
                    <li key={g.id} className="flex justify-between py-1.5">
                      <span>
                        {g.descricao}
                        {g.dia_vencimento ? ` (dia ${g.dia_vencimento})` : ""}
                      </span>
                      <span className="font-medium">{formatarMoeda(Number(g.valor))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
