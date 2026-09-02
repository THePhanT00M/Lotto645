import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * 서버에서만 풀 수 있게 값을 감싼다
 *
 * AES-256-GCM 으로 감싸므로 내용이 드러나지 않고, 함께 붙는 태그로 값이
 * 손대졌는지도 가려낸다. 열쇠는 PROFILE_ENCRYPTION_KEY 환경 변수에 둔다
 * (32바이트를 base64 로). 배포 환경과 같은 값이어야 한다.
 *
 *   감싼 형태 : <꼬리표>.<iv>.<태그>.<암호문>   (모두 base64url)
 *
 * 꼬리표는 쓰임새마다 달리 준다. 연락처로 감싼 값을 다른 곳에 들이밀어도
 * 통하지 않게 하려는 것이고, 감싸기 전에 담긴 값과도 구분된다.
 */

const ALGORITHM = "aes-256-gcm"

/** GCM 이 권하는 길이 */
const IV_BYTES = 12

const KEY_BYTES = 32

const readKey = (): Buffer | null => {
  const raw = process.env.PROFILE_ENCRYPTION_KEY
  if (!raw) return null

  const key = Buffer.from(raw, "base64")
  return key.length === KEY_BYTES ? key : null
}

/** 그 꼬리표로 감싼 값인지 */
export const isSealed = (value: string, label: string): boolean => value.startsWith(`${label}.`)

/**
 * 감싼다.
 *
 * 열쇠가 없으면 던진다. 조용히 그대로 두면 감싼 줄 알고 지나가게 된다.
 * 던지는 말은 화면까지 나갈 수 있어, 설정 이름은 서버 기록에만 남긴다.
 */
export const seal = (value: string, label: string): string => {
  const key = readKey()
  if (!key) {
    console.error("PROFILE_ENCRYPTION_KEY 가 없거나 32바이트가 아닙니다.")
    throw new Error("처리하지 못했습니다. 잠시 후 다시 시도해주세요.")
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])

  return [label, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")]
      .join(".")
}

/** 푼다. 열쇠가 없거나 값이 손대졌으면 null. */
export const unseal = (value: string, label: string): string | null => {
  if (!isSealed(value, label)) return null

  const key = readKey()
  if (!key) {
    console.error("PROFILE_ENCRYPTION_KEY 가 없어 값을 풀지 못했습니다.")
    return null
  }

  const parts = value.split(".")
  if (parts.length !== 4) return null

  const [, iv, tag, encrypted] = parts

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))

    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8")
  } catch (error) {
    console.error("값을 풀지 못했습니다:", error instanceof Error ? error.message : error)
    return null
  }
}
