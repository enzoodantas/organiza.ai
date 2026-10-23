-- Repetir a criação após uma resposta perdida não pode duplicar o saldo inicial.
alter table public.accounts add column creation_key uuid;
create unique index accounts_creation_key on public.accounts(relationship_id, creation_key)
  where creation_key is not null;
create trigger account_audit after insert or update or delete on public.accounts
  for each row execute function private.audit_change();

drop function public.create_financial_account(uuid,text,text,bigint,date);
create function public.create_financial_account(
  target_relationship uuid, account_name text, account_scope text,
  opening_cents bigint, opening_on date, request_key uuid
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; created_id uuid; existing public.accounts%rowtype;
  existing_opening public.account_opening_balances%rowtype;
  owner uuid;
begin
  actor := private.active_financial_member(target_relationship);
  if account_scope not in ('individual', 'shared')
     or length(btrim(account_name)) not between 1 and 100
     or opening_cents is null or opening_cents < 0 or opening_cents > 10000000000
     or opening_on is null or opening_on > current_date or request_key is null then
    raise exception 'Dados da conta ou saldo inicial inválidos.' using errcode = '22023';
  end if;
  if account_scope = 'shared' and opening_cents <> 0 then
    raise exception 'Abra uma conta conjunta com saldo zero e registre depósitos confirmados.' using errcode = '22023';
  end if;
  owner := case when account_scope = 'individual' then actor end;
  insert into public.accounts(relationship_id, owner_id, name, scope, creation_key)
  values (target_relationship, owner, btrim(account_name), account_scope, request_key)
  on conflict (relationship_id, creation_key) where creation_key is not null do nothing
  returning id into created_id;
  if created_id is not null then
    insert into public.account_opening_balances(relationship_id, account_id, amount_cents, noted_on)
    values (target_relationship, created_id, opening_cents, opening_on);
    return created_id;
  end if;
  select * into existing from public.accounts
    where relationship_id = target_relationship and creation_key = request_key;
  select * into existing_opening from public.account_opening_balances
    where account_id = existing.id;
  if existing.id is null or existing.owner_id is distinct from owner
     or existing.name <> btrim(account_name) or existing.scope <> account_scope
     or existing_opening.amount_cents <> opening_cents
     or existing_opening.noted_on <> opening_on then
    raise exception 'Chave de requisição reutilizada com dados diferentes.' using errcode = '23505';
  end if;
  return existing.id;
end;
$$;
revoke all on function public.create_financial_account(uuid,text,text,bigint,date,uuid)
  from public, anon, authenticated;
grant execute on function public.create_financial_account(uuid,text,text,bigint,date,uuid)
  to authenticated;
