-- Indiscretos: alias únicos y mensajes privados temporales.
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Requiere Authentication > Sign In / Providers > Anonymous habilitado.

create table if not exists public.chat_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (alias ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists chat_profiles_alias_lower_unique
  on public.chat_profiles (lower(alias));

alter table public.chat_profiles enable row level security;

drop policy if exists "Los usuarios conectados pueden buscar alias" on public.chat_profiles;
create policy "Los usuarios conectados pueden buscar alias"
  on public.chat_profiles for select to authenticated using (true);

drop policy if exists "Cada usuario crea su propio alias" on public.chat_profiles;
create policy "Cada usuario crea su propio alias"
  on public.chat_profiles for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Cada usuario cambia su propio alias" on public.chat_profiles;
create policy "Cada usuario cambia su propio alias"
  on public.chat_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.chat_profiles(user_id) on delete cascade,
  recipient_id uuid not null references public.chat_profiles(user_id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint direct_messages_no_self check (sender_id <> recipient_id)
);

create index if not exists direct_messages_pair_created_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);
create index if not exists direct_messages_recipient_created_idx
  on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "Solo participantes leen mensajes recientes" on public.direct_messages;
create policy "Solo participantes leen mensajes recientes"
  on public.direct_messages for select to authenticated
  using (
    (sender_id = auth.uid() or recipient_id = auth.uid())
    and created_at > now() - interval '1 hour'
  );

drop policy if exists "Enviar mensaje como uno mismo" on public.direct_messages;
create policy "Enviar mensaje como uno mismo"
  on public.direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and recipient_id <> auth.uid()
    and char_length(trim(content)) between 1 and 1000
  );

-- El historial se oculta al cumplir una hora y se elimina físicamente cada 10 minutos.
-- Si pg_cron no está habilitado en el proyecto, activarlo desde Supabase > Database > Extensions.
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'indiscretos-delete-expired-messages') then
    perform cron.schedule(
      'indiscretos-delete-expired-messages',
      '*/10 * * * *',
      $job$delete from public.direct_messages where created_at <= now() - interval '1 hour';$job$
    );
  end if;
end
$$;
