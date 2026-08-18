create type public.tipo_log as enum ('conta', 'erro');

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo public.tipo_log not null,
  titulo text not null,
  descricao text,
  created_at timestamptz not null default now()
);

create index activity_logs_user_id_created_at_idx
  on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

-- Mesmo padrão de isolamento por usuário das demais tabelas: cada um só
-- enxerga, insere e apaga os próprios registros.
create policy "activity_logs_select_own"
  on public.activity_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "activity_logs_insert_own"
  on public.activity_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "activity_logs_delete_own"
  on public.activity_logs for delete
  to authenticated
  using (auth.uid() = user_id);
