-- 번호 기록 구조 재정비
--
-- 이전에는 두 표에 나뉘어 있었다.
--   generated_numbers   : 모든 생성 기록. 삭제 여부를 'Y'/'N' 문자로 두었다.
--   ai_recommendations  : AI 추천의 근거. 번호를 다시 저장했고 채점도 따로 했다.
--
-- 같은 번호가 두 곳에 들어가고, 채점은 AI 추천에만 있어 일반 추첨은 결과를 알 수 없었다.
-- 기록은 한 곳에 두고, AI 추천에만 있는 값은 딸린 표로 분리한다.

drop table if exists public.ai_recommendations;
drop table if exists public.pick_insights;
drop table if exists public.number_picks;
drop table if exists public.generated_numbers;

-- 생성된 번호 한 건. 추첨기·수동·AI 모두 여기에 남는다.
create table public.number_picks (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),

  user_id       uuid references auth.users (id) on delete set null,

  -- 이 번호가 겨냥한 회차
  draw_no       integer not null,
  numbers       integer[] not null,

  -- 오름차순으로 이어 붙인 조합 키 ('8-13-22-24-40-42').
  -- 같은 조합을 이미 내보냈는지 확인할 때 쓴다.
  combination_key text not null,

  -- machine: 추첨기, manual: 직접 선택, ai: 추천
  source        text not null check (source in ('machine', 'manual', 'ai')),
  memo          text,

  -- 접속 환경. 문자열로 담던 것을 구조를 살려 저장한다.
  client_ip     text,
  client_agent  jsonb,

  -- 회차 발표 뒤 채우는 채점 결과. 이제 모든 기록에 남는다.
  matched_count integer,
  bonus_matched boolean,
  prize_rank    integer,
  scored_at     timestamptz,

  -- 소프트 삭제. 값이 있으면 목록에서 감추되 집계에는 그대로 쓴다.
  deleted_at    timestamptz,

  constraint number_picks_numbers_len check (array_length(numbers, 1) = 6)
);

comment on table public.number_picks is '사용자가 생성한 번호 기록';
comment on column public.number_picks.combination_key is '오름차순 조합 키. 중복 추천 회피에 쓴다';
comment on column public.number_picks.deleted_at is '값이 있으면 목록에서 감춘다. 행은 지우지 않는다';
comment on column public.number_picks.prize_rank is '1~5등, 미당첨이면 null';

create index number_picks_draw_no_idx on public.number_picks (draw_no);
create index number_picks_created_at_idx on public.number_picks (created_at desc);
create index number_picks_source_idx on public.number_picks (source);
create index number_picks_combo_idx on public.number_picks (draw_no, combination_key);

-- 목록은 언제나 '내 것 중 안 지운 것'을 최신순으로 본다.
create index number_picks_user_active_idx
  on public.number_picks (user_id, created_at desc)
  where deleted_at is null;

-- 아직 채점하지 않은 기록만 빠르게 찾는다.
create index number_picks_unscored_idx on public.number_picks (draw_no) where scored_at is null;

-- AI 추천에만 있는 근거. 기록 한 건에 최대 하나 붙는다.
create table public.pick_insights (
  pick_id       bigint primary key references public.number_picks (id) on delete cascade,

  -- 추천 당시의 점수
  score         double precision not null,
  network_score double precision not null,
  typicality    double precision not null,

  -- 용지 위 모양에서 뽑은 특징 21가지
  features      jsonb not null,

  -- 학습에 쓴 모델 정보 (앙상블 수, 검증 정확도, 보정 전후 Brier 등)
  model         jsonb not null,

  -- 알고리즘이 바뀌면 값을 올려, 버전별 성적을 나눠 볼 수 있게 한다.
  model_version text not null default 'geo-mlp-1',

  -- 과거 당첨 회차와 겹친 최대 개수
  max_past_overlap integer
);

comment on table public.pick_insights is 'AI 추천의 근거가 된 기하 특징과 모델 정보';
comment on column public.pick_insights.features is '로또 용지 위 여섯 점의 모양 특징 21가지';

create index pick_insights_model_version_idx on public.pick_insights (model_version);

alter table public.number_picks enable row level security;
alter table public.pick_insights enable row level security;

-- 저장과 조회는 서버 라우트가 서비스 롤로 수행한다.
-- 브라우저에서 직접 읽고 쓸 일이 없으므로 정책은 따로 열지 않는다.
