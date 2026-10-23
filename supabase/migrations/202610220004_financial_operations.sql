-- Operações financeiras reais. A identidade vem sempre de auth.uid().
-- As tabelas continuam sem INSERT/UPDATE/DELETE para clientes.

create function private.active_financial_member(target_relationship uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from public.relationship_members m
    join public.relationships r on r.id = m.relationship_id
    where m.relationship_id = target_relationship and m.user_id = actor
      and m.revoked_at is null and r.archived_at is null
  ) then
    raise exception 'Vínculo financeiro inativo ou inexistente.' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create function private.account_position(target_account uuid)
returns table(balance_cents numeric, reserved_cents numeric, available_cents numeric)
language sql stable security definer set search_path = '' as $$
  with opening as (
    select coalesce(sum(b.amount_cents), 0)::numeric as amount
    from public.account_opening_balances b where b.account_id = target_account
  ), movements as (
    select coalesce(sum(case
      when e.destination_account_id = target_account then e.amount_cents::numeric
      when e.source_account_id = target_account then -e.amount_cents::numeric
      else 0 end), 0) as amount
    from public.financial_entries e
    where e.reversed_at is null
      and (e.source_account_id = target_account or e.destination_account_id = target_account)
  ), reservations as (
    select coalesce(sum(c.amount_cents), 0)::numeric as amount
    from public.contributions c
    where c.source_account_id = target_account and c.reversed_at is null
  )
  select opening.amount + movements.amount, reservations.amount,
    opening.amount + movements.amount - reservations.amount
  from opening, movements, reservations;
$$;

