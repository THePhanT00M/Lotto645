# 마이그레이션

Supabase 대시보드의 SQL Editor에서 실행한다.

## 번호 기록 구조 재정비 (2026-09-01)

둘 중 하나만 고른다.

| 파일 | 쓰임 |
|---|---|
| `20260901_number_picks.sql` | 예전 표를 지우고 새로 만든다. 쌓인 기록은 사라진다. |
| `20260901_number_picks_keep_data.sql` | 쌓인 기록을 새 구조로 옮긴 뒤 예전 표를 지운다. |

바뀐 점

- `generated_numbers`와 `ai_recommendations` → `number_picks`와 `pick_insights`
- 번호를 두 표에 나눠 담던 것을 한 곳으로 모으고, AI 추천에만 있는 값만 딸린 표로 뒀다
- 채점 결과를 모든 기록에 남긴다. 예전에는 AI 추천만 채점됐다
- 삭제 여부를 `is_deleted` `'Y'/'N'`에서 `deleted_at`으로 바꿨다
- 접속 환경을 문자열 대신 `jsonb`로 담는다

## 프로필 아바타 저장소 (2026-09-02)

`20260902_avatars_bucket.sql` 을 실행한다.

프로필 화면의 사진 업로드가 쓰는 `avatars` 버킷을 만든다. 공개 버킷이라
`<img src>` 로 바로 읽히고, 올리고 지우는 것은 `/api/profile/avatar` 가
서비스 롤로 처리한다. 버킷이 없으면 업로드가 실패한다.
