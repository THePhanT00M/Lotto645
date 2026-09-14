import { compareWithRandom, EXPECTED_MATCHED, tallyByDraw, WIN_PROBABILITY, type ScoredPick } from "@/lib/lotto/baseline"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { buildEngine } from "@/lib/lotto/engine"
import { fitPopularity } from "@/lib/lotto/popularity"
import { crowdLogRatio, firstPrizeShare, fromPrizeRow, type DrawPrizeRow } from "@/lib/lotto/prizes"
import { pickUnique } from "@/lib/lotto/random"
import { matchDraw } from "@/lib/lotto/rank"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/**
 * 엔진 백테스트
 *
 * 1~TRAIN_UNTIL 회만 안다고 가정하고 엔진을 세운 뒤, 그 뒤 회차로 두 가지를 잰다.
 *   1. 적중: 엔진 추천과 무작위 조합의 평균 적중 개수. 엔진은 적중을 목표로 하지 않는다.
 *   2. 인기: 평가 회차의 당첨 조합을 예측 인기 5분위로 나눠 1등 당첨자 ÷ 기대 인원을 보고,
 *      엔진 추천이 무작위 조합 가운데 어디쯤 놓이는지 본다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** 회차당 만들 조합 수 */
const PER_DRAW = 5

/** 이 회차까지만 알고 있다고 가정한다. 인기 모델을 고를 때 쓴 학습 구간과 같다. */
const TRAIN_UNTIL = 900

const PAGE_SIZE = 1000

const fetchAll = async <T,>(path: string): Promise<T[]> => {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + PAGE_SIZE - 1}` },
    })
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
    const page: T[] = await res.json()
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

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
  const all = await fetchAll<WinningLottoNumbers>("winning_numbers?select=*&order=drawNo.asc")
  const prizes = (await fetchAll<DrawPrizeRow>("draw_prizes?select=*&order=draw_no.asc")).map(fromPrizeRow)

  if (prizes.length === 0) {
    console.warn("draw_prizes 가 비어 있습니다. pnpm draw-prizes:backfill 을 먼저 실행하세요.")
  }

  const train = all.filter((d) => d.drawNo <= TRAIN_UNTIL)
  const test = all.filter((d) => d.drawNo > TRAIN_UNTIL)
  const trainPrizes = prizes.filter((p) => p.drawNo <= TRAIN_UNTIL)

  console.log(`학습: 1~${TRAIN_UNTIL}회 (${train.length}건, 당첨자 수 ${trainPrizes.length}건)`)
  console.log(`평가: ${TRAIN_UNTIL + 1}~${all.at(-1)!.drawNo}회 (${test.length}건)`)
  console.log(`\n이론 기대값: 평균 적중 ${EXPECTED_MATCHED.toFixed(4)}개, 3개 이상 ${(WIN_PROBABILITY * 100).toFixed(4)}%`)

  const t0 = performance.now()
  const engine = buildEngine(train, trainPrizes)
  const { validation } = engine.stats
  console.log(`\n학습 ${Math.round(performance.now() - t0)}ms · 인기 모델 ${engine.stats.trainedDraws}회차`)
  if (validation) {
    console.log(`  학습 구간 안 검증 (최근 ${validation.draws}회): 상관 ${validation.correlation.toFixed(3)}, 비인기 ${validation.quietDraws}회 1등 ${validation.quietShare.toFixed(3)}배 / 전체 ${validation.allShare.toFixed(3)}배`)
  }

  const engineMatches: number[] = []
  const enginePicks: ScoredPick[] = []
  const randomMatches: number[] = []
  const percentiles: number[] = []

  const started = performance.now()
  for (const draw of test) {
    for (let i = 0; i < PER_DRAW; i++) {
      const recommendation = engine.recommend()
      const match = matchDraw(recommendation.numbers, draw)
      engineMatches.push(match.matchCount)
      enginePicks.push({ draw_no: draw.drawNo, numbers: recommendation.numbers, matched_count: match.matchCount, prize_rank: match.rank })
      if (recommendation.popularityPercentile !== null) percentiles.push(recommendation.popularityPercentile)
      randomMatches.push(matchDraw(pickUnique(ALL_NUMBERS, PICK_COUNT), draw).matchCount)
    }
  }
  console.log(`추천 ${engineMatches.length.toLocaleString()}건 생성에 ${Math.round(performance.now() - started)}ms`)

  // 1. 적중. 엔진 추천은 같은 번호에 몰려 한 회차 안에서 함께 오르내리므로, 독립을 가정한 z 로는
  // 오차가 작게 잡힌다. 번호 쏠림까지 반영한 무작위 범위로 판정한다. (lib/lotto/baseline.ts)
  summarize("엔진 추천", engineMatches, test.length)
  summarize("무작위", randomMatches, test.length)

  const band = compareWithRandom(tallyByDraw(enginePicks))
  if (band) {
    const verdict = band.verdict === "within" ? "무작위와 차이 없음" : band.verdict === "above" ? "무작위보다 높음" : "무작위보다 낮음"
    console.log(`\n=== 적중: 엔진 추천 ===`)
    console.log(`  평균 ${band.mean.toFixed(4)} · 쏠림 반영 무작위 95% 범위 ${band.low.toFixed(3)}~${band.high.toFixed(3)} → ${verdict}`)
    console.log("  한 번 돌린 결과는 추천을 새로 뽑을 때마다 흔들린다. 판정이 갈리면 여러 번 돌려 본다.")
  }

  // 2. 인기
  const numbersByDraw = new Map(all.map((d) => [d.drawNo, d.numbers]))
  const pairs = (list: typeof prizes) =>
      list.filter((p) => numbersByDraw.has(p.drawNo)).map((prize) => ({ prize, numbers: numbersByDraw.get(prize.drawNo)! }))

  const model = fitPopularity(pairs(trainPrizes).map(({ prize, numbers }) => ({ numbers, target: crowdLogRatio(prize, 3) })))
  if (!model) {
    console.log("\n인기 모델을 세우지 못했습니다.")
    return
  }

  const scored = pairs(prizes.filter((p) => p.drawNo > TRAIN_UNTIL))
      .map((pair) => ({ ...pair, predicted: model.predict(pair.numbers) }))
      .sort((x, y) => x.predicted - y.predicted)

  console.log(`\n=== 인기: 평가 ${scored.length}회차 당첨 조합을 예측 인기 5분위로 — 1등 당첨자 ÷ 기대 인원 ===`)
  for (let q = 0; q < 5; q++) {
    const part = scored.slice(Math.floor((q * scored.length) / 5), Math.floor(((q + 1) * scored.length) / 5))
    const winners = part.reduce((sum, x) => sum + x.prize.winners[0], 0)
    console.log(`  ${q + 1}분위${q === 0 ? " (비인기)" : q === 4 ? " (인기)  " : "         "} ${firstPrizeShare(part.map((x) => x.prize)).toFixed(3)}배 (${winners}명)`)
  }

  if (percentiles.length > 0) {
    const mean = percentiles.reduce((s, v) => s + v, 0) / percentiles.length
    const max = Math.max(...percentiles)
    console.log(`\n엔진 추천의 예측 백분위: 평균 ${(mean * 100).toFixed(1)}%, 최대 ${(max * 100).toFixed(1)}% (무작위 조합이면 평균 50%)`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
