import { Card } from "@/components/ui/card";

export default function ConfirmarAuthErroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm text-center">
        <span className="font-display text-2xl text-brand-red">Creditix</span>
        <p className="mt-4 text-sm text-danger">
          Não foi possível confirmar o link. Ele pode ter expirado ou já ter sido usado — solicite um novo.
        </p>
        <a href="/login" className="mt-3 inline-block text-sm text-brand-red hover:underline">
          Voltar para o login
        </a>
      </Card>
    </div>
  );
}
