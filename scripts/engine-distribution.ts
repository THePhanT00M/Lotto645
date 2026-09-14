import { buildEngine } from "@/lib/lotto/engine"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { fromPrizeRow, type DrawPrizeRow } from "@/lib/lotto/prizes"
import { pickUnique } from "@/lib/lotto/random"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/**
 * 번호별 사용량 진단
 *
 * 실제 당첨 번호·무작위 조합·엔진 추천에서 번호가 고르게 쓰이는지 카이제곱으로 본다.
 * 엔진은 사람들이 덜 사는 번호 쪽으로 기울도록 만들었으므로 치우침이 나오는 것이 정상이다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

const report = (label: string, sets: number[][]) => {
  const counts = new Array(46).fill(0)
  for (const nums of sets) for (const n of nums) counts[n]++

  const total = sets.length * PICK_COUNT
  const expected = total / 45
  let chi = 0
  for (let n = 1; n <= 45; n++) chi += (counts[n] - expected) ** 2 / expected

  const low = counts.slice(1, 32).reduce((a, b) => a + b, 0) / total
  const sorted = ALL_NUMBERS.map((n) => ({ n, c: counts[n] })).sort((a, b) => b.c - a.c)

  console.log(`\n[${label}] ${sets.length.toLocaleString()}건`)
  console.log(`  카이제곱 ${chi.toFixed(1)} (임계 60.5) → ${chi > 60.5 ? "치우침 있음" : "균등과 구분 안 됨"}`)
  console.log(`  1~31 비율 ${(low * 100).toFixed(2)}% (균등 68.89%)`)
  console.log(`  최다: ${sorted.slice(0, 6).map((x) => x.n).join(",")}  최소: ${sorted.slice(-6).map((x) => x.n).join(",")}`)
  return chi
}

const main = async () => {
  const draws = await fetchAll<WinningLottoNumbers>("winning_numbers?select=*&order=drawNo.asc")
  const prizes = (await fetchAll<DrawPrizeRow>("draw_prizes?select=*&order=draw_no.asc")).map(fromPrizeRow)

  report("실제 당첨 번호", draws.map((d) => d.numbers))
  report("무작위 생성", Array.from({ length: 2000 }, () => pickUnique(ALL_NUMBERS, PICK_COUNT)))

  const engine = buildEngine(draws, prizes)
  const recommendations = Array.from({ length: 400 }, () => engine.recommend().numbers)
  report(`엔진 추천 (인기 모델 ${engine.stats.trainedDraws}회차)`, recommendations)
}
main().catch((e) => { console.error(e); process.exit(1) })
