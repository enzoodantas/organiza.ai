-- Reversões seguem a mesma ordem de bloqueio das novas operações: contas antes de registros.
-- Isso evita espera circular ao disputar a reversão e a reutilização de um número.

create or replace function public.reverse_financial_entry(entry_id uuid) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; item public.financial_entries%rowtype; available numeric;
begin
  select * into item from public.financial_entries where id = entry_id;
  if not found then raise exception 'Movimentação não encontrada.' using errcode = '02000'; end if;
  actor := private.active_financial_member(item.relationship_id);
  if item.owner_id <> actor and item.scope <> 'shared' then
    raise exception 'Esta movimentação pertence à outra pessoa.' using errcode = '42501';
  end if;
  perform 1 from public.accounts a
    where a.relationship_id = item.relationship_id
      and a.id in (item.source_account_id, item.destination_account_id)
    order by a.id for update;
  select * into item from public.financial_entries where id = entry_id for update;
  if item.reversed_at is not null then return item.id; end if;
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

create or replace function public.reverse_number(contribution_id uuid) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid; item public.contributions%rowtype; account_scope text;
begin
  select * into item from public.contributions where id = contribution_id;
  if not found then raise exception 'Aporte não encontrado.' using errcode = '02000'; end if;
  actor := private.active_financial_member(item.relationship_id);
  select scope into account_scope from public.accounts where id = item.source_account_id;
  if item.participant_id <> actor and account_scope <> 'shared' then
    raise exception 'Este aporte pertence à outra pessoa.' using errcode = '42501';
  end if;
  perform 1 from public.accounts where id = item.source_account_id for update;
  select * into item from public.contributions where id = contribution_id for update;
  if item.reversed_at is not null then return item.id; end if;
  update public.contributions set reversed_at = now(), reversed_by = actor where id = item.id;
  return item.id;
end;
$$;
