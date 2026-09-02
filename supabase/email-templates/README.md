# 인증 메일 템플릿

Supabase 대시보드의 **Authentication → Email Templates** 에 붙여 넣는다.
대시보드에만 있으면 무엇을 보내고 있는지 저장소에서 알 수 없어 여기에 함께 둔다.
고칠 때는 이 파일을 고치고 대시보드에 다시 붙여 넣는다.

| 파일 | 대시보드 항목 | 언제 나가나 |
|---|---|---|
| `confirm-signup.html` | Confirm signup | 회원가입 직후 |
| `reset-password.html` | Reset Password | 비밀번호 재설정 요청 (회원 본인·관리자 대행 모두) |
| `magic-link.html` | Magic Link | 비밀번호 없이 로그인 |
| `change-email.html` | Change Email Address | 이메일 주소 변경 |

## 제목

본문과 함께 제목도 대시보드에서 정한다.

| 항목 | 제목 |
|---|---|
| Confirm signup | `[Lotto645] 이메일 인증 메일입니다` |
| Reset Password | `[Lotto645] 비밀번호 재설정 안내` |
| Magic Link | `[Lotto645] 로그인 링크입니다` |
| Change Email Address | `[Lotto645] 이메일 주소 변경 확인` |

## 규칙

- 메일 프로그램은 flex·grid·CSS 변수를 대부분 지원하지 않는다. 표(table)와
  인라인 스타일만 쓴다.
- 버튼이 막히는 환경이 있어 주소를 그대로 적은 줄을 함께 둔다. 링크가 어디로
  가는지 눈으로 확인할 수 있어 문제를 살필 때도 쓸모 있다.
- 다크 모드를 따로 만들지 않는다. 메일 프로그램마다 처리가 달라 오히려 깨진다.
  흰 바탕에 진한 글자로 고정한다.
- `{{ .ConfirmationURL }}` 은 Supabase 가 채운다. 비밀번호 재설정 링크는
  `/update-password` 로 도착하도록 앱에서 정한다(lib/auth/password-reset).
