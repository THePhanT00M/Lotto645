import type { LottoResult } from "@/types/lotto"

const STORAGE_KEY = "lotto_history"

// 두 번호 배열이 동일한지 확인하는 함수
const areNumbersEqual = (numbers1: number[], numbers2: number[]): boolean => {
  if (numbers1.length !== numbers2.length) return false

  // 두 배열을 정렬하여 비교
  const sorted1 = [...numbers1].sort((a, b) => a - b)
  const sorted2 = [...numbers2].sort((a, b) => a - b)

  return sorted1.every((num, index) => num === sorted2[index])
}

// 이미 동일한 번호 세트가 저장되어 있는지 확인하는 함수
const isDuplicateNumbers = (numbers: number[], history: LottoResult[]): boolean => {
  // 최근 10개의 결과만 확인 (성능 최적화)
  const recentHistory = history.slice(0, 10)

  return recentHistory.some((result) => areNumbersEqual(result.numbers, numbers))
}

// Save a new lotto result to localStorage
export const saveLottoResult = (numbers: number[], isAiRecommended?: boolean): boolean => {
  // Skip if not in browser environment
  if (typeof window === "undefined") return false

  const history = getLottoHistory()

  // 중복 번호 세트 확인 (최근 5초 이내에 저장된 동일한 호 세트가 있는지)
  const currentTime = Date.now()
  const recentDuplicate = history.find((result) => {
    return areNumbersEqual(result.numbers, numbers) && currentTime - result.timestamp < 5000 // 5초 이내
  })

  // 최근 5초 이내에 동일한 번호 세트가 저장되었다면 저장하지 않음
  if (recentDuplicate) {
    console.log("중복 번호 세트 감지: 저장하지 않음", numbers)
    return false
  }

  const newResult: LottoResult = {
    id: generateId(),
    numbers: [...numbers],
    timestamp: Date.now(),
    isAiRecommended: isAiRecommended || false,
  }

  history.unshift(newResult) // Add to the beginning of the array

  // Limit history to 50 entries
  const limitedHistory = history.slice(0, 50)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    return true
  } catch (error) {
    console.error("Failed to save lotto history:", error)
    return false
  }
}

// Get all lotto history from localStorage
export const getLottoHistory = (): LottoResult[] => {
  if (typeof window === "undefined") return []

  const historyJson = localStorage.getItem(STORAGE_KEY)
  if (!historyJson) return []

  try {
    return JSON.parse(historyJson)
  } catch (error) {
    console.error("Failed to parse lotto history:", error)
    return []
  }
}

// Update a specific lotto result (for adding/editing memos)
export const updateLottoResult = (id: string, updates: Partial<LottoResult>): boolean => {
  if (typeof window === "undefined") return false

  const history = getLottoHistory()
  const index = history.findIndex((item) => item.id === id)

  if (index === -1) return false

  // Update the item with the new values
  history[index] = { ...history[index], ...updates }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return true
  } catch (error) {
    console.error("Failed to update lotto history:", error)
    return false
  }
}

// Delete a specific lotto result by ID
export const deleteLottoResult = (id: string): boolean => {
  if (typeof window === "undefined") return false

  const history = getLottoHistory()
  const filteredHistory = history.filter((item) => item.id !== id)

  // If no items were removed, return false
  if (filteredHistory.length === history.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory))
    return true
  } catch (error) {
    console.error("Failed to update lotto history:", error)
    return false
  }
}

// Clear all lotto history
export const clearLottoHistory = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear lotto history:", error)
  }
}

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
