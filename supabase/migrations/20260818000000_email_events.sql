-- Log de eventos de entrega de e-mail recebidos via webhook do Resend
-- (entregue, aberto, clicado, bounce, reclamação, etc.). Tabela de
-- sistema: nenhum grant para anon/authenticated — só o webhook
-- (service_role) escreve aqui, e só o backend lê.
create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
grant all on public.email_events to service_role;
alter table public.email_events enable row level security;
create index idx_email_events_resend_id on public.email_events(resend_email_id);
create index idx_email_events_created on public.email_events(created_at desc);
