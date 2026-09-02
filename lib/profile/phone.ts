import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * 연락처 암호화
 *
 * 전화번호는 새어 나가면 되돌릴 수 없는 개인정보라 표에 그대로 담지 않는다.
 * 서버에서만 풀 수 있도록 AES-256-GCM 으로 감싸 두고, 화면에 보일 때만 푼다.
 * GCM 은 함께 붙는 태그로 값이 손대졌는지도 가려낸다.
 *
 * 열쇠는 PROFILE_ENCRYPTION_KEY 환경 변수에 둔다(32바이트를 base64 로).
 * 배포 환경과 같은 값이어야 하며, 바뀌면 이미 담긴 값을 풀 수 없다.
 *
 *   저장 형태 : enc1.<iv>.<태그>.<암호문>   (모두 base64url)
 *
 * 앞자리를 보고 감싼 값인지 알 수 있어, 이 기능 이전에 그대로 담긴 값도
 * 그대로 읽어 준다. 다음에 저장할 때 감싸인다.
 */

const PREFIX = "enc1"
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

/** 이미 감싸 둔 값인지 */
export const isEncryptedPhone = (value: string): boolean => value.startsWith(`${PREFIX}.`)

/**
 * 저장할 형태로 감싼다.
 *
 * 열쇠가 없으면 던진다. 조용히 그대로 담으면 감싼 줄 알고 지나가게 된다.
 * 던지는 말은 화면까지 그대로 나가므로, 설정 이름은 서버 기록에만 남긴다.
 */
export const encryptPhone = (value: string | null): string | null => {
  if (!value) return null

  const key = readKey()
  if (!key) {
    console.error("PROFILE_ENCRYPTION_KEY 가 없거나 32바이트가 아닙니다.")
    throw new Error("연락처를 저장할 수 없습니다. 잠시 후 다시 시도해주세요.")
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])

  return [
    PREFIX,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

/**
 * 화면에 보일 형태로 푼다.
 *
 * 풀지 못하면 빈 값으로 돌려준다. 화면 하나 때문에 프로필 전체가 막히면
 * 연락처와 상관없는 일까지 못 하게 된다.
 */
export const decryptPhone = (value: string | null): string | null => {
  if (!value) return null
  if (!isEncryptedPhone(value)) return value

  const key = readKey()
  if (!key) {
    console.error("PROFILE_ENCRYPTION_KEY 가 없어 연락처를 풀지 못했습니다.")
    return null
  }

  const parts = value.split(".")
  if (parts.length !== 4) {
    console.error("연락처 형식이 올바르지 않습니다.")
    return null
  }

  const [, iv, tag, encrypted] = parts

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))

    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8")
  } catch (error) {
    console.error("연락처를 풀지 못했습니다:", error instanceof Error ? error.message : error)
    return null
  }
}
