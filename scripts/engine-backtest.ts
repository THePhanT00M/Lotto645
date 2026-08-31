import { buildEngine } from "@/lib/lotto/engine"
import { matchDraw } from "@/lib/lotto/rank"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { pickUnique } from "@/lib/lotto/random"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** 회차당 만들 조합 수 */
const PER_DRAW = 5

/** 학습에 쓸 회차 (이 회차까지만 알고 있다고 가정) */
const TRAIN_UNTIL = 1000

const summarize = (label: string, matches: number[], drawCount: number) => {
  const n = matches.length
  const mean = matches.reduce((a, b) => a + b, 0) / n
  const dist = Array.from({ length: PICK_COUNT + 1 }, (_, k) => matches.filter((m) => m === k).length)
  const win = matches.filter((m) => m >= 3).length

  // 평균의 표준오차 (표본 표준편차 / sqrt(n))
  const variance = matches.reduce((sum, m) => sum + (m - mean) ** 2, 0) / (n - 1)
  const se = Math.sqrt(variance / n)

  console.log(`\n[${label}] ${drawCount}개 회차 × ${PER_DRAW}조합 = ${n.toLocaleString()}건`)
  console.log(`  평균 적중 : ${mean.toFixed(4)} ± ${(1.96 * se).toFixed(4)} (95% 신뢰구간)`)
  console.log(`  3개 이상  : ${win}건 (${((win / n) * 100).toFixed(3)}%)`)
  console.log(`  분포      : ${dist.map((c, k) => `${k}개 ${c}`).join(" / ")}`)
  return { mean, se, win, n }
}

const main = async () => {
  const res = await fetch(`${url}/rest/v1/winning_numbers?select=*&order=drawNo.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const all: WinningLottoNumbers[] = await res.json()

  const train = all.filter((d) => d.drawNo <= TRAIN_UNTIL)
  const test = all.filter((d) => d.drawNo > TRAIN_UNTIL)

  console.log(`학습: 1~${TRAIN_UNTIL}회 (${train.length}건)`)
  console.log(`평가: ${TRAIN_UNTIL + 1}~${all.at(-1)!.drawNo}회 (${test.length}건)`)
  console.log(`\n이론 기대값: 평균 적중 ${(PICK_COUNT * PICK_COUNT / 45).toFixed(4)}개, 3개 이상 1.7650%`)

  const t0 = performance.now()
  const engine = buildEngine(train)
  console.log(`\n학습 ${Math.round(performance.now() - t0)}ms · 검증 정확도 ${(engine.stats.accuracy * 100).toFixed(1)}%`)

  const engineMatches: number[] = []
  const randomMatches: number[] = []

  const started = performance.now()
  for (const draw of test) {
    for (let i = 0; i < PER_DRAW; i++) {
      engineMatches.push(matchDraw(engine.recommend().numbers, draw).matchCount)
      randomMatches.push(matchDraw(pickUnique(ALL_NUMBERS, PICK_COUNT), draw).matchCount)
    }
  }
  console.log(`추천 ${engineMatches.length.toLocaleString()}건 생성에 ${Math.round(performance.now() - started)}ms`)

  const a = summarize("엔진 추천", engineMatches, test.length)
  const b = summarize("무작위", randomMatches, test.length)

  // 두 평균 차이의 유의성 (독립 표본 z 근사)
  const diff = a.mean - b.mean
  const seDiff = Math.sqrt(a.se ** 2 + b.se ** 2)
  const z = diff / seDiff

  console.log(`\n=== 엔진 - 무작위 ===`)
  console.log(`  평균 차이: ${diff.toFixed(4)} (표준오차 ${seDiff.toFixed(4)}, z = ${z.toFixed(2)})`)
  console.log(`  판정: ${Math.abs(z) < 1.96 ? "차이 없음 (95% 수준에서 유의하지 않음)" : "유의한 차이"}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
