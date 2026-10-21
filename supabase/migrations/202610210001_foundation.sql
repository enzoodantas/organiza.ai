-- Fundação segura. UI real e RPCs de escrita ainda não ativadas.
-- Aplicar primeiro em projeto de desenvolvimento, com Supabase CLI.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text not null check (length(display_name) between 1 and 80),
  mascot text not null check (mascot in ('cat', 'dog')),
  created_at timestamptz not null default now()
);
create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create table public.relationship_members (
  relationship_id uuid not null references public.relationships,
  user_id uuid not null references public.profiles,
  joined_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (relationship_id, user_id)
);
create index member_lookup on public.relationship_members(user_id, relationship_id) where revoked_at is null;

-- SECURITY DEFINER evita recursão de RLS na tabela de membros.
create function private.is_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.relationship_members m
    where m.relationship_id = target and m.user_id = (select auth.uid()) and m.revoked_at is null)
$$;
create function private.is_peer(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.relationship_members a
    join public.relationship_members b using(relationship_id)
    where a.user_id = (select auth.uid()) and b.user_id = target
      and a.revoked_at is null and b.revoked_at is null)
$$;
revoke all on function private.is_member(uuid), private.is_peer(uuid) from public;
grant execute on function private.is_member(uuid), private.is_peer(uuid) to authenticated;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships,
  owner_id uuid references public.profiles,
  name text not null check (length(name) between 1 and 100),
  scope text not null check(scope in ('individual','shared')),
  currency text not null default 'BRL' check(currency = 'BRL'),
  check ((scope = 'individual' and owner_id is not null) or (scope = 'shared' and owner_id is null)),
  foreign key (relationship_id, owner_id) references public.relationship_members(relationship_id, user_id),
  unique(relationship_id, id)
);
create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships,
  owner_id uuid not null references public.profiles,
  scope text not null check(scope in ('individual','shared')),
  kind text not null check(kind in ('income','expense','transfer')),
  amount_cents bigint not null check(amount_cents between 1 and 10000000000),
  source_account_id uuid,
  destination_account_id uuid,
  description text not null check(length(description) between 1 and 120),
  occurred_on date not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references public.profiles,
  check((reversed_at is null) = (reversed_by is null)),
  check (
    (kind = 'income' and source_account_id is null and destination_account_id is not null) or
    (kind = 'expense' and source_account_id is not null and destination_account_id is null) or
    (kind = 'transfer' and source_account_id is not null and destination_account_id is not null and source_account_id <> destination_account_id)
  ),
  foreign key(relationship_id, owner_id) references public.relationship_members(relationship_id, user_id),
  foreign key(relationship_id, source_account_id) references public.accounts(relationship_id, id),
  foreign key(relationship_id, destination_account_id) references public.accounts(relationship_id, id),
  unique(relationship_id, idempotency_key), unique(relationship_id, id)
);
create index entries_timeline on public.financial_entries(relationship_id, occurred_on desc);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships,
  name text not null,
  target_cents bigint not null check(target_cents > 0),
  rules jsonb not null default '{"type":"number_grid","min":1,"max":200,"unit_cents":100}'::jsonb,
  unique(relationship_id, id)
);
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  campaign_id uuid not null,
  participant_id uuid not null,
  source_account_id uuid not null,
  slot integer not null check(slot > 0),
  amount_cents bigint not null check(amount_cents between 1 and 10000000000),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references public.profiles,
  check((reversed_at is null) = (reversed_by is null)),
  foreign key(relationship_id, campaign_id) references public.campaigns(relationship_id, id),
  foreign key(relationship_id, participant_id) references public.relationship_members(relationship_id, user_id),
  foreign key(relationship_id, source_account_id) references public.accounts(relationship_id, id),
  unique(relationship_id, idempotency_key)
);
-- Duas requisições concorrentes jamais preenchem o mesmo número ativo.
create unique index one_active_slot on public.contributions(campaign_id, slot) where reversed_at is null;
create table public.reward_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  user_id uuid not null,
  event_type text not null,
  source_key text not null,
  rule_version integer not null,
  xp integer not null check(xp >= 0),
  virtual_coins integer not null check(virtual_coins >= 0),
  reversed_at timestamptz,
  foreign key(relationship_id, user_id) references public.relationship_members(relationship_id, user_id),
  unique(relationship_id, user_id, event_type, source_key)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  relationship_id uuid not null references public.relationships,
  actor_id uuid,
  entity_table text not null,
  entity_id uuid not null,
  operation text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create function private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(relationship_id,actor_id,entity_table,entity_id,operation,before_data,after_data)
  values(coalesce(new.relationship_id,old.relationship_id), auth.uid(), tg_table_name, coalesce(new.id,old.id), tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new,old);
end $$;
revoke all on function private.audit_change() from public;
create trigger financial_audit after insert or update or delete on public.financial_entries for each row execute function private.audit_change();
create trigger contribution_audit after insert or update or delete on public.contributions for each row execute function private.audit_change();
create trigger reward_audit after insert or update or delete on public.reward_events for each row execute function private.audit_change();

alter table public.profiles enable row level security;
alter table public.relationships enable row level security;
alter table public.relationship_members enable row level security;
alter table public.accounts enable row level security;
alter table public.financial_entries enable row level security;
alter table public.campaigns enable row level security;
alter table public.contributions enable row level security;
alter table public.reward_events enable row level security;
alter table public.audit_events enable row level security;

create policy profile_read on public.profiles for select to authenticated using(id = (select auth.uid()) or private.is_peer(id));
create policy relationship_read on public.relationships for select to authenticated using(private.is_member(id));
create policy members_read on public.relationship_members for select to authenticated using(private.is_member(relationship_id));
create policy accounts_read on public.accounts for select to authenticated using(private.is_member(relationship_id));
create policy entries_read on public.financial_entries for select to authenticated using(private.is_member(relationship_id));
create policy campaigns_read on public.campaigns for select to authenticated using(private.is_member(relationship_id));
create policy contributions_read on public.contributions for select to authenticated using(private.is_member(relationship_id));
create policy rewards_read on public.reward_events for select to authenticated using(private.is_member(relationship_id));
create policy audit_read on public.audit_events for select to authenticated using(private.is_member(relationship_id));

-- Fail-closed: escrita real só será liberada com RPCs transacionais testadas na Sprint 02.
-- Nem o cliente autenticado pode se vincular sozinho a outro relacionamento.
revoke all on public.profiles, public.relationships, public.relationship_members, public.accounts,
  public.financial_entries, public.campaigns, public.contributions, public.reward_events, public.audit_events from anon, authenticated;
grant select on public.profiles, public.relationships, public.relationship_members, public.accounts,
  public.financial_entries, public.campaigns, public.contributions, public.reward_events, public.audit_events to authenticated;
revoke all on sequence public.audit_events_id_seq from anon, authenticated;
-- Realtime de movimentações sob as mesmas políticas de leitura (assinaturas ainda não ligadas à UI).
alter publication supabase_realtime add table public.financial_entries, public.contributions;
