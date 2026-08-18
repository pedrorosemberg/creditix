import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { DebtForm } from "@/components/dividas/debt-form";
import { atualizarDividaAction, excluirDividaAction } from "../../actions";

export default async function EditarDividaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: divida } = await supabase.from("debts").select("*").eq("id", id).maybeSingle();

  if (!divida) notFound();

  const atualizarComId = atualizarDividaAction.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Editar dívida</h1>
      <Card>
        <DebtForm action={atualizarComId} divida={divida} />
      </Card>
      <Card className="border-danger">
        <p className="mb-3 text-sm font-medium text-danger">Excluir esta dívida</p>
        <p className="mb-3 text-sm text-foreground-muted">
          Essa ação remove permanentemente a dívida e o histórico de análises associado a ela.
        </p>
        <form action={excluirDividaAction}>
          <input type="hidden" name="id" value={divida.id} />
          <SubmitButton variant="danger" pendingText="Excluindo...">
            Excluir dívida
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
