-- 회원이 고른 화면 언어
--
-- 기본은 한국어다. 로또 자체가 한국 로또라 한국어를 먼저 두고, 다른 언어는
-- 고른 사람에게만 보여 준다.
--
-- 로그인 전 화면에서는 계정을 알 수 없어 쿠키(lotto-lang)를 함께 쓴다.
-- 이 컬럼은 기기를 옮겨도 따라오는 기준값이다.

alter table public.profiles
  add column if not exists language text not null default 'ko';

alter table public.profiles
  drop constraint if exists profiles_language_check;

alter table public.profiles
  add constraint profiles_language_check check (language in ('ko', 'en', 'zh', 'ja'));
