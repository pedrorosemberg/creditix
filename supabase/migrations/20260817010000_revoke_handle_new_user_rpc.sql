-- public.handle_new_user() é SECURITY DEFINER e só deve rodar via o
-- trigger on_auth_user_created (que não depende de grants de EXECUTE).
-- Por padrão o PostgREST expõe toda função do schema public como RPC —
-- isso permitia chamar a função diretamente via /rest/v1/rpc/handle_new_user.
-- Revoga o acesso público/authenticated; o trigger continua funcionando
-- normalmente pois é o motor do Postgres que a invoca, não um cliente.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
