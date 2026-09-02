import { isSealed, seal, unseal } from "@/lib/crypto/seal"

/**
 * 연락처 암호화
 *
 * 전화번호는 새어 나가면 되돌릴 수 없는 개인정보라 표에 그대로 담지 않는다.
 * 서버에서만 풀 수 있게 감싸 두고, 화면에 보일 때만 푼다.
 *
 * 꼬리표를 보고 감싼 값인지 알 수 있어, 이 기능 이전에 그대로 담긴 값도
 * 그대로 읽어 준다. 다음에 저장할 때 감싸인다.
 */

const LABEL = "enc1"

/** 이미 감싸 둔 값인지 */
export const isEncryptedPhone = (value: string): boolean => isSealed(value, LABEL)

/** 저장할 형태로 감싼다. */
export const encryptPhone = (value: string | null): string | null => (value ? seal(value, LABEL) : null)

/**
 * 화면에 보일 형태로 푼다.
 *
 * 풀지 못하면 빈 값으로 돌려준다. 화면 하나 때문에 프로필 전체가 막히면
 * 연락처와 상관없는 일까지 못 하게 된다.
 */
export const decryptPhone = (value: string | null): string | null => {
  if (!value) return null
  if (!isEncryptedPhone(value)) return value

  return unseal(value, LABEL)
}
