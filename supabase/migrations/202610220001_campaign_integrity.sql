-- Garante que o valor reservado corresponde ao número escolhido. Não concede escrita ao cliente.
create function private.number_grid_terms(campaign_rules jsonb)
returns table(first_slot integer, last_slot integer, unit_cents bigint)
language plpgsql immutable set search_path = '' as $$
declare
  first_value numeric;
  last_value numeric;
  unit_value numeric;
begin
  if jsonb_typeof(campaign_rules) <> 'object'
     or campaign_rules->>'type' <> 'number_grid'
     or jsonb_typeof(campaign_rules->'min') <> 'number'
     or jsonb_typeof(campaign_rules->'max') <> 'number'
     or jsonb_typeof(campaign_rules->'unit_cents') <> 'number' then
    raise exception 'Regras da campanha inválidas ou não suportadas.' using errcode = '23514';
  end if;

  first_value := (campaign_rules->>'min')::numeric;
  last_value := (campaign_rules->>'max')::numeric;
  unit_value := (campaign_rules->>'unit_cents')::numeric;
  if first_value <> trunc(first_value) or last_value <> trunc(last_value)
     or unit_value <> trunc(unit_value) or first_value < 1
     or last_value < first_value or last_value > 10000
     or unit_value < 1 or unit_value > 10000000000 then
    raise exception 'Faixa ou unidade da campanha inválida.' using errcode = '23514';
  end if;

  first_slot := first_value::integer;
  last_slot := last_value::integer;
  unit_cents := unit_value::bigint;
  return next;
end;
$$;
revoke all on function private.number_grid_terms(jsonb) from public, anon, authenticated;

create function private.check_campaign() returns trigger
language plpgsql set search_path = '' as $$
declare
  terms record;
  expected numeric;
begin
  select * into terms from private.number_grid_terms(new.rules);
  expected := ((terms.last_slot::numeric - terms.first_slot + 1)
    * (terms.first_slot::numeric + terms.last_slot) / 2) * terms.unit_cents;
  if new.target_cents::numeric <> expected then
    raise exception 'A meta deve ser igual à soma dos números da campanha.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and (new.rules, new.target_cents) is distinct from (old.rules, old.target_cents)
     and exists(select 1 from public.contributions where campaign_id = old.id) then
    raise exception 'Campanha com histórico de aportes não pode mudar de regra ou meta.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.check_campaign() from public, anon, authenticated;
create trigger campaign_integrity before insert or update of rules, target_cents on public.campaigns
for each row execute function private.check_campaign();

create function private.check_contribution() returns trigger
language plpgsql set search_path = '' as $$
declare
  terms record;
  campaign_rules jsonb;
begin
  select rules into campaign_rules from public.campaigns
    where relationship_id = new.relationship_id and id = new.campaign_id;
  if not found then
    raise exception 'Campanha não encontrada neste relacionamento.' using errcode = '23503';
  end if;
  select * into terms from private.number_grid_terms(campaign_rules);
  if new.slot < terms.first_slot or new.slot > terms.last_slot
     or new.amount_cents::numeric <> new.slot::numeric * terms.unit_cents then
    raise exception 'Número ou valor do aporte não corresponde à campanha.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.check_contribution() from public, anon, authenticated;
create trigger contribution_integrity before insert or update of relationship_id, campaign_id, slot, amount_cents on public.contributions
for each row execute function private.check_contribution();
