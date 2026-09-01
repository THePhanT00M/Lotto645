-- 알림 실시간 반영
--
-- notifications 테이블이 Realtime 발행 목록(supabase_realtime)에 없으면
-- 구독은 정상으로 보이면서 이벤트만 오지 않는다. 헤더 배지가 새로고침해야
-- 바뀌던 원인이라 발행 목록에 넣고, 본인 알림을 읽을 수 있는 정책을 보장한다.

-- 1. 발행 목록에 추가한다. 이미 들어 있으면 그냥 넘어간다.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

-- 2. Realtime 은 RLS 를 그대로 따르므로, 본인 알림을 읽을 수 있어야 이벤트가 전달된다.
--    쓰기는 서버(service role)에서만 하므로 select 만 연다.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy notifications_select_own
      on public.notifications
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

-- 참고: delete 이벤트는 기본 replica identity 에서 기본키만 담기므로
-- user_id 필터에 걸리지 않는다. 삭제까지 밀어주려면 아래를 켜면 되지만
-- WAL 이 커지므로 기본으로는 두지 않는다. 삭제는 누른 본인 화면에서 이미 반영된다.
-- alter table public.notifications replica identity full;
