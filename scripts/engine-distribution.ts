import { createDecoySet } from "@/lib/lotto/decoys"
import { buildEngine } from "@/lib/lotto/engine"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { pickUnique } from "@/lib/lotto/random"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
  const res = await fetch(`${url}/rest/v1/winning_numbers?select=*&order=drawNo.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const draws: WinningLottoNumbers[] = await res.json()

  report("실제 당첨 번호", draws.map((d) => d.numbers))
  report("무작위 생성", Array.from({ length: 2000 }, () => pickUnique(ALL_NUMBERS, PICK_COUNT)))
  report("decoy(반대편 예시)", createDecoySet(2500))

  const engine = buildEngine(draws)
  const recommendations = Array.from({ length: 400 }, () => engine.recommend().numbers)
  report("엔진 추천", recommendations)
}
main().catch((e) => { console.error(e); process.exit(1) })
