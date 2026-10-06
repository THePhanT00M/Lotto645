-- 3개 보장 묶음 기록 표 삭제
--
-- 181장 묶음 기능을 뺐으므로 20261006_cover_bundles.sql 로 만든 표를 지운다.
-- 쌓인 행은 테스트 2건뿐이다. 여러 번 실행해도 같은 결과가 된다.

drop table if exists public.cover_bundles;
