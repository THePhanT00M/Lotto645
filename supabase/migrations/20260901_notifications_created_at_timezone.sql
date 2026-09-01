-- 알림 생성 시각 타임존 보정
--
-- notifications.created_at (timestamptz) 의 기본값이 UTC 벽시계 값을 타임존 없이
-- 만들어 넣는 형태라(timezone('utc', now()) 계열), DB 타임존(Asia/Seoul)으로
-- 라벨이 붙으면서 실제보다 9시간 과거로 저장되고 있었다.
-- 그래서 방금 보낸 알림이 목록에서 '9시간 전'으로 보였다.
-- 같은 시점에 만든 number_picks.created_at 은 default now() 라 정상이다.

begin;

-- 이미 쌓인 행은 UTC 벽시계가 KST 로 잘못 해석된 값이므로 실제 시각으로 되돌린다.
-- 한국은 서머타임이 없어 오프셋이 항상 9시간이다.
update public.notifications
set created_at = created_at + interval '9 hours';

-- 앞으로는 타임존을 그대로 담는 now() 를 쓴다.
alter table public.notifications
    alter column created_at set default now();

commit;
