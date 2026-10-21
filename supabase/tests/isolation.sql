-- Rodar somente em Supabase LOCAL descartável. Fixtures sintéticas e rollback.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values
('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002'),('10000000-0000-0000-0000-000000000003'),('10000000-0000-0000-0000-000000000004');
insert into public.profiles(id,display_name,mascot) select id,'Perfil teste','cat' from auth.users where id::text like '10000000-0000-0000-0000-00000000000%';
insert into public.relationships(id,name) values ('20000000-0000-0000-0000-000000000001','Casal A'),('20000000-0000-0000-0000-000000000002','Casal B');
insert into public.relationship_members(relationship_id,user_id,revoked_at) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',null),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',null),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003',null),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004',now());
insert into public.accounts(id,relationship_id,owner_id,name,scope) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Conta A','individual'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','Conta B','individual');
insert into public.financial_entries(relationship_id,owner_id,scope,kind,amount_cents,destination_account_id,description,occurred_on,idempotency_key) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','individual','income',100,'30000000-0000-0000-0000-000000000001','Teste A',current_date,gen_random_uuid()),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','individual','income',100,'30000000-0000-0000-0000-000000000002','Teste B',current_date,gen_random_uuid());
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
 if (select count(*) from public.financial_entries) <> 1 then raise exception 'RLS: parceiro deve ler apenas seu tenant'; end if;
 if (select count(*) from public.profiles) <> 2 then raise exception 'RLS: vazamento de perfis'; end if;
 if (select count(*) from public.audit_events) <> 1 then raise exception 'RLS: vazamento de auditoria'; end if;
 if exists(select 1 from public.accounts where relationship_id='20000000-0000-0000-0000-000000000002') then raise exception 'RLS: vazamento de conta'; end if;
 begin
  insert into public.relationship_members(relationship_id,user_id) values('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002');
  raise exception 'Cliente conseguiu forjar vínculo';
 exception when insufficient_privilege then null; end;
 begin
  update public.financial_entries set amount_cents=999;
  raise exception 'Escrita real liberada antes das RPCs';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.audit_events;
  raise exception 'Cliente apagou auditoria';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
do $$ begin
 if exists(select 1 from public.financial_entries) then raise exception 'Revogado tem acesso financeiro'; end if;
 if exists(select 1 from public.relationships) then raise exception 'Revogado vê relacionamento'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.financial_entries;
  raise exception 'Anônimo tem acesso financeiro';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
