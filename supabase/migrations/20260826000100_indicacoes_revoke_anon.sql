-- O advisor de segurança do Supabase apontou que minhas_indicacoes()
-- ficou executável por "anon" (padrão do Postgres: EXECUTE é concedido a
-- PUBLIC ao criar uma função, salvo revogação explícita) — o grant pra
-- "authenticated" no migration anterior foi aditivo, não substituiu isso.
-- Na prática não vaza dado (auth.uid() é null pra quem não está logado,
-- então a função só devolve zeros), mas não há razão pra deixar a porta
-- aberta pra quem nem tem conta.
revoke execute on function public.minhas_indicacoes() from public;
revoke execute on function public.minhas_indicacoes() from anon;
grant execute on function public.minhas_indicacoes() to authenticated;
