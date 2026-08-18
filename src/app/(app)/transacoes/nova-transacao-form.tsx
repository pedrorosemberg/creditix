"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RECORRENCIA_LABEL, RECORRENCIAS_ORDENADAS } from "@/lib/finance/periodicidade";

export function NovaTransacaoForm({
  action,
  hoje,
  dividas,
}: {
  action: (formData: FormData) => void;
  hoje: string;
  dividas: { id: string; credor_nome: string }[];
}) {
  const [ehDivida, setEhDivida] = useState(false);
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [recorrencia, setRecorrencia] = useState<string>("unica");

  const alimentaOrcamento = !ehDivida && recorrencia !== "unica";

  return (
    <form action={action} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Field label="Descrição" htmlFor="descricao_tx">
        <Input id="descricao_tx" name="descricao" required />
      </Field>
      <Field label="Valor (R$)" htmlFor="valor_tx">
        <Input id="valor_tx" name="valor" type="number" step="0.01" min="0" required />
      </Field>
      <Field label="Data" htmlFor="data_tx">
        <Input id="data_tx" name="data" type="date" defaultValue={hoje} required />
      </Field>

      {ehDivida ? (
        <input type="hidden" name="tipo" value="pagamento_divida" />
      ) : (
        <div>
          <Label htmlFor="tipo_tx">Tipo</Label>
          <Select
            id="tipo_tx"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </Select>
        </div>
      )}

      <Field label="Categoria" htmlFor="categoria_tx">
        <Input id="categoria_tx" name="categoria" defaultValue="outros" />
      </Field>

      <div>
        <Label htmlFor="recorrencia_tx">Recorrência</Label>
        <Select
          id="recorrencia_tx"
          name="recorrencia"
          value={recorrencia}
          onChange={(e) => setRecorrencia(e.target.value)}
        >
          {RECORRENCIAS_ORDENADAS.map((r) => (
            <option key={r} value={r}>
              {RECORRENCIA_LABEL[r]}
            </option>
          ))}
        </Select>
      </div>

      {alimentaOrcamento && tipo === "despesa" && (
        <>
          <Field label="Dia de vencimento (1-31, opcional)" htmlFor="dia_vencimento_tx">
            <Input id="dia_vencimento_tx" name="dia_vencimento" type="number" min="1" max="31" />
          </Field>
          <div className="flex items-end gap-2">
            <input id="essencial_tx" name="essencial" type="checkbox" defaultChecked className="h-4 w-4" />
            <Label htmlFor="essencial_tx" className="mb-0">
              Essencial
            </Label>
          </div>
        </>
      )}

      {alimentaOrcamento && (
        <p className="col-span-2 text-xs text-foreground-muted md:col-span-4">
          Como é recorrente, isso também atualiza (ou cria) {tipo === "receita" ? "a renda" : "o gasto"}{" "}
          correspondente em Orçamento, usado no plano de recuperação.
        </p>
      )}

      <div className="col-span-2 flex items-center gap-2 md:col-span-4">
        <input
          id="eh_divida"
          type="checkbox"
          className="h-4 w-4"
          checked={ehDivida}
          onChange={(e) => setEhDivida(e.target.checked)}
        />
        <Label htmlFor="eh_divida" className="mb-0">
          Dívida (é um pagamento relacionado a uma dívida cadastrada)
        </Label>
      </div>

      {ehDivida && (
        <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-4">
          <div className="col-span-2 md:col-span-3">
            <Label htmlFor="debt_id_tx">Dívida</Label>
            <Select id="debt_id_tx" name="debt_id" required defaultValue="">
              <option value="" disabled>
                Selecione a dívida...
              </option>
              {dividas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.credor_nome}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Link
              href="/dividas/nova"
              target="_blank"
              className="inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] border border-border px-3 text-sm text-foreground hover:bg-surface-muted"
            >
              + Cadastrar nova dívida
            </Link>
          </div>
        </div>
      )}

      <div className="col-span-2 flex items-end md:col-span-4">
        <SubmitButton size="sm" pendingText="Adicionando...">
          Adicionar transação
        </SubmitButton>
      </div>
    </form>
  );
}
