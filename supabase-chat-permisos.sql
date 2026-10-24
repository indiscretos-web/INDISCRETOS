-- INDISCRETOS: permisos explícitos para el chat privado
-- Ejecutar en Supabase > SQL Editor > New query > Run.
-- No borra mensajes, alias ni modifica las publicaciones.

grant usage on schema public to authenticated;

grant select, insert, update
on table public.chat_profiles
to authenticated;

grant select, insert
on table public.direct_messages
to authenticated;

-- Mantiene RLS activado: los permisos anteriores no permiten acceder
-- a datos de otras personas fuera de las políticas existentes.
alter table public.chat_profiles enable row level security;
alter table public.direct_messages enable row level security;
