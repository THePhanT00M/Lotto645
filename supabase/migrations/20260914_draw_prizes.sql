-- 회차별 등수 당첨자 수와 판매액, 그리고 AI 추천 근거의 인기 예측
--
-- draw_prizes
--   동행복권이 회차마다 발표하는 등수별 당첨자 수·1인당 당첨금·판매액.
--   당첨자가 무작위 구매 기대보다 많으면 그 조합을 사람들이 많이 샀다는 뜻이라,
--   AI 추천이 사람들이 몰리는 조합을 피하도록 학습하는 데 쓴다.
--   공개 정보라 누구나 읽을 수 있고, 쓰기는 서버(서비스 롤)만 한다.
--
-- pick_insights
--   인기 예측(popularity)과 무작위 조합 대비 백분위(popularity_percentile)를 담는다.
--   network_score·typicality 는 이제 채우지 않으므로 비워 둘 수 있게 한다.
--   score 도 당첨자 수를 못 불러온 추천에서는 비어 있다.
--
-- 모든 문장이 여러 번 실행해도 같은 결과가 되도록 짰다.

create table if not exists public.draw_prizes (
  draw_no     integer primary key,
  -- 회차 전체 판매액(원). 87회까지는 한 게임 2,000원, 88회부터 1,000원이다.
  total_sales bigint  not null,
  winners_1   integer not null,
  winners_2   integer not null,
  winners_3   integer not null,
  winners_4   integer not null,
  winners_5   integer not null,
  -- 1인당 당첨금(원)
  amount_1    bigint  not null,
  amount_2    bigint  not null,
  amount_3    bigint  not null,
  amount_4    bigint  not null,
  amount_5    bigint  not null
);

comment on table public.draw_prizes is '회차별 등수 당첨자 수와 판매액 (동행복권 발표값)';
comment on column public.draw_prizes.total_sales is '회차 전체 판매액(원)';

alter table public.draw_prizes enable row level security;

drop policy if exists draw_prizes_public_read on public.draw_prizes;
create policy draw_prizes_public_read on public.draw_prizes for select using (true);

alter table public.pick_insights add column if not exists popularity double precision;
alter table public.pick_insights add column if not exists popularity_percentile double precision;

comment on column public.pick_insights.popularity is '예측 인기 (로그 비율, 무작위 조합 평균 0)';
comment on column public.pick_insights.popularity_percentile is '무작위 조합 가운데 이 조합보다 덜 몰리는 비율 (0~1)';

alter table public.pick_insights alter column score drop not null;
alter table public.pick_insights alter column network_score drop not null;
alter table public.pick_insights alter column typicality drop not null;
