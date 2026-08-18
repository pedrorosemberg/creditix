"use client";

import { useState } from "react";
import { Field, Input, Label, Select } from "@/components/ui/input";
import {
  CATEGORIA_INSTITUICAO_LABEL,
  INSTITUICOES_FINANCEIRAS,
  OUTRA_INSTITUICAO_ID,
  type CategoriaInstituicao,
} from "@/lib/constants/instituicoes-financeiras";

const CATEGORIAS_ORDENADAS = Object.keys(CATEGORIA_INSTITUICAO_LABEL) as CategoriaInstituicao[];

export function InstituicaoPicker() {
  const [instituicaoId, setInstituicaoId] = useState("");

  return (
    <>
      <div>
        <Label htmlFor="instituicao_id">Instituição financeira</Label>
        <Select
          id="instituicao_id"
          name="instituicao_id"
          required
          value={instituicaoId}
          onChange={(e) => setInstituicaoId(e.target.value)}
        >
          <option value="" disabled>
            Selecione...
          </option>
          {CATEGORIAS_ORDENADAS.map((categoria) => (
            <optgroup key={categoria} label={CATEGORIA_INSTITUICAO_LABEL[categoria]}>
              {INSTITUICOES_FINANCEIRAS.filter((i) => i.categoria === categoria).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </optgroup>
          ))}
          <optgroup label="Outra">
            <option value={OUTRA_INSTITUICAO_ID}>Outra instituição (digitar nome)</option>
          </optgroup>
        </Select>
      </div>
      {instituicaoId === OUTRA_INSTITUICAO_ID && (
        <Field label="Nome da instituição" htmlFor="instituicao_nome_outra">
          <Input id="instituicao_nome_outra" name="instituicao_nome_outra" required maxLength={200} />
        </Field>
      )}
    </>
  );
}
