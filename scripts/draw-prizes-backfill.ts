import { prizeFromApi, toPrizeRow, type LottoApiItem } from "@/lib/lotto/prizes"

/**
 * draw_prizes 채우기
 *
 * 동행복권 공개 조회에서 회차별 등수 당첨자 수·판매액을 받아 draw_prizes 에 넣는다.
 * 이미 들어 있는 회차는 받은 값으로 덮어쓴다. 100회차씩 받고 요청 사이 1초를 둔다.
 *
 *   pnpm draw-prizes:backfill
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

const LOTTO_API = "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do"
const STEP = 100
const PAUSE_MS = 1000

const main = async () => {
  if (!url || !serviceKey) throw new Error(".env 에 NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_KEY 가 있어야 합니다.")

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  const latestResponse = await fetch(`${url}/rest/v1/winning_numbers?select=drawNo&order=drawNo.desc&limit=1`, { headers })
  const latest: { drawNo: number }[] = await latestResponse.json()
  const lastDrawNo = latest[0]?.drawNo ?? 0

  let saved = 0
  for (let from = 1; from <= lastDrawNo; from += STEP) {
    const to = Math.min(lastDrawNo, from + STEP - 1)

    const response = await fetch(`${LOTTO_API}?srchStrLtEpsd=${from}&srchEndLtEpsd=${to}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    if (!response.ok) throw new Error(`동행복권 ${from}~${to}회 조회 실패: ${response.status}`)

    const payload = await response.json()
    const list: LottoApiItem[] = Array.isArray(payload?.data?.list) ? payload.data.list : []
    const rows = list.map((item) => toPrizeRow(prizeFromApi(item)))

    if (rows.length > 0) {
      const upsert = await fetch(`${url}/rest/v1/draw_prizes?on_conflict=draw_no`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      })
      if (!upsert.ok) throw new Error(`draw_prizes 저장 실패 (${from}~${to}회): ${upsert.status} ${await upsert.text()}`)
    }

    saved += rows.length
    console.log(`${from}~${to}회: ${rows.length}건`)
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
  }

  console.log(`총 ${saved}건 저장 (1~${lastDrawNo}회)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
