-- Programa de indicação: cada usuário tem um código curto e único pra
-- compartilhar; quem se cadastra por esse link gera uma linha "pendente"
-- em referrals, que vira "aceito" quando o cadastrado confirma o e-mail.

alter table public.profiles add column referral_code text unique;

-- Código curto (8 chars, hex maiúsculo) derivado de um uuid aleatório —
-- não é sequencial nem previsível, e a chance de colisão é desprezível
-- na escala esperada; a constraint unique acima garante que qualquer
-- colisão teórica falhe alto (erro), nunca sobrescreva silenciosamente.
update public.profiles
set referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.profiles alter column referral_code set not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  );
  return new;
end;
$$;

-- ============================================================
-- referrals — quem indicou quem, e se o convite já foi aceito
-- ============================================================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid unique references auth.users(id) on delete set null,
  codigo text not null,
  status text not null default 'pendente' check (status in ('pendente', 'aceito')),
  created_at timestamptz not null default now(),
  aceito_at timestamptz
);
create index idx_referrals_referrer on public.referrals(referrer_id);

-- RLS habilitado e SEM nenhuma policy pra "authenticated" (nem grant
-- de tabela pro papel authenticated) — nem o referenciador nem o
-- indicado acessam esta tabela diretamente, de propósito. Toda leitura
-- passa pela função minhas_indicacoes() abaixo (só agregados, nunca a
-- identidade de quem foi indicado); toda escrita passa pelo client
-- admin (service role) nas Server Actions de cadastro/confirmação.
alter table public.referrals enable row level security;
grant all on public.referrals to service_role;

-- Retorna só contagens da PRÓPRIA sessão (auth.uid(), sem parâmetro) —
-- nunca expõe quem são os indicados, e um usuário não pode consultar as
-- indicações de outra pessoa. security definer porque o cálculo de
-- "quitando_dividas" precisa olhar a tabela debts de OUTROS usuários
-- (os indicados) só pra contar, nunca pra devolver os dados da dívida.
create or replace function public.minhas_indicacoes()
returns table(pendentes bigint, aceitos bigint, quitando_dividas bigint)
security definer
set search_path = public
language sql
stable
as $$
  select
    count(*) filter (where r.status = 'pendente') as pendentes,
    count(*) filter (where r.status = 'aceito') as aceitos,
    count(*) filter (
      where r.status = 'aceito'
        and exists (
          select 1 from public.debts d
          where d.user_id = r.referred_user_id and d.status = 'quitada'
        )
    ) as quitando_dividas
  from public.referrals r
  where r.referrer_id = auth.uid();
$$;
grant execute on function public.minhas_indicacoes() to authenticated;
