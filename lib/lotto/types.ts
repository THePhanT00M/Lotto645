/** 사용자가 생성한 번호 한 세트 */
export interface LottoResult {
  id: string
  numbers: number[]
  timestamp: number
  memo?: string
  /** AI 추천으로 생성된 번호인지 여부 */
  isAiRecommended?: boolean
  /** 이 번호가 겨냥한 회차 (구 기록에는 없을 수 있음) */
  drawNo?: number
}

/** 회차별 실제 당첨 번호 */
export interface WinningLottoNumbers {
  drawNo: number
  date: string
  numbers: number[]
  bonusNo: number
}

/** 번호를 만든 경로 */
export type DrawSource = "machine" | "manual" | "ai"

/** 기록의 저장 위치 (브라우저 localStorage / 서버 DB) */
export type RecordSource = "local" | "user"
