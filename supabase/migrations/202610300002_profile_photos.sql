-- A single small JPEG thumbnail per account, kept out of financial/profile reads.
create table public.profile_photos (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  image_data text not null,
  updated_at timestamptz not null default now(),
  constraint profile_photo_size check (octet_length(image_data) <= 43715),
  constraint profile_photo_format check (image_data ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$')
);
alter table public.profile_photos enable row level security;
revoke all on public.profile_photos from public, anon, authenticated;
grant select on public.profile_photos to authenticated;
create policy profile_photo_read on public.profile_photos for select to authenticated
  using (user_id = (select auth.uid()) or private.is_peer(user_id));

create function public.set_profile_photo(photo_data text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  image_bytes bytea;
begin
  if uid is null then raise exception 'Entre na sua conta.' using errcode = '42501'; end if;
  -- Serializes updates/removal for this profile, without exposing an owner argument.
  perform 1 from public.profiles where id = uid for update;
  if not found then raise exception 'Crie seu perfil primeiro.' using errcode = '42501'; end if;
  if photo_data is null then
    delete from public.profile_photos where user_id = uid;
    return;
  end if;
  if octet_length(photo_data) > 43715 or photo_data !~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$' then
    raise exception 'Use uma foto JPEG reduzida de até 32 KB.' using errcode = '23514';
  end if;
  begin
    image_bytes := decode(substring(photo_data from 24), 'base64');
  exception when others then
    raise exception 'A foto não é válida.' using errcode = '23514';
  end;
  if octet_length(image_bytes) not between 4 and 32768
    or substring(image_bytes from 1 for 3) <> decode('ffd8ff', 'hex')
    or substring(image_bytes from octet_length(image_bytes)-1 for 2) <> decode('ffd9', 'hex') then
    raise exception 'Use uma foto JPEG válida de até 32 KB.' using errcode = '23514';
  end if;
  insert into public.profile_photos(user_id, image_data) values(uid, photo_data)
    on conflict(user_id) do update set image_data = excluded.image_data, updated_at = now();
end $$;
revoke all on function public.set_profile_photo(text) from public, anon;
grant execute on function public.set_profile_photo(text) to authenticated;
