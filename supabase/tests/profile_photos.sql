-- Local only; synthetic users and rollback.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values
 ('81000000-0000-0000-0000-000000000001'),
 ('81000000-0000-0000-0000-000000000002'),
 ('81000000-0000-0000-0000-000000000003');
insert into public.profiles(id,display_name,mascot) values
 ('81000000-0000-0000-0000-000000000001','Photo A','cat'),
 ('81000000-0000-0000-0000-000000000002','Photo Peer','dog'),
 ('81000000-0000-0000-0000-000000000003','Photo Stranger','cat');
insert into public.relationships(id,name) values('82000000-0000-0000-0000-000000000001','Photo test');
insert into public.relationship_members(relationship_id,user_id) values
 ('82000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001'),
 ('82000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
do $$ declare photo text := 'data:image/jpeg;base64,' || encode(decode('ffd8ffe0ffd9','hex'),'base64'); begin
  perform public.set_profile_photo(photo);
  perform public.set_profile_photo(photo);
  if (select count(*) from public.profile_photos) <> 1 then raise exception 'Replacement accumulates photos'; end if;
  begin
    perform public.set_profile_photo('data:image/svg+xml;base64,PHN2Zy8+');
    raise exception 'SVG accepted';
  exception when check_violation then null; end;
  begin
    perform public.set_profile_photo('data:image/jpeg;base64,PGh0bWw+');
    raise exception 'Spoofed JPEG accepted';
  exception when check_violation then null; end;
  begin
    perform public.set_profile_photo('data:image/jpeg;base64,' || repeat('A',44000));
    raise exception 'Oversize accepted';
  exception when check_violation then null; end;
  begin
    update public.profile_photos set image_data = photo;
    raise exception 'Direct write accepted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
do $$ begin
  if (select count(*) from public.profile_photos) <> 1 then raise exception 'Peer cannot see photo'; end if;
  perform public.set_profile_photo(null);
  if (select count(*) from public.profile_photos) <> 1 then raise exception 'Peer removed owner photo'; end if;
end $$;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000003',true);
do $$ begin
  if exists(select 1 from public.profile_photos) then raise exception 'Unrelated user sees photo'; end if;
end $$;
reset role;
update public.relationship_members set revoked_at=now() where user_id='81000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
do $$ begin
  if exists(select 1 from public.profile_photos) then raise exception 'Revoked peer sees photo'; end if;
end $$;
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
do $$ begin
  perform public.set_profile_photo(null);
  if exists(select 1 from public.profile_photos) then raise exception 'Removal failed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.set_profile_photo(null);
    raise exception 'Anonymous write accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.profile_photos;
    raise exception 'Anonymous read accepted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
