-- Catálogo extensível e seleção persistente, sem liberar UPDATE geral em profiles.
-- Aplicar após 202610210001_foundation.sql em um Supabase de desenvolvimento.
create table public.mascot_species (
  id text primary key check (id ~ '^[a-z][a-z0-9_]{1,39}$'),
  display_name text not null check (length(display_name) between 1 and 60),
  is_selectable boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.mascot_species enable row level security;
revoke all on public.mascot_species from anon, authenticated;
grant select on public.mascot_species to authenticated;
create policy mascot_species_read on public.mascot_species
  for select to authenticated using (true);

insert into public.mascot_species(id, display_name) values
  ('cat', 'Gato'),
  ('dog', 'Cachorro');

-- Preserva os códigos já existentes e permite novas espécies via catálogo.
alter table public.profiles drop constraint profiles_mascot_check;
alter table public.profiles
  add constraint profiles_mascot_species_fk
  foreign key (mascot) references public.mascot_species(id)
  on update restrict on delete restrict;

-- A única escrita de perfil exposta nesta etapa altera somente o mascote do
-- usuário autenticado. O cliente não escolhe profile_id nem escreve outros campos.
create function public.select_mascot(target_species text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  perform 1
    from public.mascot_species
    where id = target_species and is_selectable
    for key share;

  if not found then
    raise exception 'Espécie inexistente ou indisponível.' using errcode = '23514';
  end if;

  update public.profiles
     set mascot = target_species
   where id = current_user_id;

  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0002';
  end if;

  return target_species;
end;
$$;

revoke all on function public.select_mascot(text) from public, anon;
grant execute on function public.select_mascot(text) to authenticated;
