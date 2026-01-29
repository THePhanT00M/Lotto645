// components/lotto-analysis/types.ts

// 다중 번호 타입 정의
export type MultipleNumberType = {
  numbers: number[]
  count: number
  type: "2쌍둥이" | "3쌍둥이" | "4쌍둥이"
  appearances: {
    drawNo: number
    date: string
  }[]
}

export interface SimilarDrawType {
  drawNo: number
  date: string
  numbers: number[]
  bonusNo: number
  matchCount: number
}

export interface CommonProps {
  getBallColor: (number: number) => string
}

// [추가] AI 추천 및 분석에 필요한 핵심 데이터 타입
export interface LottoAnalytics {
  gapMap: Map<number, number>        // 번호별 미출현 기간
  latestDrawNumbers: number[]        // 지난 회차 번호 (보너스 포함)
  latestDrawNo: number               // 지난 회차 번호
  winningNumbersSet: Set<string>     // 역대 당첨 번호 조합 (중복 체크용)
}