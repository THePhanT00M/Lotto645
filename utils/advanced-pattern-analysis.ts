import { winningNumbers } from "@/data/winning-numbers"

// 소수 판별 함수
function isPrime(num: number): boolean {
  if (num < 2) return false
  if (num === 2) return true
  if (num % 2 === 0) return false

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false
  }
  return true
}

// 피보나치 수 판별 (45 이하)
const fibonacciNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34]
function isFibonacci(num: number): boolean {
  return fibonacciNumbers.includes(num)
}

// 완전제곱수 판별
function isPerfectSquare(num: number): boolean {
  const sqrt = Math.sqrt(num)
  return sqrt === Math.floor(sqrt)
}

// 요일별 패턴 분석
export function analyzeDayOfWeekPatterns(): number[] {
  const dayWeights = Array(45).fill(0)
  const dayCounts = Array(7).fill(0) // 0=일요일, 1=월요일, ...

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const dayOfWeek = date.getDay()
    dayCounts[dayOfWeek]++

    draw.numbers.forEach((num) => {
      dayWeights[num - 1] += 1 / dayCounts[dayOfWeek] // 요일별 가중치
    })
  })

  // 정규화
  const maxWeight = Math.max(...dayWeights)
  return dayWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 계절별 패턴 분석
export function analyzeSeasonalPatterns(): number[] {
  const seasonWeights = Array(45).fill(0)
  const seasonCounts = Array(4).fill(0) // 0=봄, 1=여름, 2=가을, 3=겨울

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth() + 1
    let season = 0

    if (month >= 3 && month <= 5)
      season = 0 // 봄
    else if (month >= 6 && month <= 8)
      season = 1 // 여름
    else if (month >= 9 && month <= 11)
      season = 2 // 가을
    else season = 3 // 겨울

    seasonCounts[season]++

    draw.numbers.forEach((num) => {
      seasonWeights[num - 1] += 1 / seasonCounts[season]
    })
  })

  // 정규화
  const maxWeight = Math.max(...seasonWeights)
  return seasonWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 월별 패턴 분석
export function analyzeMonthlyPatterns(): number[] {
  const monthWeights = Array(45).fill(0)
  const monthCounts = Array(12).fill(0)

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth()
    monthCounts[month]++

    draw.numbers.forEach((num) => {
      monthWeights[num - 1] += 1 / monthCounts[month]
    })
  })

  // 정규화
  const maxWeight = Math.max(...monthWeights)
  return monthWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 피보나치 패턴 분석
export function analyzeFibonacciPatterns(numbers: number[]): number {
  const fibCount = numbers.filter((num) => isFibonacci(num)).length
  return fibCount / numbers.length
}

// 소수 패턴 분석
export function analyzePrimePatterns(numbers: number[]): number {
  const primeCount = numbers.filter((num) => isPrime(num)).length
  return primeCount / numbers.length
}

// 완전제곱수 패턴 분석
export function analyzePerfectSquarePatterns(numbers: number[]): number {
  const squareCount = numbers.filter((num) => isPerfectSquare(num)).length
  return squareCount / numbers.length
}

// 대칭 패턴 분석 (번호의 대칭성)
export function analyzeSymmetryPatterns(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let symmetryScore = 0

  for (let i = 0; i < sortedNumbers.length / 2; i++) {
    const left = sortedNumbers[i]
    const right = sortedNumbers[sortedNumbers.length - 1 - i]
    const center = 23 // 1-45의 중앙값

    const leftDistance = Math.abs(left - center)
    const rightDistance = Math.abs(right - center)

    if (Math.abs(leftDistance - rightDistance) <= 2) {
      symmetryScore += 1
    }
  }

  return symmetryScore / Math.floor(numbers.length / 2)
}

// 등차수열 패턴 분석
export function analyzeArithmeticSequencePatterns(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let maxSequenceLength = 1
  let currentLength = 1
  let commonDiff = 0

  for (let i = 1; i < sortedNumbers.length; i++) {
    const diff = sortedNumbers[i] - sortedNumbers[i - 1]

    if (currentLength === 1) {
      commonDiff = diff
      currentLength = 2
    } else if (diff === commonDiff) {
      currentLength++
    } else {
      maxSequenceLength = Math.max(maxSequenceLength, currentLength)
      commonDiff = diff
      currentLength = 2
    }
  }

  maxSequenceLength = Math.max(maxSequenceLength, currentLength)
  return maxSequenceLength / numbers.length
}

// 클러스터 패턴 분석 (번호를 5개 구간으로 나누어 분석)
export function analyzeClusterPatterns(numbers: number[]): number[] {
  const clusters = Array(5).fill(0) // 5개 클러스터

  numbers.forEach((num) => {
    const clusterIndex = Math.min(Math.floor((num - 1) / 9), 4)
    clusters[clusterIndex]++
  })

  return clusters.map((count) => count / numbers.length)
}

// 번호 선호도 계산 (전체 당첨 빈도 기반)
export function calculateNumberPreferences(): number[] {
  const preferences = Array(45).fill(0)
  const totalDraws = winningNumbers.length

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      preferences[num - 1]++
    })
  })

  // 정규화 (0-1 범위)
  const maxPreference = Math.max(...preferences)
  return preferences.map((pref) => (maxPreference > 0 ? pref / maxPreference : 0))
}

// 거리 패턴 분석 (번호 간 평균 거리)
export function analyzeDistancePatterns(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let totalDistance = 0

  for (let i = 1; i < sortedNumbers.length; i++) {
    totalDistance += sortedNumbers[i] - sortedNumbers[i - 1]
  }

  const avgDistance = totalDistance / (sortedNumbers.length - 1)
  return avgDistance / 44 // 정규화 (최대 가능 거리는 44)
}