create function public.list_account_positions(target_relationship uuid)
returns table(account_id uuid, balance_cents text, reserved_cents text, available_cents text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.active_financial_member(target_relationship);
  return query
    select a.id, p.balance_cents::text, p.reserved_cents::text, p.available_cents::text
    from public.accounts a
    cross join lateral private.account_position(a.id) p
    where a.relationship_id = target_relationship
    order by a.name, a.id;
end;
$$;

create function public.create_financial_account(
  target_relationship uuid, account_name text, account_scope text,
  opening_cents bigint, opening_on date
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; created_id uuid;
begin
  actor := private.active_financial_member(target_relationship);
  if account_scope not in ('individual', 'shared')
     or length(btrim(account_name)) not between 1 and 100
     or opening_cents is null or opening_cents < 0 or opening_cents > 10000000000
     or opening_on is null or opening_on > current_date then
    raise exception 'Dados da conta ou saldo inicial inválidos.' using errcode = '22023';
  end if;
  -- Um saldo compartilhado novo exige acordo prévio; o cofrinho existente já foi informado pelo casal.
  if account_scope = 'shared' and opening_cents <> 0 then
    raise exception 'Abra uma conta conjunta com saldo zero e registre depósitos confirmados.' using errcode = '22023';
  end if;
  insert into public.accounts(relationship_id, owner_id, name, scope)
  values (target_relationship, case when account_scope = 'individual' then actor end,
    btrim(account_name), account_scope)
  returning id into created_id;
  insert into public.account_opening_balances(relationship_id, account_id, amount_cents, noted_on)
  values (target_relationship, created_id, opening_cents, opening_on);
  return created_id;
end;
$$;

create function public.record_financial_entry(
  target_relationship uuid, entry_kind text, amount_cents bigint,
  source_id uuid, destination_id uuid, entry_description text,
  entry_on date, request_key uuid
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  actor uuid; old_entry public.financial_entries%rowtype;
  source_account public.accounts%rowtype; destination_account public.accounts%rowtype;
  opening_date date; available numeric; created_id uuid; entry_scope text;
begin
  actor := private.active_financial_member(target_relationship);
  if entry_kind not in ('income', 'expense', 'transfer')
     or amount_cents is null or amount_cents not between 1 and 10000000000
     or length(btrim(entry_description)) not between 1 and 120
     or entry_on is null or entry_on > current_date
     or request_key is null
     or (entry_kind = 'income' and (source_id is not null or destination_id is null))
     or (entry_kind = 'expense' and (source_id is null or destination_id is not null))
     or (entry_kind = 'transfer' and (source_id is null or destination_id is null or source_id = destination_id)) then
    raise exception 'Dados da movimentação inválidos.' using errcode = '22023';
  end if;

  -- A ordem fixa evita deadlocks entre transferências em sentidos opostos.
  perform 1 from public.accounts a
    where a.relationship_id = target_relationship and a.id in (source_id, destination_id)
    order by a.id for update;
  if source_id is not null then
    select * into source_account from public.accounts where id = source_id and relationship_id = target_relationship;
    if not found or (source_account.scope = 'individual' and source_account.owner_id <> actor) then
      raise exception 'Conta de origem não autorizada.' using errcode = '42501';
    end if;
  end if;
  if destination_id is not null then
    select * into destination_account from public.accounts where id = destination_id and relationship_id = target_relationship;
    if not found or (destination_account.scope = 'individual' and destination_account.owner_id <> actor) then
      raise exception 'Conta de destino não autorizada.' using errcode = '42501';
    end if;
  end if;
  select greatest(
    coalesce((select b.noted_on from public.account_opening_balances b where b.account_id = source_id), '-infinity'::date),
    coalesce((select b.noted_on from public.account_opening_balances b where b.account_id = destination_id), '-infinity'::date)
  ) into opening_date;
  if opening_date = '-infinity'::date or entry_on < opening_date then
    raise exception 'A data deve ser igual ou posterior ao saldo inicial das contas.' using errcode = '22023';
  end if;

  entry_scope := case when coalesce(source_account.scope, destination_account.scope) = 'shared'
    and coalesce(destination_account.scope, source_account.scope) = 'shared'
    then 'shared' else 'individual' end;
  select * into old_entry from public.financial_entries
    where relationship_id = target_relationship and idempotency_key = request_key;
  if found then
    if (old_entry.owner_id, old_entry.kind, old_entry.amount_cents,
        old_entry.source_account_id, old_entry.destination_account_id,
        old_entry.description, old_entry.occurred_on)
       is not distinct from
       (actor, entry_kind, amount_cents, source_id, destination_id,
        btrim(entry_description), entry_on) then
      return old_entry.id;
    end if;
    raise exception 'Chave de requisição reutilizada com dados diferentes.' using errcode = '23505';
  end if;

  if source_id is not null then
    select p.available_cents into available from private.account_position(source_id) p;
    if available < amount_cents then
      raise exception 'Saldo livre insuficiente na conta de origem.' using errcode = '22003';
    end if;
  end if;
  insert into public.financial_entries(relationship_id, owner_id, scope, kind, amount_cents,
    source_account_id, destination_account_id, description, occurred_on, idempotency_key)
  values (target_relationship, actor, entry_scope, entry_kind, amount_cents,
    source_id, destination_id, btrim(entry_description), entry_on, request_key)
  returning id into created_id;
  return created_id;
end;
$$;

create function public.reverse_financial_entry(entry_id uuid) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; item public.financial_entries%rowtype; available numeric;
begin
  select * into item from public.financial_entries where id = entry_id for update;
  if not found then raise exception 'Movimentação não encontrada.' using errcode = '02000'; end if;
  actor := private.active_financial_member(item.relationship_id);
  if item.owner_id <> actor and item.scope <> 'shared' then
    raise exception 'Esta movimentação pertence à outra pessoa.' using errcode = '42501';
  end if;
  if item.reversed_at is not null then return item.id; end if;
  perform 1 from public.accounts a
    where a.relationship_id = item.relationship_id
      and a.id in (item.source_account_id, item.destination_account_id)
    order by a.id for update;
  if item.destination_account_id is not null then
    select p.available_cents into available from private.account_position(item.destination_account_id) p;
    if available < item.amount_cents then
      raise exception 'A reversão deixaria uma conta ou reserva sem cobertura.' using errcode = '22003';
    end if;
  end if;
  update public.financial_entries set reversed_at = now(), reversed_by = actor where id = item.id;
  return item.id;
end;
$$;

create unique index one_number_grid_campaign_per_relationship
  on public.campaigns(relationship_id) where (rules->>'type') = 'number_grid';

create function public.ensure_number_campaign(target_relationship uuid) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare campaign_id uuid;
begin
  perform private.active_financial_member(target_relationship);
  perform 1 from public.relationships where id = target_relationship for update;
  select id into campaign_id from public.campaigns
    where relationship_id = target_relationship and rules->>'type' = 'number_grid';
  if found then return campaign_id; end if;
  insert into public.campaigns(relationship_id, name, target_cents)
  values (target_relationship, 'Desafio dos R$ 20.100', 2010000)
  returning id into campaign_id;
  return campaign_id;
end;
$$;

create function public.reserve_number(
  target_relationship uuid, target_campaign uuid, source_id uuid,
  selected_slot integer, request_key uuid
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; source_account public.accounts%rowtype;
  old_contribution public.contributions%rowtype; available numeric; created_id uuid;
  required_cents bigint;
begin
  actor := private.active_financial_member(target_relationship);
  if selected_slot is null or selected_slot not between 1 and 200 or request_key is null then
    raise exception 'Número ou requisição inválidos.' using errcode = '22023';
  end if;
  required_cents := selected_slot::bigint * 100;
  select * into source_account from public.accounts
    where id = source_id and relationship_id = target_relationship for update;
  if not found or (source_account.scope = 'individual' and source_account.owner_id <> actor) then
    raise exception 'Conta de reserva não autorizada.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campaigns
      where id = target_campaign and relationship_id = target_relationship
        and rules = '{"type":"number_grid","min":1,"max":200,"unit_cents":100}'::jsonb) then
    raise exception 'Campanha inválida.' using errcode = '22023';
  end if;
  select * into old_contribution from public.contributions
    where relationship_id = target_relationship and idempotency_key = request_key;
  if found then
    if (old_contribution.participant_id, old_contribution.campaign_id,
      old_contribution.source_account_id, old_contribution.slot, old_contribution.amount_cents)
      is not distinct from (actor, target_campaign, source_id, selected_slot, required_cents) then
      return old_contribution.id;
    end if;
    raise exception 'Chave de requisição reutilizada com dados diferentes.' using errcode = '23505';
  end if;
  select p.available_cents into available from private.account_position(source_id) p;
  if available < required_cents then
    raise exception 'Saldo livre insuficiente para esta reserva.' using errcode = '22003';
  end if;
  insert into public.contributions(relationship_id, campaign_id, participant_id,
    source_account_id, slot, amount_cents, idempotency_key)
  values (target_relationship, target_campaign, actor, source_id,
    selected_slot, required_cents, request_key)
  returning id into created_id;
  return created_id;
end;
$$;

create function public.reverse_number(contribution_id uuid) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; item public.contributions%rowtype; account_scope text;
begin
  select * into item from public.contributions where id = contribution_id for update;
  if not found then raise exception 'Aporte não encontrado.' using errcode = '02000'; end if;
  actor := private.active_financial_member(item.relationship_id);
  select scope into account_scope from public.accounts where id = item.source_account_id;
  if item.participant_id <> actor and account_scope <> 'shared' then
    raise exception 'Este aporte pertence à outra pessoa.' using errcode = '42501';
  end if;
  if item.reversed_at is not null then return item.id; end if;
  perform 1 from public.accounts where id = item.source_account_id for update;
  update public.contributions set reversed_at = now(), reversed_by = actor where id = item.id;
  return item.id;
end;
$$;

revoke all on function private.active_financial_member(uuid), private.account_position(uuid)
  from public, anon, authenticated;
revoke all on function public.list_account_positions(uuid),
  public.create_financial_account(uuid,text,text,bigint,date),
  public.record_financial_entry(uuid,text,bigint,uuid,uuid,text,date,uuid),
  public.reverse_financial_entry(uuid), public.ensure_number_campaign(uuid),
  public.reserve_number(uuid,uuid,uuid,integer,uuid), public.reverse_number(uuid)
  from public, anon, authenticated;
grant execute on function public.list_account_positions(uuid),
  public.create_financial_account(uuid,text,text,bigint,date),
  public.record_financial_entry(uuid,text,bigint,uuid,uuid,text,date,uuid),
  public.reverse_financial_entry(uuid), public.ensure_number_campaign(uuid),
  public.reserve_number(uuid,uuid,uuid,integer,uuid), public.reverse_number(uuid)
  to authenticated;
