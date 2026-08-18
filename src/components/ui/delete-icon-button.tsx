"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botão de exclusão (ícone) com feedback visual — mesma motivação do SubmitButton. */
export function DeleteIconButton({ title = "Excluir", className }: { title?: string; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={cn("text-foreground-muted hover:text-danger disabled:opacity-50", className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
