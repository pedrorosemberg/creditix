-- Papel admin_global: lista global de usuários com permissão para ver
-- informações agregadas de conta (nunca dados financeiros de outros
-- usuários). Segue o mesmo padrão já usado em "referrals": tabela sem
-- nenhuma policy para authenticated/anon, acesso só via função
-- security definer que checa a permissão internamente (defesa em
-- profundidade — não depende só do gate no código do app).

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant all on public.admin_users to service_role;

create or replace function public.is_admin_global()
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

grant execute on function public.is_admin_global() to authenticated;

-- Lista todos os usuários com dados de conta + indicações que cada um já
-- fez, na mesma separação em três categorias já publicada em /convite
-- (pendente / aceita / indicado já quitou pelo menos uma dívida) — não
-- inventa uma categoria nova, só estende a mesma métrica de
-- minhas_indicacoes() para todos os usuários em vez de só auth.uid().
create or replace function public.admin_listar_usuarios()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  indicacoes_pendentes bigint,
  indicacoes_aceitas bigint,
  indicados_quitando_dividas bigint
)
security definer
set search_path = public
language plpgsql
stable
as $$
begin
  if not public.is_admin_global() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
    select
      u.id,
      u.email::text,
      p.display_name,
      u.created_at,
      u.last_sign_in_at,
      count(*) filter (where r.status = 'pendente') as indicacoes_pendentes,
      count(*) filter (where r.status = 'aceito') as indicacoes_aceitas,
      count(*) filter (
        where r.status = 'aceito'
          and exists (
            select 1 from public.debts d
            where d.user_id = r.referred_user_id and d.status = 'quitada'
          )
      ) as indicados_quitando_dividas
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.referrals r on r.referrer_id = u.id
    group by u.id, u.email, p.display_name, u.created_at, u.last_sign_in_at
    order by u.created_at desc;
end;
$$;

grant execute on function public.admin_listar_usuarios() to authenticated;

comment on function public.admin_listar_usuarios() is
  'Restrito a quem está em admin_users (checado via is_admin_global()). Não expõe dívidas, transações ou qualquer dado financeiro de outros usuários — só contagens agregadas de indicação.';
