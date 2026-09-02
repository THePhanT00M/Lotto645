-- 문의하기
--
-- 로그인하지 않은 사람도 남길 수 있어야 하므로 user_id 는 비어 있을 수 있다.
-- 답변은 남겨 준 이메일로 보내므로 이메일은 반드시 받는다.
--
-- 정책을 두지 않아 서비스 롤(서버)만 읽고 쓴다. 남의 문의가 브라우저에서
-- 보이면 안 되고, 넣는 것도 서버가 대신 한다.

create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- 로그인한 채로 남겼다면 누구인지 함께 둔다. 탈퇴해도 문의는 남긴다.
  user_id     uuid references auth.users (id) on delete set null,

  email       text not null,
  subject     text not null,
  message     text not null,

  -- 답변을 마친 시각. 비어 있으면 아직 처리하지 않은 문의다.
  answered_at timestamptz
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
