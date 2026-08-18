import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import type { BankAccount, Debt } from "@/types/database.types";

export function DebtForm({
  action,
  divida,
  contasBancarias = [],
}: {
  action: (formData: FormData) => void | Promise<void>;
  divida?: Partial<Debt>;
  contasBancarias?: Pick<BankAccount, "id" | "apelido" | "instituicao_nome">[];
}) {
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Credor (origem)" htmlFor="credor_nome">
        <Input id="credor_nome" name="credor_nome" required defaultValue={divida?.credor_nome ?? ""} />
      </Field>
      <Field label="CNPJ/CPF do credor (opcional)" htmlFor="credor_documento">
        <Input id="credor_documento" name="credor_documento" defaultValue={divida?.credor_documento ?? ""} />
      </Field>
      <Field label="Produto/serviço" htmlFor="produto_servico">
        <Input
          id="produto_servico"
          name="produto_servico"
          required
          placeholder="Ex.: Cartão de crédito, empréstimo pessoal..."
          defaultValue={divida?.produto_servico ?? ""}
        />
      </Field>
      <Field label="Número do contrato (se disponível)" htmlFor="numero_contrato">
        <Input id="numero_contrato" name="numero_contrato" defaultValue={divida?.numero_contrato ?? ""} />
      </Field>
      <div>
        <Label htmlFor="tipo_credor">Tipo de credor</Label>
        <Select id="tipo_credor" name="tipo_credor" defaultValue={divida?.tipo_credor ?? "instituicao_financeira"}>
          <option value="instituicao_financeira">Instituição financeira (banco, fintech, financeira)</option>
          <option value="nao_financeiro">Não financeiro (loja, prestador de serviço etc.)</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={divida?.status ?? "ativa"}>
          <option value="ativa">Ativa</option>
          <option value="negociando">Negociando</option>
          <option value="acordo_fechado">Acordo fechado</option>
          <option value="quitada">Quitada</option>
          <option value="contestada">Contestada</option>
          <option value="em_processo_judicial">Em processo judicial</option>
        </Select>
      </div>
      <Field label="Valor original (R$)" htmlFor="valor_original">
        <Input
          id="valor_original"
          name="valor_original"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={divida?.valor_original ?? ""}
        />
      </Field>
      <Field label="Valor atual (R$)" htmlFor="valor_atual">
        <Input
          id="valor_atual"
          name="valor_atual"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={divida?.valor_atual ?? ""}
        />
      </Field>
      <Field label="Data de contratação (se disponível)" htmlFor="data_contratacao">
        <Input
          id="data_contratacao"
          name="data_contratacao"
          type="date"
          defaultValue={divida?.data_contratacao ?? ""}
        />
      </Field>
      <Field label="Data de vencimento" htmlFor="data_vencimento">
        <Input id="data_vencimento" name="data_vencimento" type="date" defaultValue={divida?.data_vencimento ?? ""} />
      </Field>
      <Field label="% desconto à vista informado (opcional)" htmlFor="percentual_desconto_avista">
        <Input
          id="percentual_desconto_avista"
          name="percentual_desconto_avista"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={divida?.percentual_desconto_avista ?? ""}
        />
      </Field>
      <Field label="Valor fixo com desconto à vista (opcional)" htmlFor="valor_desconto_avista">
        <Input
          id="valor_desconto_avista"
          name="valor_desconto_avista"
          type="number"
          step="0.01"
          min="0"
          defaultValue={divida?.valor_desconto_avista ?? ""}
        />
      </Field>
      <div className="md:col-span-2">
        <Label htmlFor="bank_account_id">Conta bancária vinculada (opcional)</Label>
        <Select id="bank_account_id" name="bank_account_id" defaultValue={divida?.bank_account_id ?? ""}>
          <option value="">Nenhuma</option>
          {contasBancarias.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.apelido} ({conta.instituicao_nome})
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-foreground-muted">
          A conta que você deve, ou a que vai usar pra pagar essa dívida.{" "}
          <a href="/contas-bancarias" className="underline">
            Cadastrar uma conta
          </a>
          .
        </p>
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id="negativado"
          name="negativado"
          type="checkbox"
          defaultChecked={divida?.negativado ?? true}
          className="h-4 w-4 rounded border-border text-brand-red focus:ring-brand-red"
        />
        <Label htmlFor="negativado" className="mb-0">
          Dívida negativada
        </Label>
      </div>
      <div className="md:col-span-2">
        <Field label="Observações" htmlFor="observacoes">
          <Textarea id="observacoes" name="observacoes" defaultValue={divida?.observacoes ?? ""} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <SubmitButton pendingText="Salvando...">
          {divida?.id ? "Salvar alterações" : "Cadastrar dívida"}
        </SubmitButton>
      </div>
    </form>
  );
}
