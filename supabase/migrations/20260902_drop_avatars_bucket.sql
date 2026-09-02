-- 쓰지 않게 된 avatars 버킷 정리
--
-- 아바타는 profile-images/avatars/ 로 옮겼다. 예전 버킷을 가리키던 주소는
-- 사진을 다시 올릴 때 지워지도록 해 두었고, 남은 파일과 참조가 없는 것을
-- 확인하고 지운다.
--
-- 파일이 하나라도 남아 있으면 아무 일도 하지 않는다. 남아 있다는 것은 아직
-- 그 주소를 보고 있는 프로필이 있다는 뜻이라, 지우면 사진이 깨진다.

delete from storage.buckets b
where b.id = 'avatars'
  and not exists (
    select 1 from storage.objects o where o.bucket_id = 'avatars'
  );
