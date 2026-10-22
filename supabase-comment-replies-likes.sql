-- Indiscretos: respuestas y likes en comentarios
-- Migración aditiva: no borra publicaciones ni comentarios existentes.

alter table public.post_comments
  add column if not exists parent_comment_id bigint
  references public.post_comments(id) on delete cascade;

create index if not exists post_comments_parent_comment_id_idx
  on public.post_comments (parent_comment_id);

create table if not exists public.post_comment_likes (
  comment_id bigint not null references public.post_comments(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.post_comment_likes enable row level security;

revoke all on table public.post_comment_likes from anon, authenticated;
grant select on table public.post_comment_likes to anon, authenticated;
grant insert, delete on table public.post_comment_likes to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_comment_likes'
      and policyname = 'Indiscretos: leer likes de comentarios'
  ) then
    execute 'create policy "Indiscretos: leer likes de comentarios"
      on public.post_comment_likes for select to anon, authenticated using (true)';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_comment_likes'
      and policyname = 'Indiscretos: dar like propio a comentario'
  ) then
    execute 'create policy "Indiscretos: dar like propio a comentario"
      on public.post_comment_likes for insert to authenticated
      with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_comment_likes'
      and policyname = 'Indiscretos: quitar like propio a comentario'
  ) then
    execute 'create policy "Indiscretos: quitar like propio a comentario"
      on public.post_comment_likes for delete to authenticated
      using (auth.uid() = user_id)';
  end if;
end
$$;

grant select on table public.post_comments to anon, authenticated;
grant insert on table public.post_comments to authenticated;
