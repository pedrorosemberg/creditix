-- Bucket privado para fotos de perfil. Privado (não público) porque o
-- projeto é security-first por padrão: o acesso é sempre feito via signed
-- URL de curta duração, gerada server-side, nunca por URL pública fixa.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Cada usuário só pode ler/gravar/apagar objetos dentro da "pasta"
-- nomeada com o próprio auth.uid() (ex.: "<uid>/avatar.png"). Mesmo
-- padrão de isolamento multi-tenant usado nas tabelas via RLS.
create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
