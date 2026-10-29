-- Use an application conflict status rather than a retryable serialization failure.
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
 if next_version is null then raise exception 'Story changed in another tab. Reload before saving.' using errcode='PT409'; end if;
 return next_version;
end $$;
notify pgrst, 'reload schema';
