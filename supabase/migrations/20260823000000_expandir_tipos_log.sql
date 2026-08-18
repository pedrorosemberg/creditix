-- Amplia os tipos de evento registrados em activity_logs — antes só
-- existia 'conta' (mudança de perfil) e 'erro'. Agora cobre também
-- avisos, informações, e-mails enviados e eventos assíncronos/agendados
-- (ex.: lembrete mensal disparado pelo cron), para a tela /logs mostrar
-- o histórico completo do que aconteceu na conta.
alter type public.tipo_log add value if not exists 'aviso';
alter type public.tipo_log add value if not exists 'info';
alter type public.tipo_log add value if not exists 'exclusao';
alter type public.tipo_log add value if not exists 'email';
alter type public.tipo_log add value if not exists 'agendado';
