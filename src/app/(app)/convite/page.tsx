import { Gift, Clock, PartyPopper, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { gerarLinkIndicacao } from "@/lib/referral";
import { CopiarLink } from "./copiar-link";

export default async function ConvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: indicacoes }] = await Promise.all([
    supabase.from("profiles").select("referral_code").eq("id", user!.id).maybeSingle(),
    supabase.rpc("minhas_indicacoes"),
  ]);

  const stats = indicacoes?.[0] ?? { pendentes: 0, aceitos: 0, quitando_dividas: 0 };
  const link = perfil ? gerarLinkIndicacao(perfil.referral_code) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Convide amigos</h1>
        <p className="text-sm text-foreground-muted">
          Compartilhe seu link e ajude outras pessoas a organizar as próprias dívidas — de graça, sem nenhum
          dado saindo daqui pra alguém além de quem você indicar.
        </p>
      </div>

      <Card>
        <CardTitle>Seu link de indicação</CardTitle>
        <CardDescription>Quem se cadastrar por esse link fica associado a você.</CardDescription>
        <div className="mt-4">{link && <CopiarLink link={link} />}</div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-foreground-muted">
            <Clock className="h-4 w-4" />
            <CardDescription>Convites pendentes</CardDescription>
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats.pendentes}</p>
          <p className="mt-1 text-xs text-foreground-muted">Cadastro iniciado, e-mail ainda não confirmado.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-foreground-muted">
            <PartyPopper className="h-4 w-4" />
            <CardDescription>Convites aceitos</CardDescription>
          </div>
          <p className="mt-2 text-2xl font-semibold text-success">{stats.aceitos}</p>
          <p className="mt-1 text-xs text-foreground-muted">Confirmaram o e-mail e já estão usando o Creditix.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-foreground-muted">
            <TrendingDown className="h-4 w-4" />
            <CardDescription>Amigos quitando dívidas</CardDescription>
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-red">{stats.quitando_dividas}</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Já quitaram pelo menos uma dívida usando o app.
          </p>
        </Card>
      </div>

      <Card className="bg-surface-muted">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
          <p className="text-sm text-foreground-muted">
            Por privacidade, você nunca vê os dados financeiros de quem indicou — só estes números agregados.
          </p>
        </div>
      </Card>
    </div>
  );
}
