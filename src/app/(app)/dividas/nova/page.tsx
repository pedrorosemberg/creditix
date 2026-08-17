import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DebtForm } from "@/components/dividas/debt-form";
import { criarDividaAction } from "../actions";

export default function NovaDividaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nova dívida</h1>
        <p className="text-sm text-foreground-muted">
          Use os dados do seu relatório do Serasa: origem, número do contrato (se houver), produto/serviço,
          datas, valor original e valor atual.
        </p>
      </div>
      <Card>
        <CardTitle className="sr-only">Dados da dívida</CardTitle>
        <CardDescription className="sr-only">Formulário de cadastro de dívida</CardDescription>
        <DebtForm action={criarDividaAction} />
      </Card>
    </div>
  );
}
