import { createClient } from "./server";

export type UsuarioAdmin = {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  indicacoesPendentes: number;
  indicacoesAceitas: number;
  indicadosQuitandoDividas: number;
};

/**
 * Checa via RPC (is_admin_global(), security definer no banco) se o
 * usuário autenticado atual está na tabela admin_users. A checagem real
 * mora no banco (defesa em profundidade) — isto é só o lado do app para
 * decidir se mostra ou não a área /admin.
 */
export async function verificarAdminGlobal(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin_global");
  if (error) {
    console.error("[verificarAdminGlobal] Falha ao checar permissão:", error);
    return false;
  }
  return data === true;
}

/**
 * Lista todos os usuários com dados de conta e indicações. A própria
 * função no banco (admin_listar_usuarios()) recusa a chamada se quem
 * pedir não estiver em admin_users — não depende só deste gate no app.
 */
export async function listarUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_listar_usuarios");
  if (error) {
    throw new Error(`Não foi possível listar usuários: ${error.message}`);
  }
  return (data ?? []).map((linha) => ({
    id: linha.id,
    email: linha.email,
    displayName: linha.display_name,
    createdAt: linha.created_at,
    lastSignInAt: linha.last_sign_in_at,
    indicacoesPendentes: linha.indicacoes_pendentes,
    indicacoesAceitas: linha.indicacoes_aceitas,
    indicadosQuitandoDividas: linha.indicados_quitando_dividas,
  }));
}
