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
--
-- REINDEX DATABASE 는 쓰지 않는다
--   대시보드 SQL 편집기는 보낸 것을 통째로 한 트랜잭션으로 감싼다. DATABASE·
--   SCHEMA 단위 REINDEX 는 트랜잭션 안에서 돌 수 없어 25001 로 끊긴다.
--   TABLE 단위는 트랜잭션 안에서도 되므로 그렇게 나눠 돈다.


-- 1) 영향을 받는 인덱스를 본다.
--
--    C 와 POSIX 는 글자 코드값 그대로 견주는 규칙이라 라이브러리가 올라가도
--    순서가 바뀌지 않는다. 그 밖의 규칙을 쓰는 인덱스만 해당된다.
--
--    이름을 regcollation 으로 바로 바꾸지 않는다. 따옴표 없는 식별자로 읽혀
--    소문자가 되고, 그런 이름의 규칙은 없다고 나온다. pg_collation 과 이어
--    이름으로 견준다. indcollation 은 oidvector 라 배열로 바꿔 펼친다.
select
    n.nspname   as schema_name,
    t.relname   as table_name,
    c.relname   as index_name,
    co.collname as collation_name
from pg_class c
         join pg_index i on i.indexrelid = c.oid
         join pg_class t on t.oid = i.indrelid
         join pg_namespace n on n.oid = c.relnamespace
         cross join lateral unnest(i.indcollation::oid[]) as coll
         join pg_collation co on co.oid = coll
where c.relkind = 'i'
  and n.nspname not in ('pg_catalog', 'information_schema')
  and co.collname not in ('C', 'POSIX')
order by 1, 2, 3;


-- 2) 다시 만들 문장을 뽑는다. 결과를 복사해 그대로 돌리면 된다.
--
--    한 번에 돌리는 3) 보다 이쪽이 낫다. 무엇이 도는지 눈으로 확인할 수 있고,
--    남의 스키마(auth·storage 등)는 우리 권한으로 못 고치므로 골라 낼 수 있다.
select distinct format('reindex table %I.%I;', n.nspname, t.relname) as statement
from pg_class c
         join pg_index i on i.indexrelid = c.oid
         join pg_class t on t.oid = i.indrelid
         join pg_namespace n on n.oid = c.relnamespace
         cross join lateral unnest(i.indcollation::oid[]) as coll
         join pg_collation co on co.oid = coll
where c.relkind = 'i'
  and n.nspname not in ('pg_catalog', 'information_schema')
  and co.collname not in ('C', 'POSIX')
order by 1;


-- 3) 한 번에 돌리고 싶다면 이것만 실행한다.
--
--    TABLE 단위라 트랜잭션 안에서도 돈다. 우리 것이 아닌 표는 권한이 없어
--    실패하는데, 그때는 건너뛰고 이어 간다. Supabase 가 관리하는 스키마는
--    그쪽에서 정리한다.
do $$
    declare
        target record;
    begin
        for target in
            select distinct n.nspname as schema_name, t.relname as table_name
            from pg_class c
                     join pg_index i on i.indexrelid = c.oid
                     join pg_class t on t.oid = i.indrelid
                     join pg_namespace n on n.oid = c.relnamespace
                     cross join lateral unnest(i.indcollation::oid[]) as coll
                     join pg_collation co on co.oid = coll
            where c.relkind = 'i'
              and n.nspname not in ('pg_catalog', 'information_schema')
              and co.collname not in ('C', 'POSIX')
            order by 1, 2
            loop
                begin
                    execute format('reindex table %I.%I', target.schema_name, target.table_name);
                    raise notice '다시 만듦 : %.%', target.schema_name, target.table_name;
                exception
                    when insufficient_privilege then
                        raise notice '건너뜀   : %.% (권한 없음)', target.schema_name, target.table_name;
                end;
            end loop;
    end
$$;


-- 4) 다시 만든 뒤에 버전 표시를 새로 찍는다.
alter database postgres refresh collation version;


-- 5) template1 은 새 데이터베이스를 만들 때만 쓰이는 원본이라 급하지 않다.
--    권한이 모자라 실패하면 그대로 두어도 서비스에는 영향이 없다.
alter database template1 refresh collation version;
