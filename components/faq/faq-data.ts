import { Save, ShieldQuestion, Sparkles, type LucideIcon } from "lucide-react"

/** 질문 한 건. answer의 각 항목이 한 문단이 된다. */
export interface FaqItem {
  question: string
  answer: string[]
}

/** 탭 하나에 묶이는 질문 모음 */
export interface FaqSection {
  value: string
  tabLabel: string
  title: string
  icon: LucideIcon
  /** 아이콘·강조 색 (Tailwind 클래스) */
  accentClass: string
  items: FaqItem[]
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    value: "service",
    tabLabel: "서비스 이용",
    title: "기본 이용 안내",
    icon: ShieldQuestion,
    accentClass: "text-blue-600 dark:text-blue-400",
    items: [
      {
        question: "이 사이트는 무료인가요?",
        answer: [
          "네, Lotto645의 모든 기능(번호 추첨, AI 분석, 기록 저장 등)은 회원가입 없이 무료로 이용하실 수 있습니다.",
        ],
      },
      {
        question: "실제 복권을 구매할 수 있나요?",
        answer: [
          "아니요. 이 서비스는 번호 생성 및 분석 시뮬레이터입니다. 실제 복권 구매는 동행복권 공식 홈페이지나 오프라인 판매점을 이용해 주시기 바랍니다.",
        ],
      },
      {
        question: "당첨 번호는 언제 업데이트 되나요?",
        answer: ["매주 토요일 저녁 추첨 방송이 끝난 직후, 공식 데이터를 확인하여 자동으로 업데이트됩니다."],
      },
    ],
  },
  {
    value: "features",
    tabLabel: "추첨 및 분석 기능",
    title: "AI 및 추첨 알고리즘",
    icon: Sparkles,
    accentClass: "text-purple-600 dark:text-purple-400",
    items: [
      {
        question: "'로또 추첨기'와 'AI 추천'의 차이는 무엇인가요?",
        answer: [
          "로또 추첨기: 물리적인 추첨기를 시뮬레이션하여 1~45번 공을 완전히 무작위(Random)로 섞어서 뽑습니다. 운에 맡기는 방식입니다.",
          "AI 추천: 역대 당첨 번호를 로또 용지 위의 점으로 옮긴 뒤, 여섯 점이 만드는 모양을 21가지 값으로 잽니다. 점들을 감싼 테두리의 넓이와 둘레, 모두 이었을 때의 선 길이, 퍼진 방향과 직선에 가까운 정도, 맞닿은 칸의 수 같은 것들입니다.",
          "그 특징들을 학습한 신경망과 통계 거리(마할라노비스)를 함께 써서, 과거 당첨 조합들이 놓이던 범위 안으로 들어오는 조합을 찾습니다. 번호를 더하거나 홀짝을 세는 방식은 쓰지 않습니다.",
          "연속된 번호, 일정한 간격, 한 줄이나 한 덩어리에 몰린 조합처럼 손으로 찍기 쉬운 모양은 배제됩니다. 당첨 확률이 낮아서가 아니라, 그런 번호는 같이 고른 사람이 많아 당첨되어도 나눠 갖는 몫이 줄기 때문입니다.",
        ],
      },
      {
        question: "'수동 추첨기'에서 번호 고정과 제외는 어떻게 하나요?",
        answer: [
          "수동 추첨기 탭에서 [번호 고정]을 선택하여 원하는 번호를 반드시 포함시키거나, [번호 제외]를 통해 원하지 않는 번호를 뺄 수 있습니다. 남은 번호는 자동으로 채울 수 있습니다.",
        ],
      },
      {
        question: "'당첨 패턴 통계'는 무엇을 보여주나요?",
        answer: [
          "뽑은 6개 번호에서 만들 수 있는 2~5개짜리 조합이 과거에 실제로 함께 당첨된 적이 있는지, 있다면 몇 회차였는지 보여줍니다.",
          "과거에 자주 함께 나왔다는 사실이 다음 회차 당첨 확률을 높이지는 않습니다. 재미와 참고용으로만 활용해 주세요.",
        ],
      },
    ],
  },
  {
    value: "data",
    tabLabel: "데이터 및 저장",
    title: "데이터 관리",
    icon: Save,
    accentClass: "text-green-600 dark:text-green-400",
    items: [
      {
        question: "추첨 기록은 어디에 저장되나요?",
        answer: [
          "로그인하지 않고 이용하면 생성한 번호는 현재 사용 중인 브라우저(Local Storage)에만 저장됩니다.",
          "로그인 상태에서는 서버의 '내 기록'에 저장되어, 다른 기기에서도 같은 계정으로 확인하고 삭제할 수 있습니다.",
        ],
      },
      {
        question: "저장된 기록이 사라졌어요.",
        answer: [
          "로컬 기록은 브라우저에 저장되므로, 브라우저 캐시(쿠키)를 삭제하거나 시크릿 모드를 사용하시면 사라질 수 있습니다.",
          "기기를 옮겨도 기록을 유지하려면 로그인 후 이용해 주세요.",
        ],
      },
      {
        question: "'추첨 대기' 상태는 무엇인가요?",
        answer: [
          "번호를 저장할 당시 해당 회차의 당첨 번호가 아직 발표되지 않았음을 의미합니다. 추첨일(토요일) 이후 사이트에 다시 접속하시면 자동으로 당첨 결과를 확인하실 수 있습니다.",
        ],
      },
    ],
  },
]
