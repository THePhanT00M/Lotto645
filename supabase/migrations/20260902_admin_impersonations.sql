-- 관리자가 회원 계정으로 들어간 기록
--
-- 남의 계정으로 화면을 보는 일이라 누가·누구로·언제 들어갔고 언제 돌아왔는지
-- 남긴다. 기록이 없으면 문제가 생겼을 때 관리자가 한 일인지 본인이 한 일인지
-- 가릴 수 없다.
--
-- 정책을 두지 않아 서비스 롤(서버)만 읽고 쓴다. 브라우저에서는 보이지 않는다.

create table if not exists public.admin_impersonations (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),

  admin_id   uuid not null references auth.users (id) on delete cascade,
  target_id  uuid not null references auth.users (id) on delete cascade,

  -- 돌아온 시각. 비어 있으면 아직 그 계정으로 보고 있다는 뜻이다.
  ended_at   timestamptz
);

create index if not exists admin_impersonations_created_at_idx
  on public.admin_impersonations (created_at desc);

alter table public.admin_impersonations enable row level security;
