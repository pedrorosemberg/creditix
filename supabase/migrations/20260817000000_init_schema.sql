-- Creditix — schema inicial
-- Multi-tenant: toda tabela de negócio tem user_id e RLS restringindo a auth.uid().
-- Nenhuma tabela concede privilégios ao role "anon" — apenas "authenticated" e "service_role".

-- ============================================================
-- Enums
-- ============================================================
create type public.tipo_credor as enum ('instituicao_financeira', 'nao_financeiro');
create type public.status_divida as enum ('ativa', 'negociando', 'acordo_fechado', 'quitada', 'contestada', 'em_processo_judicial');
create type public.recorrencia as enum ('mensal', 'unica');
create type public.tipo_transacao as enum ('receita', 'despesa', 'pagamento_divida');
create type public.modalidade_pagamento as enum ('avista', 'parcelado');
create type public.status_plano as enum ('simulado', 'proposto', 'aceito', 'recusado');
create type public.provedor_ia as enum ('ollama', 'gemini');

-- ============================================================
-- Função utilitária: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles — 1:1 com auth.users
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  renda_mensal numeric(14,2),
  lembrete_email boolean not null default true,
  lembrete_dia_mes smallint not null default 5 check (lembrete_dia_mes between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- debts (dívidas) — dados extraídos do Serasa (ou inseridos manualmente)
-- ============================================================
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credor_nome text not null,
  credor_documento text,
  numero_contrato text,
  produto_servico text not null,
  tipo_credor public.tipo_credor not null default 'instituicao_financeira',
  data_contratacao date,
  data_vencimento date,
  valor_original numeric(14,2) not null check (valor_original >= 0),
  valor_atual numeric(14,2) not null check (valor_atual >= 0),
  negativado boolean not null default true,
  data_negativacao date,
  percentual_desconto_avista numeric(5,2) check (percentual_desconto_avista is null or (percentual_desconto_avista between 0 and 100)),
  valor_desconto_avista numeric(14,2),
  status public.status_divida not null default 'ativa',
  fonte text not null default 'serasa',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.debts to authenticated;
grant all on public.debts to service_role;
alter table public.debts enable row level security;
create policy "own debts" on public.debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_debts_updated before update on public.debts for each row execute function public.set_updated_at();
create index idx_debts_user on public.debts(user_id, status);
create index idx_debts_user_vencimento on public.debts(user_id, data_vencimento);

-- ============================================================
-- incomes (rendas)
-- ============================================================
create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  recorrencia public.recorrencia not null default 'mensal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.incomes to authenticated;
grant all on public.incomes to service_role;
alter table public.incomes enable row level security;
create policy "own incomes" on public.incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_incomes_updated before update on public.incomes for each row execute function public.set_updated_at();
create index idx_incomes_user on public.incomes(user_id);

-- ============================================================
-- expenses (gastos fixos/variáveis do orçamento)
-- ============================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  categoria text not null default 'outros',
  valor numeric(14,2) not null check (valor >= 0),
  recorrencia public.recorrencia not null default 'mensal',
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  essencial boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create policy "own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_expenses_updated before update on public.expenses for each row execute function public.set_updated_at();
create index idx_expenses_user on public.expenses(user_id);

-- ============================================================
-- transactions (lançamentos livres — receitas, despesas e pagamentos de dívida)
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid references public.debts(id) on delete set null,
  descricao text not null,
  categoria text not null default 'outros',
  tipo public.tipo_transacao not null,
  valor numeric(14,2) not null check (valor >= 0),
  data date not null default current_date,
  recorrente boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_transactions_updated before update on public.transactions for each row execute function public.set_updated_at();
create index idx_tx_user_date on public.transactions(user_id, data desc);
create index idx_tx_debt on public.transactions(debt_id);

-- ============================================================
-- recovery_plan_snapshots (plano de recuperação financeira gerado)
-- ============================================================
create table public.recovery_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  renda_mensal_considerada numeric(14,2) not null,
  gastos_essenciais_considerados numeric(14,2) not null,
  margem_disponivel numeric(14,2) not null,
  estrategia text not null,
  plano jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.recovery_plan_snapshots to authenticated;
grant all on public.recovery_plan_snapshots to service_role;
alter table public.recovery_plan_snapshots enable row level security;
create policy "own recovery plans" on public.recovery_plan_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_recovery_user on public.recovery_plan_snapshots(user_id, created_at desc);

-- ============================================================
-- debt_payment_plans (opção de pagamento escolhida/simulada por dívida)
-- ============================================================
create table public.debt_payment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  modalidade public.modalidade_pagamento not null,
  num_parcelas smallint check (num_parcelas is null or num_parcelas > 0),
  valor_parcela numeric(14,2),
  valor_total numeric(14,2) not null,
  status public.status_plano not null default 'simulado',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.debt_payment_plans to authenticated;
grant all on public.debt_payment_plans to service_role;
alter table public.debt_payment_plans enable row level security;
create policy "own payment plans" on public.debt_payment_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_payment_plans_updated before update on public.debt_payment_plans for each row execute function public.set_updated_at();
create index idx_payment_plans_debt on public.debt_payment_plans(debt_id);

-- ============================================================
-- ai_analyses (análises geradas por IA — sempre server-side)
-- ============================================================
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid references public.debts(id) on delete cascade,
  provider public.provedor_ia not null,
  model text not null,
  content text not null,
  structured jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.ai_analyses to authenticated;
grant all on public.ai_analyses to service_role;
alter table public.ai_analyses enable row level security;
create policy "own ai analyses" on public.ai_analyses for select using (auth.uid() = user_id);
create policy "own ai analyses delete" on public.ai_analyses for delete using (auth.uid() = user_id);
create policy "own ai analyses insert" on public.ai_analyses for insert with check (auth.uid() = user_id);
create index idx_ai_analyses_debt on public.ai_analyses(debt_id, created_at desc);

-- ============================================================
-- reminder_sends (log de lembretes mensais enviados — evita duplicidade)
-- ============================================================
create table public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes_referencia date not null,
  destinatario text not null,
  status text not null default 'enviado',
  resend_id text,
  created_at timestamptz not null default now(),
  unique (user_id, mes_referencia)
);
grant select on public.reminder_sends to authenticated;
grant all on public.reminder_sends to service_role;
alter table public.reminder_sends enable row level security;
create policy "own reminder log" on public.reminder_sends for select using (auth.uid() = user_id);
