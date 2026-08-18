create type public.papel_mensagem_chat as enum ('usuario', 'assistente');

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.papel_mensagem_chat not null,
  content text not null,
  provider public.provedor_ia,
  model text,
  created_at timestamptz not null default now()
);

create index ai_chat_messages_user_id_created_at_idx
  on public.ai_chat_messages (user_id, created_at);

alter table public.ai_chat_messages enable row level security;

-- Isolamento estrito por usuário: cada um só enxerga e insere as próprias
-- mensagens. Sem policy de update (transcrição é imutável) nem de delete
-- por outro usuário. O usuário pode apagar seu próprio histórico.
create policy "ai_chat_messages_select_own"
  on public.ai_chat_messages for select
  to authenticated
  using (auth.uid() = user_id);

create policy "ai_chat_messages_insert_own"
  on public.ai_chat_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "ai_chat_messages_delete_own"
  on public.ai_chat_messages for delete
  to authenticated
  using (auth.uid() = user_id);
