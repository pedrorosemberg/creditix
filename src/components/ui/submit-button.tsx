"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./button";

/**
 * Botão de submit com feedback visual de carregamento — usa useFormStatus,
 * que só funciona dentro de um <form>. Existe porque vários formulários da
 * aplicação chamam Server Actions "fire and forget" (sem useActionState),
 * e sem isso o usuário não tinha nenhum indício de que o clique registrou
 * e o salvamento está em andamento (podia parecer que não funcionou).
 */
export function SubmitButton({
  children,
  pendingText = "Salvando...",
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingText : children}
    </Button>
  );
}
