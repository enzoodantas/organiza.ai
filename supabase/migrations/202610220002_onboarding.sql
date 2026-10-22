-- Onboarding consentido. Escritas financeiras continuam fechadas.
create unique index one_active_relationship_per_user
  on public.relationship_members(user_id) where revoked_at is null;

create table public.relationship_invitations (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id),
  created_by uuid not null references public.profiles(id),
  invited_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_at timestamptz,
  declined_at timestamptz,
  check (created_by <> invited_user_id),
  check (expires_at > created_at),
  check (accepted_at is null or declined_at is null)
);
create index relationship_invitations_recipient
  on public.relationship_invitations(invited_user_id, created_at desc);
alter table public.relationship_invitations enable row level security;
revoke all on public.relationship_invitations from public, anon, authenticated;

create function public.create_profile(profile_name text, chosen_mascot text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_name text := btrim(profile_name);
begin
  if current_user_id is null or not exists (
    select 1 from auth.users where id = current_user_id and email_confirmed_at is not null
  ) then
    raise exception 'Conta não confirmada.' using errcode = '42501';
  end if;
  if clean_name is null or length(clean_name) not between 1 and 80 then
    raise exception 'Nome deve ter entre 1 e 80 caracteres.' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.mascot_species where id = chosen_mascot and is_selectable
  ) then
    raise exception 'Mascote indisponível.' using errcode = '23514';
  end if;

  insert into public.profiles(id, display_name, mascot)
  values (current_user_id, clean_name, chosen_mascot)
  on conflict (id) do nothing;
  return current_user_id;
end;
$$;

create function public.create_relationship(relationship_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_name text := btrim(relationship_name);
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  if clean_name is null or length(clean_name) not between 1 and 100 then
    raise exception 'Nome deve ter entre 1 e 100 caracteres.' using errcode = '23514';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 2026));
  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'Crie seu perfil primeiro.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.relationship_members where user_id = current_user_id and revoked_at is null) then
    raise exception 'Você já participa de um espaço ativo.' using errcode = '23505';
  end if;
  insert into public.relationships(name) values (clean_name) returning id into new_id;
  insert into public.relationship_members(relationship_id, user_id) values (new_id, current_user_id);
  return new_id;
end;
$$;

create function public.invite_partner(partner_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  target_user_id uuid;
  target_relationship_id uuid;
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  if partner_email is null or length(btrim(partner_email)) > 254 then
    raise exception 'E-mail inválido.' using errcode = '23514';
  end if;
  select r.id into target_relationship_id
    from public.relationships r
    join public.relationship_members m on m.relationship_id = r.id
   where m.user_id = current_user_id and m.revoked_at is null and r.archived_at is null
   for update of r;
  if target_relationship_id is null then
    raise exception 'Espaço ativo não encontrado.' using errcode = 'P0002';
  end if;
  if (select count(*) from public.relationship_members
      where relationship_id = target_relationship_id and revoked_at is null) <> 1 then
    raise exception 'Este espaço já tem duas pessoas.' using errcode = '23514';
  end if;
  if exists (select 1 from public.relationship_invitations
      where relationship_id = target_relationship_id and accepted_at is null
        and declined_at is null and expires_at > now()) then
    raise exception 'Já existe um convite pendente.' using errcode = '23505';
  end if;
  select id into target_user_id from auth.users
   where lower(email) = lower(btrim(partner_email)) and email_confirmed_at is not null;
  if target_user_id is null or target_user_id = current_user_id or exists (
    select 1 from public.relationship_members
     where user_id = target_user_id and revoked_at is null
  ) then
    raise exception 'Conta indisponível para convite.' using errcode = '23514';
  end if;
  insert into public.relationship_invitations(relationship_id, created_by, invited_user_id)
  values (target_relationship_id, current_user_id, target_user_id) returning id into new_id;
  return new_id;
end;
$$;

create function public.list_relationship_invitations()
returns table (
  id uuid, relationship_id uuid, direction text,
  relationship_name text, other_name text, expires_at timestamptz
) language sql stable security definer set search_path = '' as $$
  select i.id, i.relationship_id,
    case when i.invited_user_id = (select auth.uid()) then 'received' else 'sent' end,
    r.name,
    case when i.invited_user_id = (select auth.uid())
      then creator.display_name else coalesce(recipient.display_name, 'Pessoa convidada') end,
    i.expires_at
  from public.relationship_invitations i
  join public.relationships r on r.id = i.relationship_id
  join public.profiles creator on creator.id = i.created_by
  left join public.profiles recipient on recipient.id = i.invited_user_id
  where (i.invited_user_id = (select auth.uid()) or i.created_by = (select auth.uid()))
    and i.accepted_at is null and i.declined_at is null and i.expires_at > now()
  order by i.created_at desc;
$$;

create function public.accept_relationship_invitation(invitation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation public.relationship_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  select * into invitation from public.relationship_invitations
   where id = invitation_id for update;
  if not found or invitation.invited_user_id <> current_user_id
    or invitation.accepted_at is not null or invitation.declined_at is not null
    or invitation.expires_at <= now() then
    raise exception 'Convite indisponível.' using errcode = '42501';
  end if;
  perform 1 from public.relationships
   where id = invitation.relationship_id and archived_at is null for update;
  if not found or not exists (select 1 from public.profiles where id = current_user_id)
    or not exists (select 1 from public.relationship_members
      where relationship_id = invitation.relationship_id and user_id = invitation.created_by
        and revoked_at is null)
    or (select count(*) from public.relationship_members
      where relationship_id = invitation.relationship_id and revoked_at is null) <> 1
    or exists (select 1 from public.relationship_members
      where user_id = current_user_id and revoked_at is null) then
    raise exception 'Não foi possível aceitar este convite.' using errcode = '23514';
  end if;
  insert into public.relationship_members(relationship_id, user_id)
  values (invitation.relationship_id, current_user_id);
  update public.relationship_invitations set accepted_at = now() where id = invitation_id;
  return invitation.relationship_id;
end;
$$;

create function public.decline_relationship_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  update public.relationship_invitations set declined_at = now()
   where id = invitation_id and invited_user_id = current_user_id
     and accepted_at is null and declined_at is null and expires_at > now();
  if not found then
    raise exception 'Convite indisponível.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.create_profile(text,text), public.create_relationship(text),
  public.invite_partner(text), public.list_relationship_invitations(),
  public.accept_relationship_invitation(uuid), public.decline_relationship_invitation(uuid)
  from public, anon;
grant execute on function public.create_profile(text,text), public.create_relationship(text),
  public.invite_partner(text), public.list_relationship_invitations(),
  public.accept_relationship_invitation(uuid), public.decline_relationship_invitation(uuid)
  to authenticated;
