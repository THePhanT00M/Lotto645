-- 프로필 이미지 정리
--
-- 1) 아바타와 배너를 한 버킷에 모은다.
--
--    무료 요금제 한도는 버킷 개수가 아니라 저장 용량(1GB)이라, 버킷을 나눠도
--    아끼는 것이 없다. 정책과 크기 제한을 한 곳에서만 보려고 하나로 둔다.
--
--      profile-images/avatars/<회원 id>/<임의 이름>.png
--      profile-images/banners/<회원 id>/<임의 이름>.jpg
--
-- 2) avatars 버킷에 걸어 둔 읽기 정책을 걷어 낸다.
--
--    이 정책은 <img> 로 보는 데는 필요 없다. 공개 버킷은 /object/public 경로로
--    RLS 를 거치지 않고 나간다. 반면 정책이 있으면 목록 조회가 함께 열려,
--    공개된 익명 키만으로 전체 회원 id 와 파일명을 훑을 수 있다.
--    (실제로 열람되는 것을 확인하고 되돌리는 변경이다.)
--
--    올리기·지우기는 서버가 서비스 롤로 대신 하므로 쓰기 정책은 두지 않는다.
--
-- 이미 올라간 아바타는 그대로 둔다. 주소를 통째로 저장해 두어 계속 보이고,
-- 다음에 사진을 바꿀 때 예전 버킷에서 지워진다.

alter table public.profiles
  add column if not exists banner_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  2097152, -- 2MB. 화면에서 잘라 올리므로 원본이 커도 여기서 넘지 않는다.
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
