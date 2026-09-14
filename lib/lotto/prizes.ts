import { FIRST_PRIZE_ODDS, MAX_NUMBER, PICK_COUNT } from "./constants"

/**
 * 회차별 등수 당첨자 수와 판매액
 *
 * 동행복권이 회차마다 발표하는 값이다. 당첨자가 무작위 구매 기대보다 많았다면
 * 그 조합을 사람들이 많이 샀다는 뜻이라, 조합의 인기를 거꾸로 재는 데 쓴다. (popularity.ts)
 */
export interface DrawPrize {
  drawNo: number
  /** 판매액(원) */
  totalSales: number
  /** 1~5등 당첨자 수. 인덱스 0 이 1등이다. */
  winners: number[]
  /** 1~5등 1인당 당첨금(원) */
  amounts: number[]
}

const RANKS = [1, 2, 3, 4, 5] as const

type PrizeRank = (typeof RANKS)[number]

/** draw_prizes 표의 한 행 */
export type DrawPrizeRow = { draw_no: number; total_sales: number } & Record<
    `winners_${PrizeRank}` | `amount_${PrizeRank}`,
    number
>

/** 동행복권 회차 조회 API(selectPstLt645Info.do)가 돌려주는 값 가운데 쓰는 것 */
export type LottoApiItem = {
  /** 회차 */
  ltEpsd: number
  /** 추첨일 (YYYYMMDD) */
  ltRflYmd: string
  tm1WnNo: number
  tm2WnNo: number
  tm3WnNo: number
  tm4WnNo: number
  tm5WnNo: number
  tm6WnNo: number
  bnsWnNo: number
  /** 회차 전체 판매액(원) */
  wholEpsdSumNtslAmt: number
} & Record<`rnk${PrizeRank}WnNope` | `rnk${PrizeRank}WnAmt`, number>

export const prizeFromApi = (item: LottoApiItem): DrawPrize => ({
  drawNo: item.ltEpsd,
  totalSales: item.wholEpsdSumNtslAmt,
  winners: RANKS.map((rank) => item[`rnk${rank}WnNope`]),
  amounts: RANKS.map((rank) => item[`rnk${rank}WnAmt`]),
})

export const toPrizeRow = (prize: DrawPrize): DrawPrizeRow => {
  const row = { draw_no: prize.drawNo, total_sales: prize.totalSales } as DrawPrizeRow
  RANKS.forEach((rank, index) => {
    row[`winners_${rank}`] = prize.winners[index] ?? 0
    row[`amount_${rank}`] = prize.amounts[index] ?? 0
  })
  return row
}

export const fromPrizeRow = (row: DrawPrizeRow): DrawPrize => ({
  drawNo: row.draw_no,
  totalSales: Number(row.total_sales),
  winners: RANKS.map((rank) => Number(row[`winners_${rank}`])),
  amounts: RANKS.map((rank) => Number(row[`amount_${rank}`])),
})

/**
 * 이 회차부터 한 게임 가격이 2,000원에서 1,000원이 되었다.
 *
 * 판매액을 1,000원으로 나누면 87회까지는 5등 인원이 기대의 0.41~0.58배로 나오고,
 * 88회(2004-08-07)부터 1 근처가 된다.
 */
const PRICE_CHANGE_DRAW = 88

/** 판매된 게임 수 */
export const gamesSold = (prize: DrawPrize): number =>
    prize.totalSales / (prize.drawNo < PRICE_CHANGE_DRAW ? 2000 : 1000)

/** 조합 하나가 등수에 들 확률 */
const RANK_PROBABILITY = {
  1: 1 / FIRST_PRIZE_ODDS,
  /** 당첨 번호 5개 + 보너스도 당첨 번호도 아닌 번호 1개 */
  3: (PICK_COUNT * (MAX_NUMBER - PICK_COUNT - 1)) / FIRST_PRIZE_ODDS,
} as const

/**
 * 실제 당첨자 ÷ 모두 무작위로 샀을 때의 기대 인원 (로그).
 *
 * 0 이면 무작위 구매만큼, 양수면 그보다 많이 팔린 조합이다. 0.5 는 당첨자 0명 회차의 로그를 막는다.
 */
export const crowdLogRatio = (prize: DrawPrize, rank: 1 | 3): number =>
    Math.log(((prize.winners[rank - 1] ?? 0) + 0.5) / (gamesSold(prize) * RANK_PROBABILITY[rank]))

/** 여러 회차를 합친 1등 당첨자 ÷ 기대 인원. 회차가 없으면 NaN. */
export const firstPrizeShare = (prizes: readonly DrawPrize[]): number => {
  const winners = prizes.reduce((sum, prize) => sum + (prize.winners[0] ?? 0), 0)
  const expected = prizes.reduce((sum, prize) => sum + gamesSold(prize) * RANK_PROBABILITY[1], 0)
  return expected > 0 ? winners / expected : Number.NaN
}
