"use client";

import { useState } from "react";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";
import { formatarMoeda } from "@/lib/utils";
import { RECORRENCIA_LABEL, RECORRENCIAS_ORDENADAS } from "@/lib/finance/periodicidade";
import type { Expense } from "@/types/database.types";

export function ItemGasto({
  gasto,
  atualizarAction,
  excluirAction,
}: {
  gasto: Expense;
  atualizarAction: (formData: FormData) => void;
  excluirAction: (formData: FormData) => void;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="py-3">
        <form action={atualizarAction} className="grid grid-cols-2 gap-2">
          <Field label="Descrição" htmlFor={`descricao_gasto_${gasto.id}`}>
            <Input id={`descricao_gasto_${gasto.id}`} name="descricao" defaultValue={gasto.descricao} required />
          </Field>
          <Field label="Valor (R$)" htmlFor={`valor_gasto_${gasto.id}`}>
            <Input
              id={`valor_gasto_${gasto.id}`}
              name="valor"
              type="number"
              step="0.01"
              min="0"
              defaultValue={gasto.valor}
              required
            />
          </Field>
          <Field label="Categoria" htmlFor={`categoria_gasto_${gasto.id}`}>
            <Input id={`categoria_gasto_${gasto.id}`} name="categoria" defaultValue={gasto.categoria} />
          </Field>
          <Field label="Dia de vencimento (1-31)" htmlFor={`dia_vencimento_${gasto.id}`}>
            <Input
              id={`dia_vencimento_${gasto.id}`}
              name="dia_vencimento"
              type="number"
              min="1"
              max="31"
              defaultValue={gasto.dia_vencimento ?? undefined}
            />
          </Field>
          <Field label="Recorrência" htmlFor={`recorrencia_gasto_${gasto.id}`}>
            <Select id={`recorrencia_gasto_${gasto.id}`} name="recorrencia" defaultValue={gasto.recorrencia}>
              {RECORRENCIAS_ORDENADAS.map((r) => (
                <option key={r} value={r}>
                  {RECORRENCIA_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <input
              id={`essencial_${gasto.id}`}
              name="essencial"
              type="checkbox"
              defaultChecked={gasto.essencial}
              className="h-4 w-4"
            />
            <Label htmlFor={`essencial_${gasto.id}`} className="mb-0">
              Essencial
            </Label>
          </div>
          <div className="col-span-2 flex gap-2">
            <SubmitButton size="sm" pendingText="Salvando...">
              Salvar
            </SubmitButton>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-[var(--radius-md)] border border-border px-3 text-sm text-foreground-muted hover:bg-surface-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between py-2 text-sm">
      <div>
        <p className="font-medium">{gasto.descricao}</p>
        <p className="text-xs text-foreground-muted">
          {gasto.categoria} · {RECORRENCIA_LABEL[gasto.recorrencia]} · {gasto.essencial ? "Essencial" : "Não essencial"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium">{formatarMoeda(Number(gasto.valor))}</span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-xs text-foreground-muted underline hover:text-foreground"
        >
          Editar
        </button>
        <form action={excluirAction}>
          <input type="hidden" name="id" value={gasto.id} />
          <DeleteIconButton title="Excluir gasto" />
        </form>
      </div>
    </li>
  );
}
