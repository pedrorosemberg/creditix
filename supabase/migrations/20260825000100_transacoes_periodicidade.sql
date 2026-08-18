-- Troca o booleano "recorrente" (só sim/não) por uma periodicidade de
-- verdade, igual à usada em incomes/expenses — necessário pra uma
-- transação recorrente poder alimentar o orçamento com o período certo.
alter table public.transactions add column recorrencia public.recorrencia not null default 'unica';
update public.transactions set recorrencia = 'mensal' where recorrente = true;
alter table public.transactions drop column recorrente;
