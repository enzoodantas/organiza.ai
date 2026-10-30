-- Local synthetic fixtures; no personal data changed.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values
 ('71000000-0000-0000-0000-000000000001'),
 ('71000000-0000-0000-0000-000000000002'),
 ('71000000-0000-0000-0000-000000000003');
insert into public.profiles(id,display_name,mascot) values
 ('71000000-0000-0000-0000-000000000001','Wardrobe A','cat'),
 ('71000000-0000-0000-0000-000000000002','Wardrobe Peer','dog'),
 ('71000000-0000-0000-0000-000000000003','Wardrobe Stranger','cat');
insert into public.relationships(id,name) values ('72000000-0000-0000-0000-000000000001','Wardrobe test');
insert into public.relationship_members(relationship_id,user_id) values
 ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001'),
 ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin
    perform public.complete_mascot_review();
    raise exception 'Review accepted without planning';
  exception when check_violation then null; end;
end $$;
insert into public.monthly_plan_items(relationship_id,owner_id,kind,label,amount_cents) values
 ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','expense','Synthetic estimate',100);
do $$ begin
  if not public.complete_mascot_review() then raise exception 'Missing reward'; end if;
  if public.complete_mascot_review() then raise exception 'Duplicate reward'; end if;
  if (select coins <> 5 or xp <> 20 from public.mascot_wallets where user_id = auth.uid()) then raise exception 'Wrong reward'; end if;
  begin
    perform public.buy_mascot_item('overalls');
    raise exception 'Overspending allowed';
  exception when check_violation then null; end;
  begin
    perform public.equip_mascot_item('sun_hat',true);
    raise exception 'Unowned equipment allowed';
  exception when insufficient_privilege then null; end;
  if not public.buy_mascot_item('sweater_sage') then raise exception 'Purchase failed'; end if;
  if public.buy_mascot_item('sweater_sage') then raise exception 'Duplicate purchase'; end if;
  if (select coins <> 0 from public.mascot_wallets where user_id = auth.uid()) then raise exception 'Wrong debit'; end if;
  perform public.equip_mascot_item('sweater_sage',true);
  perform public.select_mascot('dog');
  if not exists(select 1 from public.mascot_inventory where user_id=auth.uid() and item_id='sweater_sage' and equipped) then raise exception 'Species lost equipment'; end if;
  begin
    update public.mascot_wallets set coins = 1000;
    raise exception 'Direct writes allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Give the synthetic user extra coins to exercise equipment replacement.
update public.mascot_wallets set coins=15 where user_id='71000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$ begin
  perform public.buy_mascot_item('sweater_rose');
  perform public.buy_mascot_item('sun_hat');
  perform public.equip_mascot_item('sun_hat',true);
  perform public.equip_mascot_item('sweater_rose',true);
  if (select count(*) from public.mascot_inventory where user_id=auth.uid() and equipped) <> 2 then raise exception 'Expected one hat and one outfit'; end if;
  if exists(select 1 from public.mascot_inventory where item_id='sweater_sage' and equipped) then raise exception 'Two outfits equipped'; end if;
  perform public.equip_mascot_item('sweater_rose',false);
end $$;
select set_config('request.jwt.claim.sub','71000000-0000-0000-0000-000000000002',true);
do $$ begin
  if (select count(*) from public.mascot_inventory) <> 3 then raise exception 'Peer cannot see wardrobe'; end if;
  if exists(select 1 from public.mascot_reviews) then raise exception 'Peer sees private reviews'; end if;
  begin
    perform public.equip_mascot_item('sun_hat',true);
    raise exception 'Peer can equip others items';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','71000000-0000-0000-0000-000000000003',true);
do $$ begin
  if exists(select 1 from public.mascot_inventory) or exists(select 1 from public.mascot_wallets) then raise exception 'Unrelated user read'; end if;
  begin
    perform public.complete_mascot_review();
    raise exception 'Unlinked user rewarded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.relationship_members set revoked_at=now() where user_id='71000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin
    perform public.buy_mascot_item('party_hat');
    raise exception 'Revoked member purchased';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.complete_mascot_review();
    raise exception 'Anonymous reward';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
