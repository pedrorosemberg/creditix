import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/utils";
import { obterItensDoMes } from "@/lib/email/lembrete-mensal";
import { atualizarLembreteAction } from "./actions";

export default async function LembretesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
  const itens = await obterItensDoMes(supabase, user!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Lembretes mensais</h1>

      <Card>
        <CardTitle>Preferências</CardTitle>
        <CardDescription>
          Enviamos um resumo por e-mail (via Resend) no dia escolhido, com suas dívidas em aberto e contas
          fixas do mês.
        </CardDescription>
        <form action={atualizarLembreteAction} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <input
              id="lembrete_email"
              name="lembrete_email"
              type="checkbox"
              defaultChecked={profile?.lembrete_email ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor="lembrete_email" className="mb-0">
              Receber lembrete por e-mail
            </Label>
          </div>
          <Field label="Dia do mês" htmlFor="lembrete_dia_mes">
            <Input
              id="lembrete_dia_mes"
              name="lembrete_dia_mes"
              type="number"
              min={1}
              max={28}
              defaultValue={profile?.lembrete_dia_mes ?? 5}
              className="w-24"
            />
          </Field>
          <Button type="submit" size="sm">
            Salvar
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Prévia deste mês</CardTitle>
        {itens.dividasPendentes.length === 0 && itens.gastosMensais.length === 0 ? (
          <CardDescription>Nada pendente por enquanto.</CardDescription>
        ) : (
          <div className="mt-3 space-y-4">
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
