-- Contas bancárias do usuário, pra ele opcionalmente relacionar uma
-- dívida a uma instituição (a que ele deve, ou a que vai usar pra
-- pagar). A lista de instituições em si vive no código
-- (src/lib/constants/instituicoes-financeiras.ts) — aqui só guardamos o
-- id/nome escolhido, sem depender de uma tabela de referência.
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  instituicao_id text not null,
  instituicao_nome text not null,
  apelido text not null,
  numero_conta text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bank_accounts_user_id_idx on public.bank_accounts (user_id);

alter table public.bank_accounts enable row level security;

create policy "bank_accounts_select_own"
  on public.bank_accounts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bank_accounts_insert_own"
  on public.bank_accounts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bank_accounts_update_own"
  on public.bank_accounts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bank_accounts_delete_own"
  on public.bank_accounts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Vínculo opcional de uma dívida com uma conta bancária cadastrada —
-- "on delete set null" porque excluir a conta bancária não deve apagar
-- a dívida, só desvincular.
alter table public.debts
  add column bank_account_id uuid references public.bank_accounts (id) on delete set null;
