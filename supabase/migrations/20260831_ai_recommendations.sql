-- AI 추천 기록
--
-- 추천할 때마다 번호와 함께 그 근거가 된 기하 특징과 모델 정보를 남긴다.
-- 회차가 발표되면 채점 결과를 채워, 나중에 이 표만으로 다시 학습하거나
-- 모델 버전별 성적을 견줄 수 있게 한다.
--
-- 이 표는 기록에 그치지 않고 다음 추천에 바로 쓰인다.
--   - 같은 회차에 이미 내보낸 조합은 다시 추천하지 않는다.
--   - 이미 많이 나간 번호는 점수를 조금 깎아, 당첨되었을 때 나눠 갖는 인원을 줄인다.

drop table if exists public.ai_recommendations;

create table public.ai_recommendations (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),

  -- 이 추천이 겨냥한 회차
  draw_no       integer not null,
  numbers       integer[] not null,

  -- 오름차순으로 이어 붙인 조합 키 ('8-13-22-24-40-42').
  -- 같은 조합을 다시 내보내지 않도록 조회할 때 쓴다.
  combination_key text not null,

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
  max_past_overlap integer,

  user_id       uuid references auth.users (id) on delete set null,

  -- 회차 발표 뒤 채우는 채점 결과
  matched_count integer,
  bonus_matched boolean,
  prize_rank    integer,
  scored_at     timestamptz,

  constraint ai_recommendations_numbers_len check (array_length(numbers, 1) = 6)
);

create index ai_recommendations_draw_no_idx on public.ai_recommendations (draw_no);
create index ai_recommendations_created_at_idx on public.ai_recommendations (created_at desc);
create index ai_recommendations_model_version_idx on public.ai_recommendations (model_version);

-- 같은 조합을 이미 내보냈는지 회차 단위로 확인한다.
create index ai_recommendations_combo_idx on public.ai_recommendations (draw_no, combination_key);

-- 아직 채점하지 않은 기록만 빠르게 찾는다.
create index ai_recommendations_unscored_idx on public.ai_recommendations (draw_no) where scored_at is null;

alter table public.ai_recommendations enable row level security;

-- 저장과 조회는 서버 라우트에서 서비스 롤로 수행한다.
-- 브라우저에서 직접 읽고 쓸 일이 없으므로 정책은 따로 열지 않는다.

comment on table public.ai_recommendations is 'AI 추천 번호와 그 근거가 된 기하 특징 기록';
comment on column public.ai_recommendations.combination_key is '오름차순 조합 키. 중복 추천 회피에 쓴다';
comment on column public.ai_recommendations.features is '로또 용지 위 여섯 점의 모양 특징 21가지';
comment on column public.ai_recommendations.model is '추천 당시 모델 메타데이터';
comment on column public.ai_recommendations.model_version is '추천 알고리즘 버전';
comment on column public.ai_recommendations.prize_rank is '1~5등, 미당첨이면 null';
