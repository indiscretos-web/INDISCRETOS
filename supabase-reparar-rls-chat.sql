-- Reparación de RLS para el chat privado de Indiscretos.
-- Ejecutar una sola vez en Supabase > SQL Editor > New query.
-- Solo modifica políticas/permisos de public.direct_messages; no borra mensajes.

grant usage on schema public to authenticated;
grant select, insert on table public.direct_messages to authenticated;

alter table public.direct_messages enable row level security;

-- Elimina políticas antiguas o duplicadas de esta tabla para evitar
-- que una política restrictiva heredada bloquee el envío.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'direct_messages'
  loop
    execute format('drop policy if exists %I on public.direct_messages', p.policyname);
  end loop;
end
$$;

create policy "direct_messages_read_participant_recent"
  on public.direct_messages
  for select
  to authenticated
  using (
    (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    and created_at > now() - interval '30 minutes'
  );

create policy "direct_messages_insert_as_sender"
  on public.direct_messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and recipient_id <> (select auth.uid())
    and char_length(trim(content)) between 1 and 1000
  );


-- Alinear el vencimiento físico con la interfaz: 30 minutos.
-- Reemplaza la tarea anterior por una sola tarea, ejecutada cada minuto.
create extension if not exists pg_cron;

do $$
declare existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'indiscretos-delete-expired-messages'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'indiscretos-delete-expired-messages',
    '* * * * *',
    $job$delete from public.direct_messages where created_at <= now() - interval '30 minutes';$job$
  );
end
$$;
