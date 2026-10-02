-- Videos without a placement used to appear nowhere. They now default to the Articles & videos feed.

create or replace function public.app_videos(p_placement text, p_today date)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := analytics_private.current_app_user();
  aud jsonb;
  v_label text;
begin
  v_label := case p_placement
    when 'feed' then 'Articles & videos feed'
    when 'treatment' then 'Treatment program screen'
    when 'two_week_wait' then 'Two-week wait'
  end;
  if v_label is null then
    raise exception 'unknown placement' using errcode = '22023';
  end if;

  perform analytics_private.publish_due_content();
  aud := analytics_private.content_audience(v_user, p_today);

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'title', v.title, 'description', coalesce(v.dek, ''),
      'thumbnailUrl', nullif(v.image_url, ''), 'videoUrl', v.video_url,
      'durationSeconds', v.duration_seconds, 'presenter', nullif(v.details ->> 'presenter', '')
    ) order by v.published_at desc nulls last)
    from (
      select * from public.content_items v
      where v.type = 'video' and analytics_private.content_matches(v, aud)
        and nullif(trim(coalesce(v.video_url, '')), '') is not null
        -- No placement chosen in the console means the Articles & videos feed (never "nowhere").
        and (coalesce(v.details -> 'placement', '[]'::jsonb) ? v_label
             or (p_placement = 'feed' and jsonb_array_length(coalesce(v.details -> 'placement', '[]'::jsonb)) = 0))
      order by v.published_at desc nulls last limit 10
    ) v
  ), '[]'::jsonb);
end;
$$;
