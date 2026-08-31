import { createDecoySet } from "@/lib/lotto/decoys"
import { featureVectorOf } from "@/lib/lotto/features"
import { meanVector, standardDeviation, standardize } from "@/lib/lotto/matrix"
import { trainNetwork } from "@/lib/lotto/neural"
import { applyCalibration, brierScore, fitCalibration } from "@/lib/lotto/calibration"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SEEDS = [11, 22, 33, 44, 55]

const main = async () => {
  const res = await fetch(`${url}/rest/v1/winning_numbers?select=*&order=drawNo.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const draws: WinningLottoNumbers[] = await res.json()

  const raw = draws.map((d) => featureVectorOf(d.numbers))
  const mean = meanVector(raw)
  const sd = standardDeviation(raw, mean)
  const positives = raw.map((r) => standardize(r, mean, sd))
  const negatives = createDecoySet(2500).map((n) => standardize(featureVectorOf(n), mean, sd))

  // 검증 몫을 고정해 설정 간 비교가 같은 데이터 위에서 이뤄지게 한다
  const cut = <T,>(rows: T[]) => ({ train: rows.slice(Math.floor(rows.length * 0.2)), valid: rows.slice(0, Math.floor(rows.length * 0.2)) })
  const P = cut(positives)
  const N = cut(negatives)
  const validInputs = [...P.valid, ...N.valid]
  const validLabels = [...P.valid.map(() => 1), ...N.valid.map(() => 0)]

  console.log(`학습 ${P.train.length + N.train.length}건 / 검증 ${validInputs.length}건\n`)
  console.log("설정".padEnd(22), "정확도", "  Brier(보정후)", " 시간")

  for (const epochs of [10, 15, 20, 25, 30, 35]) {
    for (const label of ["기본"]) {
      const t0 = performance.now()
      const results = SEEDS.map((seed) => {
        const net = trainNetwork(P.train, N.train, { seed, epochs, validationRatio: 0 })
        const preds = validInputs.map((v) => net.predict(v))
        const cal = fitCalibration(preds, validLabels)
        return {
          acc: preds.filter((p, i) => (p >= 0.5 ? 1 : 0) === validLabels[i]).length / preds.length,
          brier: brierScore(preds.map((p) => applyCalibration(p, cal)), validLabels),
        }
      })
      const acc = results.reduce((a, r) => a + r.acc, 0) / results.length
      const brier = results.reduce((a, r) => a + r.brier, 0) / results.length
      const ms = (performance.now() - t0) / SEEDS.length

      console.log(
        `epochs=${epochs} ${label}`.padEnd(22),
        `${(acc * 100).toFixed(2)}%`,
        `  ${brier.toFixed(4)}`,
        `  ${Math.round(ms)}ms`,
      )
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
