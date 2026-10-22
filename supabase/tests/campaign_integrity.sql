-- Rodar somente no Supabase local. Fixtures sintéticas são revertidas.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('41000000-0000-0000-0000-000000000001');
insert into public.profiles(id, display_name, mascot)
values ('41000000-0000-0000-0000-000000000001', 'Teste de integridade', 'cat');
insert into public.relationships(id, name)
values ('42000000-0000-0000-0000-000000000001', 'Teste de integridade');
insert into public.relationship_members(relationship_id, user_id)
values ('42000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001');
insert into public.accounts(id, relationship_id, owner_id, name, scope)
values ('43000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', null, 'Conta teste', 'shared');
insert into public.campaigns(id, relationship_id, name, target_cents)
values ('44000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'Grade teste', 2010000);
insert into public.contributions(id, relationship_id, campaign_id, participant_id, source_account_id, slot, amount_cents, idempotency_key)
values ('45000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 20, 2000, gen_random_uuid());
do $$
begin
  begin
    insert into public.contributions(relationship_id, campaign_id, participant_id, source_account_id, slot, amount_cents, idempotency_key)
    values ('42000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 20, 2000, gen_random_uuid());
    raise exception 'Número ativo duplicado foi aceito';
  exception when unique_violation then null; end;
  begin
    insert into public.contributions(relationship_id, campaign_id, participant_id, source_account_id, slot, amount_cents, idempotency_key)
    values ('42000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 21, 2000, gen_random_uuid());
    raise exception 'Valor diferente do número foi aceito';
  exception when check_violation then null; end;
  begin
    insert into public.contributions(relationship_id, campaign_id, participant_id, source_account_id, slot, amount_cents, idempotency_key)
    values ('42000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 201, 20100, gen_random_uuid());
    raise exception 'Número fora da grade foi aceito';
  exception when check_violation then null; end;
  begin
    update public.campaigns set target_cents = 100 where id = '44000000-0000-0000-0000-000000000001';
    raise exception 'Meta inconsistente foi aceita';
  exception when check_violation then null; end;
  begin
    update public.campaigns
      set rules = '{"type":"number_grid","min":1,"max":100,"unit_cents":100}'::jsonb,
          target_cents = 505000
      where id = '44000000-0000-0000-0000-000000000001';
    raise exception 'Campanha com histórico mudou suas regras';
  exception when check_violation then null; end;
end;
$$;
update public.contributions set reversed_at = now(), reversed_by = '41000000-0000-0000-0000-000000000001'
where id = '45000000-0000-0000-0000-000000000001';
insert into public.contributions(id, relationship_id, campaign_id, participant_id, source_account_id, slot, amount_cents, idempotency_key)
values ('45000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 20, 2000, gen_random_uuid());
do $$
begin
  if (select count(*) from public.contributions where campaign_id = '44000000-0000-0000-0000-000000000001') <> 2 then
    raise exception 'Histórico de reversão foi perdido';
  end if;
  if (select count(*) from public.contributions where campaign_id = '44000000-0000-0000-0000-000000000001' and reversed_at is null) <> 1 then
    raise exception 'Número ativo incorreto';
  end if;
  if (select count(*) from public.audit_events where entity_table = 'contributions' and relationship_id = '42000000-0000-0000-0000-000000000001') <> 3 then
    raise exception 'Auditoria de aporte/reversão incompleta';
  end if;
end;
$$;
rollback;
