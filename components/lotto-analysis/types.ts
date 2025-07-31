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
