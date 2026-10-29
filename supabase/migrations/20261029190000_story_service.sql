-- Private service storage. Sites verifies the signed-in user and every owner filter.
-- Browser roles have no access; the secret key remains in the server runtime.
create table if not exists public.athlete_stories (
 owner_id text not null,
 id uuid not null,
 document jsonb not null,
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 primary key (owner_id,id)
);
create table if not exists public.athlete_ai_usage (
 owner_id text not null,
 day date not null default current_date,
 calls integer not null default 0,
 primary key(owner_id,day)
);
alter table public.athlete_stories enable row level security;
alter table public.athlete_ai_usage enable row level security;
revoke all on public.athlete_stories, public.athlete_ai_usage from anon, authenticated;
grant select, insert, update on public.athlete_stories, public.athlete_ai_usage to service_role;
create or replace function public.save_athlete_story(p_owner text,p_id uuid,p_document jsonb,p_version integer)
returns integer language plpgsql security invoker set search_path = public as $$
declare next_version integer;
begin
 if p_version = 0 then
  insert into athlete_stories(owner_id,id,document) values(p_owner,p_id,p_document)
   on conflict do nothing returning version into next_version;
 else
  update athlete_stories set document=p_document,version=version+1,updated_at=now()
   where owner_id=p_owner and id=p_id and version=p_version returning version into next_version;
 end if;
 if next_version is null then raise exception 'Story changed in another tab. Reload before saving.' using errcode='40001'; end if;
 return next_version;
end $$;
create or replace function public.reserve_athlete_ai_call(p_owner text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare count_now integer;
begin
 insert into athlete_ai_usage(owner_id,day,calls) values(p_owner,current_date,1)
 on conflict(owner_id,day) do update set calls=athlete_ai_usage.calls+1
 where athlete_ai_usage.calls < 40 returning calls into count_now;
 return count_now is not null;
end $$;
revoke all on function public.save_athlete_story(text,uuid,jsonb,integer) from public,anon,authenticated;
revoke all on function public.reserve_athlete_ai_call(text) from public,anon,authenticated;
grant execute on function public.save_athlete_story(text,uuid,jsonb,integer),public.reserve_athlete_ai_call(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('athlete-photos','athlete-photos',false,8388608,array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict(id) do nothing;
notify pgrst, 'reload schema';
