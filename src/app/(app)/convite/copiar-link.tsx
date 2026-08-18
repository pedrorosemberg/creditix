"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de clipboard (raro) — o campo de texto abaixo já
      // deixa o link selecionável manualmente como alternativa.
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1" />
      <Button type="button" variant="secondary" onClick={copiar}>
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
