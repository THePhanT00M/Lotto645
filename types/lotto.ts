export interface LottoResult {
  id: string
  numbers: number[]
  timestamp: number
  memo?: string // Optional memo field
  isAiRecommended?: boolean // Flag to indicate if this was an AI recommendation
}

export interface WinningLottoNumbers {
  drawNo: number
  date: string
  numbers: number[]
  bonusNo: number
}
