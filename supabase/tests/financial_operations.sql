-- Executar somente no Supabase local. Usa identidades sintéticas e ROLLBACK.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values
  ('51000000-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000002'),
  ('51000000-0000-0000-0000-000000000003');
insert into public.profiles(id, display_name, mascot) values
  ('51000000-0000-0000-0000-000000000001', 'Teste A1', 'cat'),
  ('51000000-0000-0000-0000-000000000002', 'Teste A2', 'dog'),
  ('51000000-0000-0000-0000-000000000003', 'Teste B1', 'cat');
insert into public.relationships(id, name) values
  ('52000000-0000-0000-0000-000000000001', 'Teste A'),
  ('52000000-0000-0000-0000-000000000002', 'Teste B');
insert into public.relationship_members(relationship_id, user_id) values
  ('52000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001'),
  ('52000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000002'),
  ('52000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000001', true);
do $$
declare
  rel uuid := '52000000-0000-0000-0000-000000000001';
  own uuid; shared uuid; campaign uuid; first_id uuid; retry_id uuid;
  balance numeric; reserved numeric; available numeric;
begin
  own := public.create_financial_account(rel, 'Individual teste', 'individual', 10000, current_date,
    '53000000-0000-0000-0000-000000000010');
  if own <> public.create_financial_account(rel, 'Individual teste', 'individual', 10000, current_date,
    '53000000-0000-0000-0000-000000000010') then raise exception 'Conta duplicada em retry'; end if;
  begin
    perform public.create_financial_account(rel, 'Outra conta', 'individual', 10000, current_date,
      '53000000-0000-0000-0000-000000000010');
    raise exception 'Chave de conta reutilizada com dados distintos';
  exception when unique_violation then null; end;
  shared := public.create_financial_account(rel, 'Conjunta teste', 'shared', 0, current_date,
    '53000000-0000-0000-0000-000000000011');
  campaign := public.ensure_number_campaign(rel);
  if campaign <> public.ensure_number_campaign(rel) then raise exception 'Campanha duplicada'; end if;
  first_id := public.record_financial_entry(rel, 'income', 5000, null, own,
    'Entrada teste', current_date, '53000000-0000-0000-0000-000000000001');
  retry_id := public.record_financial_entry(rel, 'income', 5000, null, own,
    'Entrada teste', current_date, '53000000-0000-0000-0000-000000000001');
  if first_id <> retry_id then raise exception 'Idempotência falhou'; end if;
  begin
    perform public.record_financial_entry(rel, 'income', 6000, null, own,
      'Entrada diferente', current_date, '53000000-0000-0000-0000-000000000001');
    raise exception 'Chave reutilizada aceita';
  exception when unique_violation then null; end;
  perform public.record_financial_entry(rel, 'expense', 1000, own, null,
    'Despesa teste', current_date, '53000000-0000-0000-0000-000000000002');
  perform public.reserve_number(rel, campaign, own, 20,
    '53000000-0000-0000-0000-000000000003');
  perform public.record_financial_entry(rel, 'transfer', 5000, own, shared,
    'Transferência teste', current_date, '53000000-0000-0000-0000-000000000004');
  select p.balance_cents::numeric, p.reserved_cents::numeric, p.available_cents::numeric
    into balance, reserved, available from public.list_account_positions(rel) p
    where p.account_id = own;
  if (balance, reserved, available) is distinct from (9000::numeric, 2000::numeric, 7000::numeric)
    then raise exception 'Saldo livre incorreto: %, %, %', balance, reserved, available; end if;
  begin
    perform public.record_financial_entry(rel, 'expense', 8000, own, null,
      'Excesso', current_date, '53000000-0000-0000-0000-000000000005');
    raise exception 'Gasto sem cobertura aceito';
  exception when numeric_value_out_of_range then null; end;
  perform public.reserve_number(rel, campaign, own, 60,
    '53000000-0000-0000-0000-000000000006');
  begin
    perform public.reverse_financial_entry(first_id);
    raise exception 'Reversão de receita descobriu reserva';
  exception when numeric_value_out_of_range then null; end;
  perform public.reverse_number((select id from public.contributions
    where idempotency_key = '53000000-0000-0000-0000-000000000006'));
  perform public.reverse_financial_entry(first_id);
  if (select count(*) from public.financial_entries where relationship_id = rel) <> 3 then
    raise exception 'Histórico financeiro perdido';
  end if;
  if (select count(*) from public.audit_events where relationship_id = rel
      and entity_table in ('financial_entries', 'contributions')) <> 7 then
    raise exception 'Auditoria de criação/reversão incompleta';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000002', true);
do $$
declare rel uuid := '52000000-0000-0000-0000-000000000001';
  own uuid; shared uuid; campaign uuid;
begin
  select id into own from public.accounts where name = 'Individual teste' and relationship_id = rel;
  select id into shared from public.accounts where name = 'Conjunta teste' and relationship_id = rel;
  select id into campaign from public.campaigns where relationship_id = rel;
  if not exists (select 1 from public.list_account_positions(rel) where account_id = own) then
    raise exception 'Parceiro não consegue ler conta do casal';
  end if;
  begin
    perform public.record_financial_entry(rel, 'expense', 100, own, null,
      'Gasto alheio', current_date, '53000000-0000-0000-0000-000000000007');
    raise exception 'Parceiro alterou conta individual alheia';
  exception when insufficient_privilege then null; end;
  perform public.reserve_number(rel, campaign, shared, 10,
    '53000000-0000-0000-0000-000000000008');
  begin
    insert into public.financial_entries(relationship_id, owner_id, scope, kind,
      amount_cents, source_account_id, description, occurred_on, idempotency_key)
    values (rel, auth.uid(), 'shared', 'expense', 100, shared, 'Direto', current_date,
      '53000000-0000-0000-0000-000000000009');
    raise exception 'Escrita direta concedida';
  exception when insufficient_privilege then null; end;
end;
$$;

select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000003', true);
do $$
begin
  begin
    perform * from public.list_account_positions('52000000-0000-0000-0000-000000000001');
    raise exception 'Outro casal leu posições financeiras';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.accounts where relationship_id = '52000000-0000-0000-0000-000000000001') then
    raise exception 'RLS vazou conta para outro casal';
  end if;
end;
$$;

reset role;
update public.relationship_members set revoked_at = now()
where relationship_id = '52000000-0000-0000-0000-000000000001'
  and user_id = '51000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', '51000000-0000-0000-0000-000000000002', true);
do $$
begin
  begin
    perform * from public.list_account_positions('52000000-0000-0000-0000-000000000001');
    raise exception 'Membro revogado consultou saldo';
  exception when insufficient_privilege then null; end;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform public.ensure_number_campaign('52000000-0000-0000-0000-000000000001');
    raise exception 'Anônimo executou operação financeira';
  exception when insufficient_privilege then null; end;
end;
$$;

reset role;
rollback;
