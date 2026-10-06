import { COVER_SIZE, COVER_STATS, labelCover } from "@/lib/lotto/cover"
import { ALL_NUMBERS, FIRST_PRIZE_ODDS } from "@/lib/lotto/constants"
import { pickUnique } from "@/lib/lotto/random"

/**
 * 3개 보장 묶음 전수 검증
 *
 * 무작위 번호 배치로 181장을 만들고, 814만 가지 당첨 번호 전부에서 3개 이상 맞는 장이 있는지 대조한다.
 */

// 1. 무작위 배치 묶음 + 번호를 두 개의 32비트 마스크로
const labels = pickUnique(ALL_NUMBERS, ALL_NUMBERS.length)
const tickets = labelCover(labels)
const low = (numbers: readonly number[]) => numbers.reduce((mask, n) => (n <= 30 ? mask | (1 << (n - 1)) : mask), 0) >>> 0
const high = (numbers: readonly number[]) => numbers.reduce((mask, n) => (n > 30 ? mask | (1 << (n - 31)) : mask), 0) >>> 0
const ticketLow = Uint32Array.from(tickets, low)
const ticketHigh = Uint32Array.from(tickets, high)

const popcount = (value: number) => {
  let x = value - ((value >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

// 2. 당첨 번호 전부를 돌며 최고 적중과 적중 장수 집계
const best = [0, 0, 0, 0, 0, 0, 0]
const hits = [0, 0, 0, 0, 0, 0, 0]
let draws = 0
const draw = [0, 0, 0, 0, 0, 0]

const visit = (depth: number, start: number) => {
  if (depth === 6) {
    const drawLow = low(draw)
    const drawHigh = high(draw)
    let top = 0
    for (let i = 0; i < COVER_SIZE; i++) {
      const matched = popcount(ticketLow[i] & drawLow) + popcount(ticketHigh[i] & drawHigh)
      hits[matched]++
      if (matched > top) top = matched
    }
    best[top]++
    draws++
    return
  }
  for (let n = start; n <= 45 - (5 - depth); n++) {
    draw[depth] = n
    visit(depth + 1, n + 1)
  }
}
visit(0, 1)

// 3. 보장 실패 건수와, cover.ts 에 적어 둔 성적과의 일치 확인
const failed = best[0] + best[1] + best[2]
const same = (a: number, b: number) => Math.abs(a - b) < 1e-9

const checks = [
  ["당첨 번호 수", draws === FIRST_PRIZE_ODDS],
  ["장수 181장, 중복 없음", COVER_SIZE === 181 && new Set(tickets.map((t) => t.join())).size === COVER_SIZE],
  ["3개 미만 회차 0건", failed === 0],
  ...([3, 4, 5, 6] as const).map((k) => [`최고 ${k}개 비율`, same(best[k] / draws, COVER_STATS.bestShare[k])] as const),
  ...([3, 4] as const).map((k) => [`평균 ${k}개 적중 장수`, same(hits[k] / draws, COVER_STATS.averageHits[k])] as const),
] as const

console.log(`배치: ${labels.join(",")}`)
console.log(`최고 적중 분포 (0~6개): ${best.join(" / ")}`)
for (const [label, passed] of checks) console.log(`${passed ? "통과" : "실패"}  ${label}`)

if (checks.some(([, passed]) => !passed)) process.exit(1)
