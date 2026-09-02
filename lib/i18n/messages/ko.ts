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
  settings: {
    title: "설정",
    description: "화면과 계정 동작을 조정합니다.",
    theme: {
      title: "화면 테마",
      light: "밝게",
      dark: "어둡게",
      system: "시스템",
    },
    language: {
      title: "화면 언어",
      description: "고른 언어는 계정에 저장되어 다른 기기에서도 그대로 보입니다.",
      saved: "언어를 바꿨습니다.",
    },
    autoLogin: {
      title: "자동 로그인",
      saved: "설정을 저장했습니다.",
      on: "다음 접속부터 자동으로 로그인합니다.",
      off: "브라우저를 닫으면 로그아웃됩니다.",
    },
    account: {
      title: "계정",
      withdrawDescription: "탈퇴하면 계정과 프로필이 사라지고 되돌릴 수 없습니다. 만들었던 번호 기록은 누구의 것인지 알 수 없는 형태로 남습니다.",
      withdraw: "회원 탈퇴",
      withdrawing: "탈퇴 처리 중",
      confirmTitle: "정말 탈퇴하시겠어요?",
      confirmDescription: "계정과 프로필, 올린 사진이 모두 사라집니다. 같은 이메일로 다시 가입할 수는 있지만 예전 기록은 돌아오지 않습니다.",
      confirm: "탈퇴",
      done: "탈퇴 처리했습니다.",
      failed: "탈퇴하지 못했습니다.",
    },
  },

  auth: {
    languageLabel: "선호하는 언어",
    languageHint: "가입 후에도 설정에서 바꿀 수 있습니다.",
  },
  home: {
    tabs: {
      machine: "로또 추첨기",
      manual: "수동 추첨기",
    },
    guide: {
      title: "로또 정보",
      basics: {
        title: "기본 정보",
        range: "로또 6/45는 1부터 45까지의 숫자 중 6개를 선택하는 복권입니다.",
        schedule: "당첨번호는 매주 토요일 저녁에 추첨됩니다.",
        oddsLabel: "1등 당첨 확률",
      },
      usage: {
        title: "이용 안내",
        machine: "로또 추첨기",
        machineDescription: "물리적 추첨 방식을 시뮬레이션하여 완전히 랜덤한 번호를 생성합니다.",
        manual: "수동 추첨기",
        manualDescription: "원하는 번호를 직접 선택하거나, 특정 번호를 고정하거나 제외하고 나머지를 자동으로 생성할 수 있습니다.",
      },
      warning: {
        title: "주의사항",
        ageLimit: "만 19세 이상만",
        body: "복권 구매는 만 19세 이상만 가능합니다. 과도한 복권 몰입은 도박 중독을 유발할 수 있으니 건전한 여가 생활로 즐겨주세요.",
      },
    },
  },

  faq: {
    title: "자주 묻는 질문 (FAQ)",
    description: "Lotto645 서비스 이용에 대한 궁금증을 해결해 드립니다.",
    contactHint: "더 궁금한 점이 있으신가요? 페이지 하단의 문의하기를 이용해 주세요.",
    service: {
      tabLabel: "서비스 이용",
      title: "기본 이용 안내",
      items: [
        {
          question: "이 사이트는 무료인가요?",
          answer: "네, Lotto645의 모든 기능(번호 추첨, AI 분석, 기록 저장 등)은 회원가입 없이 무료로 이용하실 수 있습니다.",
        },
        {
          question: "실제 복권을 구매할 수 있나요?",
          answer: "아니요. 이 서비스는 번호 생성 및 분석 시뮬레이터입니다. 실제 복권 구매는 동행복권 공식 홈페이지나 오프라인 판매점을 이용해 주시기 바랍니다.",
        },
        {
          question: "당첨 번호는 언제 업데이트 되나요?",
          answer: "매주 토요일 추첨이 끝난 뒤 자동으로 업데이트됩니다. 최종 확인은 복권 발행 기관의 공식 정보를 따라 주세요.",
        },
      ],
    },
    analysis: {
      tabLabel: "추천 및 분석 기능",
      title: "번호 추천과 분석",
      items: [
        {
          question: "AI 추천은 어떤 기준으로 번호를 고르나요?",
          answer: "역대 당첨 번호를 로또 용지 위의 점으로 옮겨, 여섯 점이 만드는 모양을 여러 기하 특징으로 재고 학습한 결과를 씁니다. 이미 나온 조합과 지나치게 닮은 번호는 제외합니다.",
        },
        {
          question: "AI 추천을 쓰면 당첨 확률이 올라가나요?",
          answer: "아니요. 추천 번호도 다른 조합과 당첨 확률이 같습니다. 과거 데이터를 바탕으로 한 참고용 도구이며 당첨을 보장하지 않습니다.",
        },
        {
          question: "수동 추첨기에서 번호를 고정하거나 제외할 수 있나요?",
          answer: "네. 원하는 번호를 고정하면 그 번호는 그대로 두고, 제외한 번호는 빼고 나머지를 자동으로 채웁니다.",
        },
        {
          question: "용지 위 모양은 무엇을 뜻하나요?",
          answer: "고른 여섯 개를 로또 용지에 찍고 이어 본 모양입니다. 점들이 얼마나 퍼져 있고 어느 쪽에 몰려 있는지를 눈으로 확인할 수 있습니다.",
        },
      ],
    },
    data: {
      tabLabel: "데이터 및 저장",
      title: "기록과 개인정보",
      items: [
        {
          question: "로그인하지 않아도 기록이 남나요?",
          answer: "네. 로그인하지 않고 만든 번호는 그 브라우저에만 저장됩니다. 다른 기기에서는 보이지 않고, 브라우저 데이터를 지우면 함께 사라집니다.",
        },
        {
          question: "로그인하면 무엇이 달라지나요?",
          answer: "만든 번호가 계정에 저장되어 다른 기기에서도 이어서 볼 수 있고, 회차가 발표되면 당첨 여부를 자동으로 확인해 알려 드립니다.",
        },
        {
          question: "탈퇴하면 기록은 어떻게 되나요?",
          answer: "계정과 프로필은 지워집니다. 만들었던 번호 기록은 누구의 것인지 알 수 없는 형태로만 남아 회차별 통계에 쓰입니다.",
        },
      ],
    },
  },
  lotto: {
    rank: (rank: number) => `${rank}등`,
    miss: "미당첨",
    pending: "추첨 대기",
    noData: "데이터 없음",
    drawNo: (drawNo: number) => `${drawNo}회차`,
    bonus: "보너스",
  },

  history: {
    title: "나의 추첨 기록",
    description: "기기와 서버에 저장된 기록을 확인하고 당첨 결과를 봅니다.",
    totalSaved: "총 저장된 기록",
    winners: "당첨된 기록 (5등 이상)",
    count: (value: number) => `${value.toLocaleString()}건`,
    empty: "저장된 추첨 기록이 없습니다.",
    unassignedDraw: "회차 미지정",
    selectAll: "전체 선택",
    clearSelection: "전체 해제",
    deleteSelected: "선택 삭제",
    deleteAll: "전체 삭제",
    confirmOneTitle: "이 기록을 삭제할까요?",
    confirmSelectedTitle: "선택한 기록을 삭제할까요?",
    confirmAllTitle: "모든 기록을 삭제할까요?",
    confirmServerNote: "서버에 저장된 기록은 실제로 지우지 않고 삭제 표시만 남깁니다.",
    confirmAllDescription: "이 기기에 저장된 기록과 서버에 저장된 기록이 모두 목록에서 사라집니다.",
    deleted: "삭제했습니다.",
    deletedCount: (value: number) => `${value.toLocaleString()}건을 삭제했습니다.`,
    deleteFailed: "삭제하지 못했습니다.",
    cancelSelect: "선택 취소",
    startSelect: "선택 삭제",
    selectedCount: (value: number) => `${value}건 선택됨`,
    confirmSelectedCountTitle: (value: number) => `선택한 ${value}건을 삭제할까요?`,
    winnersInDraw: (value: number) => `당첨 ${value}건`,
    noticeTitle: "안내사항",
    noticeLocal: "로그인하지 않고 만든 기록은 이 브라우저에만 저장되어, 다른 기기에서는 보이지 않습니다.",
    noticeServer: "로그인해 만든 기록은 서버에 저장되어 어느 기기에서든 이어서 볼 수 있습니다.",
    noticeSoftDelete: "지운 서버 기록은 목록에서 사라지지만, 통계를 위해 삭제 표시만 남긴 채 보관합니다.",
    noticePending: "추첨 대기 상태의 기록은 회차가 발표된 뒤 다시 열면 결과가 채워집니다.",
  },

  winning: {
    title: "역대 당첨번호",
    description: "원하는 회차로 이동해 당첨 번호를 확인합니다.",
    listTitle: "회차별 목록",
    allLoaded: "모든 회차를 불러왔습니다.",
    previousDraw: "이전 회차",
    nextDraw: "다음 회차",
    notFoundTitle: "이동할 수 없습니다",
    notFound: "없는 회차입니다.",
  },

  notifications: {
    title: "알림",
    unread: (count: number) => `읽지 않은 알림이 ${count}건 있습니다.`,
    allRead: "모든 알림을 확인했습니다.",
    empty: "받은 알림이 없습니다.",
    markRead: "읽음으로 표시",
    markAllRead: "모두 읽음",
    deleteOne: "이 알림 삭제",
    deleteAll: "모두 지우기",
    confirmAllTitle: "알림을 모두 지울까요?",
    confirmAllDescription: "지운 알림은 되돌릴 수 없습니다.",
  },
} as const

export default ko
