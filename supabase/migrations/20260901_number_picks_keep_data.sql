-- 기존 기록을 새 구조로 옮기며 재정비
--
-- 20260901_number_picks.sql은 예전 표를 지우고 새로 만든다.
-- 쌓인 기록을 남기고 싶다면 그 파일 대신 이 파일을 실행한다.
--
-- 옮기는 규칙
--   is_deleted 'Y'  →  deleted_at (기록된 시각이 없으면 현재 시각)
--   device_info     →  client_agent (JSON으로 파싱되면 그대로, 아니면 원문 보관)
--   ai_recommendations의 점수·특징·모델 → pick_insights
--     번호와 회차가 같은 기록에 붙인다. 짝을 찾지 못하면 건너뛴다.

begin;

create table if not exists public.number_picks (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  user_id       uuid references auth.users (id) on delete set null,
  draw_no       integer not null,
  numbers       integer[] not null,
  combination_key text not null,
  source        text not null check (source in ('machine', 'manual', 'ai')),
  memo          text,
  client_ip     text,
  client_agent  jsonb,
  matched_count integer,
  bonus_matched boolean,
  prize_rank    integer,
  scored_at     timestamptz,
  deleted_at    timestamptz,
  constraint number_picks_numbers_len check (array_length(numbers, 1) = 6)
);

create table if not exists public.pick_insights (
  pick_id       bigint primary key references public.number_picks (id) on delete cascade,
  score         double precision not null,
  network_score double precision not null,
  typicality    double precision not null,
  features      jsonb not null,
  model         jsonb not null,
  model_version text not null default 'geo-mlp-1',
  max_past_overlap integer
);

-- 1) 생성 기록을 옮긴다. 번호가 여섯 개가 아닌 행은 새 제약에 걸리므로 제외한다.
insert into public.number_picks (
  created_at, user_id, draw_no, numbers, combination_key, source, memo,
  client_ip, client_agent, deleted_at
)
select
  g.created_at,
  g.user_id,
  coalesce(g.draw_no, 0),
  g.numbers,
  array_to_string(array(select unnest(g.numbers) order by 1), '-'),
  case when g.source in ('machine', 'manual', 'ai') then g.source else 'manual' end,
  g.memo,
  g.ip_address,
  case
    when g.device_info is null then null
    when jsonb_typeof(to_jsonb(g.device_info)) = 'object' then to_jsonb(g.device_info)
    else jsonb_build_object('raw', g.device_info)
  end,
  case when g.is_deleted = 'Y' then coalesce(g.deleted_at, now()) else null end
from public.generated_numbers g
where array_length(g.numbers, 1) = 6;

-- 2) AI 추천의 근거를 같은 번호·회차의 기록에 붙인다.
insert into public.pick_insights (
  pick_id, score, network_score, typicality, features, model, model_version, max_past_overlap
)
select distinct on (p.id)
  p.id, a.score, a.network_score, a.typicality, a.features, a.model,
  coalesce(a.model_version, 'geo-mlp-1'), a.max_past_overlap
from public.ai_recommendations a
join public.number_picks p
  on p.draw_no = a.draw_no
 and p.combination_key = array_to_string(array(select unnest(a.numbers) order by 1), '-')
 and p.source = 'ai'
order by p.id, a.created_at;

-- 3) 채점 결과도 함께 옮긴다.
update public.number_picks p
set matched_count = a.matched_count,
    bonus_matched = a.bonus_matched,
    prize_rank    = a.prize_rank,
    scored_at     = a.scored_at
from public.ai_recommendations a
where a.scored_at is not null
  and p.draw_no = a.draw_no
  and p.source = 'ai'
  and p.combination_key = array_to_string(array(select unnest(a.numbers) order by 1), '-');

drop table public.ai_recommendations;
drop table public.generated_numbers;

create index number_picks_draw_no_idx on public.number_picks (draw_no);
create index number_picks_created_at_idx on public.number_picks (created_at desc);
create index number_picks_source_idx on public.number_picks (source);
create index number_picks_combo_idx on public.number_picks (draw_no, combination_key);
create index number_picks_user_active_idx
  on public.number_picks (user_id, created_at desc) where deleted_at is null;
create index number_picks_unscored_idx on public.number_picks (draw_no) where scored_at is null;
create index pick_insights_model_version_idx on public.pick_insights (model_version);

alter table public.number_picks enable row level security;
alter table public.pick_insights enable row level security;

commit;
