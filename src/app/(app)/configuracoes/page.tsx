import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { atualizarPerfilAction } from "./actions";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <Card>
        <CardTitle>Perfil</CardTitle>
        <p className="mb-4 text-sm text-foreground-muted">{user?.email}</p>
        <form action={atualizarPerfilAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" htmlFor="display_name">
            <Input id="display_name" name="display_name" defaultValue={profile?.display_name ?? ""} />
          </Field>
          <Field label="Renda mensal (R$) — opcional, referência geral" htmlFor="renda_mensal">
            <Input
              id="renda_mensal"
              name="renda_mensal"
              type="number"
              step="0.01"
              min="0"
              defaultValue={profile?.renda_mensal ?? ""}
            />
          </Field>
          <input type="hidden" name="lembrete_email" value={profile?.lembrete_email ? "on" : ""} />
          <input type="hidden" name="lembrete_dia_mes" value={profile?.lembrete_dia_mes ?? 5} />
          <div className="md:col-span-2">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Card>

      <Card className="border-border">
        <CardTitle>Privacidade e dados</CardTitle>
        <p className="mt-2 text-sm text-foreground-muted">
          Seus dados financeiros são isolados por usuário (Row Level Security) e nunca compartilhados com
          outros usuários da plataforma. Análises por IA são processadas inteiramente no servidor.
        </p>
      </Card>
    </div>
  );
}
