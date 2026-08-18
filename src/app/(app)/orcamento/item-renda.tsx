"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";
import { formatarMoeda } from "@/lib/utils";
import { RECORRENCIA_LABEL, RECORRENCIAS_ORDENADAS } from "@/lib/finance/periodicidade";
import type { Income } from "@/types/database.types";

export function ItemRenda({
  renda,
  atualizarAction,
  excluirAction,
}: {
  renda: Income;
  atualizarAction: (formData: FormData) => void;
  excluirAction: (formData: FormData) => void;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="py-3">
        <form action={atualizarAction} className="grid grid-cols-2 gap-2">
          <Field label="Descrição" htmlFor={`descricao_renda_${renda.id}`}>
            <Input id={`descricao_renda_${renda.id}`} name="descricao" defaultValue={renda.descricao} required />
          </Field>
          <Field label="Valor (R$)" htmlFor={`valor_renda_${renda.id}`}>
            <Input
              id={`valor_renda_${renda.id}`}
              name="valor"
              type="number"
              step="0.01"
              min="0"
              defaultValue={renda.valor}
              required
            />
          </Field>
          <div className="col-span-2">
            <Field label="Recorrência" htmlFor={`recorrencia_renda_${renda.id}`}>
              <Select id={`recorrencia_renda_${renda.id}`} name="recorrencia" defaultValue={renda.recorrencia}>
                {RECORRENCIAS_ORDENADAS.map((r) => (
                  <option key={r} value={r}>
                    {RECORRENCIA_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
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
        <p className="font-medium">{renda.descricao}</p>
        <p className="text-xs text-foreground-muted">{RECORRENCIA_LABEL[renda.recorrencia]}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium">{formatarMoeda(Number(renda.valor))}</span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-xs text-foreground-muted underline hover:text-foreground"
        >
          Editar
        </button>
        <form action={excluirAction}>
          <input type="hidden" name="id" value={renda.id} />
          <DeleteIconButton title="Excluir renda" />
        </form>
      </div>
    </li>
  );
}
