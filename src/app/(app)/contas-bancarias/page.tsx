import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { BankBadge } from "@/components/ui/bank-badge";
import { InstituicaoPicker } from "@/components/contas-bancarias/instituicao-picker";
import { criarContaBancariaAction, excluirContaBancariaAction } from "./actions";

export default async function ContasBancariasPage() {
  const supabase = await createClient();
  const { data: contas } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Contas bancárias</h1>
        <p className="text-sm text-foreground-muted">
          Cadastre as contas que você usa para guardar dinheiro pra pagar dívidas, ou a instituição de uma dívida —
          depois você pode relacionar cada dívida a uma dessas contas, se quiser.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-3">Suas contas</CardTitle>
        {!contas || contas.length === 0 ? (
          <CardDescription>Nenhuma conta cadastrada ainda.</CardDescription>
        ) : (
          <ul className="divide-y divide-border">
            {contas.map((conta) => (
              <li key={conta.id} className="flex items-center gap-3 py-3">
                <BankBadge nome={conta.instituicao_nome} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{conta.apelido}</p>
                  <p className="text-xs text-foreground-muted">
                    {conta.instituicao_nome}
                    {conta.numero_conta ? ` · ${conta.numero_conta}` : ""}
                  </p>
                </div>
                <form action={excluirContaBancariaAction}>
                  <input type="hidden" name="id" value={conta.id} />
                  <DeleteIconButton title="Excluir conta" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-3">Adicionar conta</CardTitle>
        <form action={criarContaBancariaAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InstituicaoPicker />
          <Field label="Apelido da conta" htmlFor="apelido">
            <Input id="apelido" name="apelido" required placeholder="Ex.: Conta corrente principal" maxLength={100} />
          </Field>
          <Field label="Agência/conta (opcional)" htmlFor="numero_conta">
            <Input id="numero_conta" name="numero_conta" maxLength={50} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Observações (opcional)" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" maxLength={1000} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingText="Salvando...">Adicionar conta</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
