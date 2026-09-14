-- 회원 계정으로 들어가지 못한 시도 표시
--
-- 들어가기 직전에 기록부터 남기므로, 그 뒤 단계(쪽지 감싸기, 세션 바꾸기)에서 막히면
-- 들어간 것처럼 행이 남는다. 막힌 시도는 failed_at 을 채워 구분한다.
-- ended_at 도 같은 시각으로 닫아, "비어 있으면 아직 보고 있다"는 뜻이 흐려지지 않게 한다.
--
-- 여러 번 실행해도 같은 결과가 된다.

alter table public.admin_impersonations add column if not exists failed_at timestamptz;

comment on column public.admin_impersonations.failed_at is '들어가지 못한 시각. 값이 있으면 세션이 바뀌지 않았다';
