-- Preferências de lembrete mais granulares: quais conteúdos o usuário
-- quer receber e com que frequência.
create type public.frequencia_lembrete as enum ('semanal', 'quinzenal', 'mensal');

alter table public.profiles
  add column lembrete_frequencia public.frequencia_lembrete not null default 'mensal',
  add column lembrete_dia_semana smallint not null default 1 check (lembrete_dia_semana between 0 and 6),
  add column lembrete_dividas boolean not null default true,
  add column lembrete_contas boolean not null default true,
  add column lembrete_preencher_transacoes boolean not null default true,
  add column avatar_url text;

comment on column public.profiles.lembrete_dia_semana is '0 = domingo ... 6 = sábado (usado quando lembrete_frequencia = semanal)';
comment on column public.profiles.lembrete_dia_mes is 'Dia de referência para lembrete mensal/quinzenal (quinzenal também dispara ~15 dias depois)';
