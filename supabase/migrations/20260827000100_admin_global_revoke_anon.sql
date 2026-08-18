-- O linter de segurança do Supabase apontou que is_admin_global() e
-- admin_listar_usuarios() ainda eram executáveis por PUBLIC/anon (grant
-- implícito do Postgres) mesmo só tendo sido concedidos explicitamente a
-- authenticated — mesma revogação já feita para minhas_indicacoes() na
-- migration de indicações.
revoke execute on function public.is_admin_global() from public, anon;
revoke execute on function public.admin_listar_usuarios() from public, anon;
grant execute on function public.is_admin_global() to authenticated;
grant execute on function public.admin_listar_usuarios() to authenticated;
