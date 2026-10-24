-- Indiscretos: guardar el colegio elegido en cada comentario/respuesta.
-- Cambio aditivo: no elimina ni modifica comentarios existentes.
alter table public.post_comments
  add column if not exists school_id text;
