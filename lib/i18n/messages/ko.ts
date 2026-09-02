/**
 * 한국어 문구 (기준)
 *
 * 이 파일이 기준이다. 다른 언어 파일은 여기의 모양을 그대로 따르므로, 키를
 * 더하거나 지우면 나머지 언어에서 타입 오류가 난다. 빠뜨린 번역이 조용히
 * 지나가지 않게 하려는 것이다.
 *
 * 값에 숫자나 이름이 끼어드는 문구는 함수로 둔다. 자리를 문자열로 표시하면
 * 언어마다 어순이 달라질 때 손댈 곳이 늘어난다.
 */
const ko = {
  common: {
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    close: "닫기",
    refresh: "새로고침",
    search: "검색",
    loading: "불러오는 중",
    retry: "다시 시도",
    home: "홈으로",
    required: "필수",
    optional: "선택",
  },

  nav: {
    history: "추첨기록",
    winningNumbers: "당첨번호",
    faq: "FAQ",
    login: "로그인",
    logout: "로그아웃",
    profile: "프로필",
    notifications: "알림",
    settings: "설정",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    theme: "화면 밝기 바꾸기",
    language: "언어",
  },

  footer: {
    rights: (year: number) => `© ${year} 로또 추첨기. All rights reserved.`,
    terms: "이용약관",
    privacy: "개인정보처리방침",
    contact: "문의하기",
  },

  legal: {
    updatedAt: (date: string) => `${date} 시행`,
    koreanOnly: "이 문서는 한국어를 정본으로 합니다.",
  },

  contact: {
    title: "문의하기",
    description: "서비스 이용 중 불편하거나 궁금한 점을 남겨 주세요. 확인 후 답변드립니다.",
    email: "답변받을 이메일",
    emailPlaceholder: "example@email.com",
    subject: "제목",
    subjectPlaceholder: "무엇에 대한 문의인가요?",
    message: "내용",
    messagePlaceholder: "겪으신 일을 자세히 적어 주실수록 빠르게 도와드릴 수 있습니다.",
    submit: "보내기",
    sending: "보내는 중",
    sent: "문의를 남겼습니다",
    sentDescription: "적어 주신 이메일로 답변드리겠습니다.",
    another: "문의 하나 더 남기기",
    errors: {
      email: "답변받을 이메일을 올바르게 입력해 주세요.",
      subject: "제목을 입력해 주세요.",
      message: "내용을 10자 이상 적어 주세요.",
      failed: "문의를 남기지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  },
} as const

export default ko
