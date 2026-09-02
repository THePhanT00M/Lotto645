-- 프로필 아바타 저장소
--
-- 아바타는 <img src>로 그대로 읽어야 하므로 공개 버킷으로 둔다.
-- 올리고 지우는 것은 서버(/api/profile/avatar)가 서비스 롤로 대신 하므로,
-- 브라우저에서 직접 쓰는 정책은 두지 않는다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB. 프로필 사진에 그 이상은 필요 없다.
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 공개 버킷이라도 읽기 정책이 있어야 인증 경로로 들어온 요청이 통과한다.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'avatars');
