import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { confirmarLinkAuthAction } from "./actions";

const TITULO_POR_TIPO: Record<string, string> = {
  signup: "Confirmar cadastro",
  recovery: "Confirmar redefinição de senha",
  magiclink: "Confirmar entrada",
  email_change: "Confirmar troca de e-mail",
};

export default async function ConfirmarAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;

  if (!token_hash || !type) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
        <Card className="w-full max-w-sm text-center">
          <span className="font-display text-2xl text-brand-red">Creditix</span>
          <p className="mt-4 text-sm text-danger">Link incompleto ou inválido. Solicite um novo.</p>
          <a href="/login" className="mt-3 inline-block text-sm text-brand-red hover:underline">
            Voltar para o login
          </a>
        </Card>
      </div>
    );
  }

  const titulo = TITULO_POR_TIPO[type] ?? "Confirmar";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm text-center">
        <span className="font-display text-2xl text-brand-red">Creditix</span>
        <ShieldCheck className="mx-auto mt-4 h-8 w-8 text-brand-red" />
        <p className="mt-3 text-sm font-medium">{titulo}</p>
        <p className="mt-2 text-sm text-foreground-muted">
          Por segurança, a confirmação só acontece quando você clica no botão abaixo — isso evita que um
          scanner de e-mail automático use o link antes de você.
        </p>
        <form action={confirmarLinkAuthAction} className="mt-5">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next || "/dashboard"} />
          <SubmitButton className="w-full" pendingText="Confirmando...">
            {titulo}
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