// 분산 패턴 분석
export function analyzeVariancePatterns(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length

  // 정규화 (최대 가능 분산 추정)
  const maxVariance = Math.pow(45 - 1, 2) / 4 // 대략적인 최대 분산
  return Math.min(variance / maxVariance, 1)
}

// 유사도 패턴 분석 (최근 당첨번호와의 유사성)
export function analyzeSimilarityPatterns(numbers: number[]): number {
  if (winningNumbers.length === 0) return 0

  const recentDraws = winningNumbers.slice(-10) // 최근 10회
  let maxSimilarity = 0

  recentDraws.forEach((draw) => {
    const intersection = numbers.filter((num) => draw.numbers.includes(num))
    const similarity = intersection.length / 6
    maxSimilarity = Math.max(maxSimilarity, similarity)
  })

  return maxSimilarity
}

// 조합 빈도 분석
export function analyzeCombinationFrequency(numbers: number[]): number {
  let totalFrequency = 0
  let pairCount = 0

  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const num1 = numbers[i]
      const num2 = numbers[j]

      // 이 두 번호가 함께 나온 횟수 계산
      let pairFrequency = 0
      winningNumbers.forEach((draw) => {
        if (draw.numbers.includes(num1) && draw.numbers.includes(num2)) {
          pairFrequency++
        }
      })

      totalFrequency += pairFrequency
      pairCount++
    }
  }

  if (pairCount === 0) return 0
  const avgFrequency = totalFrequency / pairCount
  return avgFrequency / winningNumbers.length // 정규화
}

// 트렌드 패턴 분석 (최근 상승/하락 추세)
export function analyzeTrendPatterns(): number[] {
  const trends = Array(45).fill(0)
  const recentWindow = 20 // 최근 20회

  if (winningNumbers.length < recentWindow) return trends

  for (let num = 1; num <= 45; num++) {
    const recentDraws = winningNumbers.slice(-recentWindow)
    const oldDraws = winningNumbers.slice(-recentWindow * 2, -recentWindow)

    const recentCount = recentDraws.filter((draw) => draw.numbers.includes(num)).length
    const oldCount = oldDraws.filter((draw) => draw.numbers.includes(num)).length

    // 트렌드 계산 (양수: 상승, 음수: 하락)
    const trend = (recentCount - oldCount) / recentWindow
    trends[num - 1] = trend
  }

  return trends
}

// 배수 패턴 분석
export function analyzeMultiplePatterns(numbers: number[], divisor: number): number {
  const multipleCount = numbers.filter((num) => num % divisor === 0).length
  return multipleCount / numbers.length
}

// 끝자리 엔트로피 분석
export function analyzeDigitEntropy(numbers: number[]): number {
  const lastDigits = numbers.map((num) => num % 10)
  const digitCounts = Array(10).fill(0)

  lastDigits.forEach((digit) => {
    digitCounts[digit]++
  })

  // 엔트로피 계산
  let entropy = 0
  digitCounts.forEach((count) => {
    if (count > 0) {
      const probability = count / numbers.length
      entropy -= probability * Math.log2(probability)
    }
  })

  // 정규화 (최대 엔트로피는 log2(10))
  return entropy / Math.log2(10)
}

// 로또 용지 위치 패턴 분석 (7x7 그리드 가정)
export function analyzeLottoGridPatterns(numbers: number[]): number[] {
  const gridFeatures = []

  // 행별 분포
  const rowCounts = Array(7).fill(0)
  numbers.forEach((num) => {
    const row = Math.floor((num - 1) / 7)
    if (row < 7) rowCounts[row]++
  })
  gridFeatures.push(...rowCounts.map((count) => count / numbers.length))

  // 열별 분포
  const colCounts = Array(7).fill(0)
  numbers.forEach((num) => {
    const col = (num - 1) % 7
    colCounts[col]++
  })
  gridFeatures.push(...colCounts.map((count) => count / numbers.length))

  // 대각선 패턴
  let mainDiagonal = 0
  let antiDiagonal = 0
  numbers.forEach((num) => {
    const row = Math.floor((num - 1) / 7)
    const col = (num - 1) % 7
    if (row === col) mainDiagonal++
    if (row + col === 6) antiDiagonal++
  })
  gridFeatures.push(mainDiagonal / numbers.length)
  gridFeatures.push(antiDiagonal / numbers.length)

  return gridFeatures
}

// 음력 패턴 분석 (간단한 음력 주기 근사)
export function analyzeLunarPatterns(): number[] {
  const lunarWeights = Array(45).fill(0)
  const lunarCycle = 29.5 // 음력 주기 (일)

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24))
    const lunarPhase = (daysSinceEpoch % lunarCycle) / lunarCycle

    draw.numbers.forEach((num) => {
      lunarWeights[num - 1] += Math.sin(2 * Math.PI * lunarPhase)
    })
  })

  // 정규화
  const maxWeight = Math.max(...lunarWeights.map(Math.abs))
  return lunarWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 공휴일 효과 분석 (간단한 구현)
export function analyzeHolidayEffects(): number[] {
  const holidayWeights = Array(45).fill(0)

  // 주요 공휴일 날짜들 (월-일 형식)
  const holidays = ["01-01", "03-01", "05-05", "06-06", "08-15", "10-03", "10-09", "12-25"]

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const isHoliday = holidays.includes(monthDay)

    if (isHoliday) {
      draw.numbers.forEach((num) => {
        holidayWeights[num - 1] += 1
      })
    }
  })

  // 정규화
  const maxWeight = Math.max(...holidayWeights)
  return holidayWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}
