import { encryptPhone, isEncryptedPhone } from "@/lib/profile/phone"

/**
 * 이미 담긴 연락처를 감싼다
 *
 * 연락처 암호화를 넣기 전에 저장된 값은 표에 그대로 들어 있다. 읽을 때는
 * 그대로 읽어 주도록 해 두었으므로 화면은 멀쩡하지만, 표에는 계속 남는다.
 * 한 번 돌려 정리한다. 이미 감싼 값은 건너뛰므로 여러 번 돌려도 된다.
 *
 *   node scripts/run.mjs scripts/encrypt-phone-numbers.ts
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

const main = async () => {
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_KEY 가 필요합니다.")

  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }

  const response = await fetch(`${url}/rest/v1/profiles?select=id,phone_number&phone_number=not.is.null`, { headers })
  if (!response.ok) throw new Error(`목록을 읽지 못했습니다: ${response.status}`)

  const rows: { id: string; phone_number: string }[] = await response.json()
  const targets = (Array.isArray(rows) ? rows : []).filter((row) => !isEncryptedPhone(row.phone_number))

  console.log(`연락처가 있는 회원 ${rows.length}명 중 감쌀 대상 ${targets.length}명`)

  for (const row of targets) {
    const patch = await fetch(`${url}/rest/v1/profiles?id=eq.${row.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ phone_number: encryptPhone(row.phone_number) }),
    })

    if (!patch.ok) {
      console.error(`  ${row.id} 실패: ${patch.status} ${await patch.text()}`)
      continue
    }

    console.log(`  ${row.id} 완료`)
  }

  console.log("끝났습니다.")
}

void main()
