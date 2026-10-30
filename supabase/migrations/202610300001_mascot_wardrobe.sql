-- Cosmetic economy: no real currency, client writes or rewards based on spending.
create table public.mascot_items (
  id text primary key,
  name text not null,
  slot text not null check (slot in ('outfit', 'hat')),
  price integer not null check (price between 1 and 1000)
);
insert into public.mascot_items values
  ('sweater_sage', 'Suéter jardim', 'outfit', 5),
  ('sweater_rose', 'Suéter abraço', 'outfit', 5),
  ('overalls', 'Jardineira dos sonhos', 'outfit', 10),
  ('sun_hat', 'Chapéu de passeio', 'hat', 5),
  ('party_hat', 'Chapéu de celebração', 'hat', 10);

create table public.mascot_wallets (
  user_id uuid primary key references public.profiles(id),
  coins integer not null default 0 check (coins >= 0),
  xp integer not null default 0 check (xp >= 0)
);
create table public.mascot_inventory (
  user_id uuid not null references public.profiles(id),
  item_id text not null references public.mascot_items(id),
  purchased_at timestamptz not null default now(),
  equipped boolean not null default false,
  primary key (user_id, item_id)
);
create table public.mascot_reviews (
  user_id uuid not null references public.profiles(id),
  week_start date not null,
  reviewed_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.mascot_items enable row level security;
alter table public.mascot_wallets enable row level security;
alter table public.mascot_inventory enable row level security;
alter table public.mascot_reviews enable row level security;
revoke all on public.mascot_items, public.mascot_wallets, public.mascot_inventory, public.mascot_reviews from public, anon, authenticated;
grant select on public.mascot_items, public.mascot_wallets, public.mascot_inventory, public.mascot_reviews to authenticated;
create policy mascot_catalog_read on public.mascot_items for select to authenticated using (true);
create policy mascot_wallet_read on public.mascot_wallets for select to authenticated using (user_id = (select auth.uid()) or private.is_peer(user_id));
create policy mascot_inventory_read on public.mascot_inventory for select to authenticated using (user_id = (select auth.uid()) or private.is_peer(user_id));
create policy mascot_review_read on public.mascot_reviews for select to authenticated using (user_id = (select auth.uid()));

-- Locks the membership before the wallet, including revocation checks.
create function private.lock_mascot_member() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Entre na sua conta.' using errcode = '42501'; end if;
  perform 1 from public.relationship_members m join public.relationships r on r.id = m.relationship_id
    where m.user_id = uid and m.revoked_at is null and r.archived_at is null
    for share of m, r;
  if not found then raise exception 'Conclua seu vínculo ativo.' using errcode = '42501'; end if;
  insert into public.mascot_wallets(user_id) values (uid) on conflict do nothing;
  perform 1 from public.mascot_wallets where user_id = uid for update;
  return uid;
end $$;
revoke all on function private.lock_mascot_member() from public, anon, authenticated;

create function public.complete_mascot_review() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid; week date := date_trunc('week', now() at time zone 'America/Sao_Paulo')::date;
begin
  uid := private.lock_mascot_member();
  -- A review is a self-declaration after looking at the planning, never an amount target.
  if not exists(select 1 from public.monthly_plan_items p join public.relationship_members m
    on m.relationship_id = p.relationship_id and m.user_id = uid and m.revoked_at is null
    where p.active) then
    raise exception 'Prepare ao menos um item ativo no planejamento antes da revisão.' using errcode = '23514';
  end if;
  insert into public.mascot_reviews(user_id, week_start) values (uid, week) on conflict do nothing;
  if not found then return false; end if;
  update public.mascot_wallets set coins = coins + 5, xp = xp + 20 where user_id = uid;
  return true;
end $$;

create function public.buy_mascot_item(target_item text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid; cost integer;
begin
  uid := private.lock_mascot_member();
  select price into cost from public.mascot_items where id = target_item for share;
  if not found then raise exception 'Peça indisponível.' using errcode = '23514'; end if;
  if exists(select 1 from public.mascot_inventory where user_id = uid and item_id = target_item) then return false; end if;
  update public.mascot_wallets set coins = coins - cost where user_id = uid and coins >= cost;
  if not found then raise exception 'Moedas insuficientes. Cada revisão semanal rende 5 moedas.' using errcode = '23514'; end if;
  insert into public.mascot_inventory(user_id, item_id) values (uid, target_item);
  return true;
end $$;

create function public.equip_mascot_item(target_item text, wear boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid; target_slot text;
begin
  uid := private.lock_mascot_member();
  if wear is null then raise exception 'Escolha vestir ou guardar.' using errcode = '23514'; end if;
  select i.slot into target_slot from public.mascot_items i join public.mascot_inventory v on v.item_id = i.id
    where v.user_id = uid and i.id = target_item;
  if not found then raise exception 'Esta peça ainda não é sua.' using errcode = '42501'; end if;
  if wear then
    update public.mascot_inventory v set equipped = false from public.mascot_items i
      where v.user_id = uid and v.item_id = i.id and i.slot = target_slot;
  end if;
  update public.mascot_inventory set equipped = wear where user_id = uid and item_id = target_item;
end $$;
revoke all on function public.complete_mascot_review(), public.buy_mascot_item(text), public.equip_mascot_item(text, boolean) from public, anon;
grant execute on function public.complete_mascot_review(), public.buy_mascot_item(text), public.equip_mascot_item(text, boolean) to authenticated;
