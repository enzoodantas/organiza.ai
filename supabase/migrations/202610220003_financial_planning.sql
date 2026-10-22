-- Estimativas editáveis, separadas de lançamentos efetivos e de aportes.
create table public.monthly_plan_items (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id),
  owner_id uuid not null,
  kind text not null check (kind in ('income', 'expense')),
  label text not null check (length(trim(label)) between 1 and 100),
  amount_cents bigint not null check (amount_cents between 1 and 10000000000),
  certainty text not null default 'regular' check (certainty in ('regular', 'variable')),
  remaining_installments integer check (remaining_installments between 1 and 600),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (relationship_id, owner_id) references public.relationship_members(relationship_id, user_id)
);
create index monthly_plan_by_relationship on public.monthly_plan_items(relationship_id, owner_id, active);

create table public.account_opening_balances (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id),
  account_id uuid not null unique,
  amount_cents bigint not null check (amount_cents between 0 and 10000000000),
  noted_on date not null,
  created_at timestamptz not null default now(),
  foreign key (relationship_id, account_id) references public.accounts(relationship_id, id)
);

create function private.touch_monthly_plan() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger monthly_plan_touch before update on public.monthly_plan_items
for each row execute function private.touch_monthly_plan();
create trigger monthly_plan_audit after insert or update or delete on public.monthly_plan_items
for each row execute function private.audit_change();
create trigger opening_balance_audit after insert or update or delete on public.account_opening_balances
for each row execute function private.audit_change();

alter table public.monthly_plan_items enable row level security;
alter table public.account_opening_balances enable row level security;
create policy monthly_plan_read on public.monthly_plan_items for select to authenticated
using (private.is_member(relationship_id));
create policy monthly_plan_insert on public.monthly_plan_items for insert to authenticated
with check (owner_id = (select auth.uid()) and private.is_member(relationship_id));
create policy monthly_plan_update on public.monthly_plan_items for update to authenticated
using (owner_id = (select auth.uid()) and private.is_member(relationship_id))
with check (owner_id = (select auth.uid()) and private.is_member(relationship_id));
create policy opening_balance_read on public.account_opening_balances for select to authenticated
using (private.is_member(relationship_id));

revoke all on public.monthly_plan_items, public.account_opening_balances from anon, authenticated;
grant select on public.monthly_plan_items, public.account_opening_balances to authenticated;
grant insert (relationship_id, owner_id, kind, label, amount_cents, certainty, remaining_installments)
  on public.monthly_plan_items to authenticated;
grant update (label, amount_cents, certainty, remaining_installments, active)
  on public.monthly_plan_items to authenticated;
