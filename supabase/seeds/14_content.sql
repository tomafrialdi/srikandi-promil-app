-- Content library: 164 items (10 hand-written + 154 generated) so the counts match the design.

select setseed(0.14);

insert into public.content_items
  (type, title, slug, context, category, status, reviewer_name, languages, tags, views_30d, ctr_pct, avg_read_seconds,
   scheduled_at, published_at, review_started_at, created_at, updated_at)
values
  ('article', 'Understanding your fertile window: the 6 days that matter most', '/blog/fertile-window-6-days', null, 'Fertility', 'published', 'dr. Sarah L.', '{en,id}', '{ovulation,fertile window}', 48200, null, 258, null, now() - interval '20 days', null, now() - interval '40 days', now() - interval '1 day'),
  ('article', 'How to survive the two-week wait', '/blog/two-week-wait', null, 'Emotional', 'scheduled', 'dr. Sarah L.', '{en,id}', '{2ww,wellbeing}', 0, null, null, date_trunc('week', now() + interval '7 days'), null, now() - interval '5 days', now() - interval '12 days', now() - interval '2 days'),
  ('daily_tip', 'Log BBT before you get out of bed', null, 'follicular', 'Tracking', 'published', 'dr. Andi W.', '{en,id}', '{bbt,tracking}', 91000, null, null, null, now() - interval '25 days', null, now() - interval '50 days', now() - interval '3 days'),
  ('article', 'PCOS and ovulation: LH tests', '/blog/pcos-lh-tests', null, 'PCOS', 'medical_review', 'dr. Andi W.', '{en}', '{pcos,lh}', 0, null, null, null, null, now() - interval '31 hours', now() - interval '9 days', now() - interval '4 days'),
  ('in_app_card', 'LH scanner is here 📸', null, 'home below cycle', 'Product', 'published', null, '{en,id}', '{lh,product}', 6200, 12.4, null, null, now() - interval '30 days', null, now() - interval '45 days', now() - interval '5 days'),
  ('video', 'What happens during IUI? (4:32)', null, 'treatment', 'Treatment', 'changes_requested', 'dr. Sarah L.', '{id}', '{iui,treatment}', 0, null, null, null, null, now() - interval '45 hours', now() - interval '20 days', now() - interval '6 days'),
  ('article', 'Male fertility: 5 habits', '/blog/male-fertility', null, 'Partner', 'published', 'dr. Bima S.', '{en,id}', '{partner,male fertility}', 12100, null, 190, null, now() - interval '60 days', null, now() - interval '80 days', now() - interval '7 days'),
  ('in_app_card', 'Ramadan & TTC: fasting tips', null, '2WW screen', 'Nutrition', 'draft', null, '{id}', '{ramadan,nutrition}', 0, null, null, null, null, null, now() - interval '15 days', now() - interval '8 days'),
  ('article', 'Myths about “kapan hamil?”', '/blog/kapan-hamil', null, 'Emotional', 'archived', 'dr. Sarah L.', '{id}', '{myths}', 0, null, null, null, now() - interval '250 days', null, now() - interval '300 days', now() - interval '9 days'),
  ('article', 'Myo-inositol: what the evidence says', '/blog/myo-inositol', null, 'PCOS', 'medical_review', 'dr. Andi W.', '{en}', '{pcos,supplements}', 0, null, null, null, null, now() - interval '52 hours', now() - interval '11 days', now() - interval '10 days');

do $$
declare
  topics text[] := array['ovulation', 'cervical mucus', 'progesterone', 'sleep and fertility', 'stress and cycles', 'folic acid', 'irregular cycles', 'egg quality', 'sperm health', 'IVF prep', 'implantation', 'early pregnancy signs'];
  quals text[] := array['explained', 'what to know', 'common questions', 'a practical guide', 'myths vs facts', 'for beginners', 'what doctors say', 'a checklist'];
  cats text[] := array['Fertility', 'Emotional', 'Tracking', 'PCOS', 'Treatment', 'Partner', 'Nutrition'];
  revs text[] := array['dr. Sarah L.', 'dr. Andi W.', 'dr. Bima S.'];
  phases text[] := array['follicular', 'ovulation', 'luteal', 'period', '2WW'];
  places text[] := array['home top', 'home below cycle', 'insights feed', '2WW screen'];
  g integer;
  t public.content_type;
  st public.content_status;
  title text;
  h integer;
  p integer := 0;
begin
  for g in 1..154 loop
    h := abs(hashtext('content' || g));
    t := case when g % 11 in (0, 5) then 'daily_tip'::public.content_type
              when g % 11 in (3, 8) then 'in_app_card'
              when g % 11 = 10 then 'video'
              else 'article' end;
    st := case
      when g <= 11 then 'draft'
      when g <= 13 then 'medical_review'
      when g <= 19 then 'scheduled'
      when g <= 30 then 'archived'
      else 'published' end;
    if st = 'published' then p := p + 1; end if;

    title := case t
      when 'daily_tip' then initcap(topics[1 + g % 12]) || ' tip: ' || quals[1 + (g / 3) % 8]
      when 'in_app_card' then initcap(topics[1 + g % 12]) || ' — ' || quals[1 + (g / 2) % 8]
      when 'video' then initcap(topics[1 + g % 12]) || ' ' || quals[1 + (g / 5) % 8] || ' (' || (2 + h % 6) || ':' || lpad((h % 60)::text, 2, '0') || ')'
      else initcap(topics[1 + g % 12]) || ': ' || quals[1 + (g / 12) % 8]
    end;

    insert into public.content_items
      (type, title, slug, context, category, status, reviewer_name, languages, tags, views_30d, ctr_pct, avg_read_seconds,
       scheduled_at, published_at, review_started_at, created_at, updated_at)
    values (
      t, title,
      case when t = 'article' then '/blog/' || trim(both '-' from lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || g end,
      case t when 'daily_tip' then phases[1 + g % 5] when 'in_app_card' then places[1 + g % 4] when 'video' then lower(cats[1 + g % 7]) end,
      cats[1 + g % 7],
      st,
      case when t = 'in_app_card' then null else revs[1 + g % 3] end,
      case when h % 5 = 0 then array['en'] when h % 5 = 1 then array['id'] else array['en', 'id'] end,
      array[topics[1 + g % 12]],
      case when st = 'published' then 500 + h % 3000 else 0 end,
      case when t = 'in_app_card' and st = 'published' then round((3 + (h % 120) / 10.0)::numeric, 1) end,
      case when t = 'article' and st = 'published' then 120 + h % 240 end,
      case when st = 'scheduled' then date_trunc('day', now() + make_interval(days => g - 12)) + interval '0 hours' end,
      case when st in ('published', 'archived') then now() - make_interval(days => case when st = 'published' then (p * 32) / 10 else 120 + g * 5 end) end,
      case when st = 'medical_review' then now() - make_interval(hours => 6 + (g - 11) * 9) end,
      now() - make_interval(days => 60 + g),
      now() - make_interval(days => case when st = 'draft' and g <= 4 then 32 + g * 3
                                         when st = 'draft' then 2 + g
                                         when st = 'published' then (p * 32) / 10
                                         else 10 + (g * 23) / 10 end)
    );
  end loop;
end;
$$;
