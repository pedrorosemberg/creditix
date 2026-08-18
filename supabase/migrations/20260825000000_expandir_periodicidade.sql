-- Amplia o enum de recorrência de renda/gasto (antes só mensal/única)
-- para cobrir os períodos que o usuário realmente lança no dia a dia.
alter type public.recorrencia add value if not exists 'diaria';
alter type public.recorrencia add value if not exists 'semanal';
alter type public.recorrencia add value if not exists 'quinzenal';
alter type public.recorrencia add value if not exists 'semestral';
alter type public.recorrencia add value if not exists 'anual';
