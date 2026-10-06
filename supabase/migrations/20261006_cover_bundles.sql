-- 3개 보장 묶음 기록
--
-- 어떤 당첨 번호에도 한 장은 3개 이상 맞는 181장 묶음을 묶음 단위로 남긴다.
-- 181장을 number_picks 에 풀면 내 기록과 AI 추천 성적이 묶음으로 뒤덮이므로 따로 둔다.
-- 정책을 두지 않아 서버(서비스 롤)만 읽고 쓴다. 여러 번 실행해도 같은 결과가 된다.

create table if not exists public.cover_bundles (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),

  user_id         uuid references auth.users (id) on delete set null,

  -- 이 묶음이 겨냥한 회차
  draw_no         integer not null,

  -- 자리(0~44)마다 붙인 번호. 서버가 이 배치로 181장을 다시 만든다.
  labels          integer[] not null,
  -- 배치로 만든 181장. 구조를 바꿔도 지난 기록을 그대로 채점하도록 함께 둔다.
  tickets         jsonb not null,

  -- 장마다 예측 인기 백분위의 평균, 비인기 구간에 든 장 수. 당첨자 수가 없었으면 비어 있다.
  mean_percentile double precision,
  quiet_tickets   integer,
  model_version   text not null,

  client_ip       text,

  -- 회차 발표 뒤 채우는 채점 결과
  best_matched    integer,
  -- 적중 0~6개인 장 수 (길이 7)
  match_counts    integer[],
  -- 1~5등인 장 수 (길이 5)
  rank_counts     integer[],
  scored_at       timestamptz,

  constraint cover_bundles_labels_len check (array_length(labels, 1) = 45)
);

comment on table public.cover_bundles is '3개 보장 묶음 181장 기록';
comment on column public.cover_bundles.labels is '자리 0~44 에 붙인 번호';
comment on column public.cover_bundles.match_counts is '적중 0~6개인 장 수';
comment on column public.cover_bundles.rank_counts is '1~5등인 장 수';

create index if not exists cover_bundles_draw_no_idx on public.cover_bundles (draw_no);
create index if not exists cover_bundles_unscored_idx on public.cover_bundles (draw_no) where scored_at is null;

alter table public.cover_bundles enable row level security;
