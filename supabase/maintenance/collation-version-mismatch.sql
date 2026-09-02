-- collation version mismatch 경고 정리
--
--   database "postgres" has a collation version mismatch
--   The database was created using collation version 153.120,
--   but the operating system provides version 153.121.
--
-- 무슨 뜻인가
--   글자를 정렬하고 비교하는 규칙(collation)은 데이터베이스가 아니라 운영체제의
--   라이브러리가 갖고 있다. Supabase 가 그 라이브러리를 올리면 버전이 어긋나고,
--   접속할 때마다 이 경고가 나온다. 우리 스키마나 코드와는 상관이 없다.
--
-- 왜 그냥 두면 안 되나
--   규칙이 실제로 바뀌었다면, 글자 컬럼에 걸린 인덱스가 예전 순서로 정렬된 채
--   남는다. 그 인덱스를 타는 조회가 있는 행을 못 찾는 일이 생길 수 있다.
--   153.120 → 153.121 처럼 잔버전만 오른 경우 바뀐 규칙이 없거나 아주 적어
--   실제로 문제가 될 가능성은 낮지만, 바로잡는 방법은 정해져 있다.
--
-- 순서가 중요하다
--   버전 표시만 새로 찍으면(REFRESH COLLATION VERSION) 경고는 사라지지만
--   인덱스는 예전 순서 그대로 남는다. 반드시 다시 만든 뒤에 표시를 찍는다.


-- 1) 영향을 받는 인덱스가 있는지 먼저 본다.
--    C 나 POSIX 가 아닌 collation 을 쓰는 인덱스만 해당된다.
select
    n.nspname  as schema,
    t.relname  as table,
    c.relname  as index
from pg_class c
         join pg_index i on i.indexrelid = c.oid
         join pg_class t on t.oid = i.indrelid
         join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'i'
  and n.nspname not in ('pg_catalog', 'information_schema')
  and exists (
    select 1
    from unnest(i.indcollation) as coll
    where coll <> 0
      and coll not in ('C'::regcollation, 'POSIX'::regcollation)
)
order by 1, 2, 3;


-- 2) 인덱스를 다시 만든다. 이 저장소의 표는 작아 금방 끝난다.
--    잠금이 걸리므로 접속이 뜸한 때에 돌린다.
reindex database postgres;


-- 3) 그다음에 버전 표시를 새로 찍는다.
alter database postgres refresh collation version;


-- 4) template1 은 새 데이터베이스를 만들 때만 쓰이는 원본이라 급하지 않다.
--    권한이 모자라 실패하면 그대로 두어도 서비스에는 영향이 없다.
alter database template1 refresh collation version;
