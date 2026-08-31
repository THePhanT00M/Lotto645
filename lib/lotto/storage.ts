import type { LottoResult } from "./types"

const STORAGE_KEY = "lotto_history"

/** localStorage에 보관하는 최대 기록 수 */
const MAX_ENTRIES = 50

/** 같은 번호 세트의 연속 저장으로 보는 시간(ms) */
const DUPLICATE_WINDOW_MS = 5_000

const isBrowser = () => typeof window !== "undefined"

/** 저장된 추첨 기록을 최신순으로 반환한다. */
export const getLottoHistory = (): LottoResult[] => {
  if (!isBrowser()) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as LottoResult[]) : []
  } catch (error) {
    console.error("추첨 기록을 읽지 못했습니다:", error)
    return []
  }
}

interface SaveOptions {
  isAiRecommended?: boolean
  /** 이 번호가 겨냥한 회차 */
  drawNo?: number
}

/**
 * 추첨 결과를 저장한다. 저장에 성공하면 true.
 *
 * 추첨 완료 이펙트가 여러 번 발화해도 같은 번호가 중복 저장되지 않도록
 * 최근 5초 안의 동일 조합은 건너뛴다.
 */
export const saveLottoResult = (
    numbers: number[],
    { isAiRecommended = false, drawNo }: SaveOptions = {},
): boolean => {
  if (!isBrowser()) return false

  const history = getLottoHistory()
  const now = Date.now()

  const isDuplicate = history.some(
      (item) => now - item.timestamp < DUPLICATE_WINDOW_MS && hasSameNumbers(item.numbers, numbers),
  )
  if (isDuplicate) return false

  const entry: LottoResult = {
    id: createId(),
    numbers: [...numbers],
    timestamp: now,
    isAiRecommended,
    drawNo,
  }

  return write([entry, ...history].slice(0, MAX_ENTRIES))
}

/** 기록 한 건을 삭제한다. 대상이 없으면 false. */
export const deleteLottoResult = (id: string): boolean => {
  if (!isBrowser()) return false

  const history = getLottoHistory()
  const remaining = history.filter((item) => item.id !== id)
  if (remaining.length === history.length) return false

  return write(remaining)
}

/** 저장된 기록을 모두 지운다. */
export const clearLottoHistory = (): void => {
  if (!isBrowser()) return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("추첨 기록을 비우지 못했습니다:", error)
  }
}

const write = (history: LottoResult[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return true
  } catch (error) {
    console.error("추첨 기록을 저장하지 못했습니다:", error)
    return false
  }
}

const hasSameNumbers = (a: readonly number[], b: readonly number[]): boolean => {
  if (a.length !== b.length) return false

  const sortedA = [...a].sort((x, y) => x - y)
  const sortedB = [...b].sort((x, y) => x - y)
  return sortedA.every((value, index) => value === sortedB[index])
}

const createId = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
