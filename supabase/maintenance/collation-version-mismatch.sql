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
-- 이 파일을 통째로 한 번에 돌려도 된다
--   대시보드 SQL 편집기는 보낸 것을 통째로 한 트랜잭션으로 감싼다. 그래서
--   중간에 하나라도 실패하면 앞의 것까지 모두 되돌아간다. 트랜잭션 안에서
--   돌 수 없는 문장(REINDEX DATABASE·SCHEMA)과 우리 권한 밖의 문장은 아예
--   빼고, 남은 것은 권한이 없으면 건너뛰도록 감쌌다.
--
-- template1 은 여기서 다루지 않는다
--   그 데이터베이스의 주인은 supabase_admin 이라 우리 역할로는 만질 수 없다
--   (42501). 새 데이터베이스를 만들 때만 쓰이는 원본이라 서비스와 무관하고,
--   경고가 남더라도 Supabase 쪽에서 정리할 몫이다.
--
-- 실제로 세어 본 결과 (2026-09-02)
--   해당하는 인덱스는 60개였고, 그중 우리 것은 public 스키마의 4개뿐이었다.
--   나머지는 auth 32 · storage 14 · realtime 9 · vault 1 로 모두 Supabase 소유라
--   우리 역할로는 다시 만들 수 없다.
--
--     public.number_picks   : number_picks_combo_idx, number_picks_source_idx
--     public.pick_insights  : pick_insights_model_version_idx
--     public.profiles       : profiles_email_key
--
--   네 인덱스가 다루는 값은 모두 아스키다. 조합 키('8-13-22-24-40-42'), 출처
--   ('machine'·'manual'·'ai'), 모델 판, 이메일 주소. 잔버전이 오를 때 아스키의
--   순서는 바뀌지 않으므로 실제로 어긋났을 가능성은 사실상 없다. 그래도 표가
--   작아 다시 만드는 값이 거의 들지 않으니 정리해 둔다.


-- ── 1. 무엇이 영향을 받는지 본다 ────────────────────────────────────────────
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


-- ── 2. 우리 표의 인덱스를 다시 만든다 ─────────────────────────────────────
--
--    표 단위 REINDEX 는 트랜잭션 안에서도 돈다. 표가 작아 곧 끝난다.
reindex table public.number_picks;
reindex table public.pick_insights;
reindex table public.profiles;


-- ── 3. 그다음에 버전 표시를 새로 찍는다 ────────────────────────────────────
--
--    순서를 바꾸면 경고만 사라지고 인덱스는 예전 순서 그대로 남는다.
--
--    권한이 없으면 건너뛴다. 그냥 두면 이 한 줄 때문에 앞에서 다시 만든 인덱스
--    까지 되돌아간다. 편집기가 보낸 것을 통째로 한 트랜잭션으로 감싸기 때문이다.
--    묶음 안에서 잡은 오류는 그 묶음만 되돌리므로 앞의 것은 남는다.
--
--    다만 auth·storage 인덱스는 우리가 다시 만들지 못했으므로, 표시만 새로
--    찍으면 그쪽은 어긋난 채 표시만 새것이 된다. 그 스키마를 Supabase 가
--    정리한 뒤에 찍는 편이 옳다. 경고를 당장 지우고 싶을 때만 쓴다.
do $$
    begin
        execute format('alter database %I refresh collation version', current_database());
        raise notice '버전 표시 : 새로 찍음';
    exception
        when insufficient_privilege then
            raise notice '버전 표시 : 권한이 없어 건너뜀. Supabase 쪽에서 정리할 몫이다.';
    end
$$;
