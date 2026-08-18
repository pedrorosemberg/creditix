import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { verificarAdminGlobal, listarUsuariosAdmin } from "@/lib/supabase/admin-global";
import { formatarData, formatarDataHora } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const isAdmin = await verificarAdminGlobal();
  if (!isAdmin) redirect("/dashboard");

  const usuarios = await listarUsuariosAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-red" />
        <h1 className="text-xl font-semibold">Administração</h1>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Usuários ({usuarios.length})
          </CardTitle>
        </div>
        <p className="mb-4 text-sm text-foreground-muted">
          Dados agregados de conta e de indicação. Nenhuma dívida, transação ou informação financeira de
          outros usuários é exibida aqui — a função no banco que alimenta esta tela nunca retorna esses
          dados.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-foreground-muted">
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Cadastro</th>
                <th className="py-2 pr-3">Último acesso</th>
                <th className="py-2 pr-3">Convidou (pendente)</th>
                <th className="py-2 pr-3">Convidou (aceito)</th>
                <th className="py-2 pr-3">Indicados saindo das dívidas</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3">{u.email ?? "—"}</td>
                  <td className="py-2 pr-3">{u.displayName ?? "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-foreground-muted">{u.id}</td>
                  <td className="py-2 pr-3">{formatarData(u.createdAt)}</td>
                  <td className="py-2 pr-3">{u.lastSignInAt ? formatarDataHora(u.lastSignInAt) : "nunca"}</td>
                  <td className="py-2 pr-3">{u.indicacoesPendentes}</td>
                  <td className="py-2 pr-3">{u.indicacoesAceitas}</td>
                  <td className="py-2 pr-3">{u.indicadosQuitandoDividas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
