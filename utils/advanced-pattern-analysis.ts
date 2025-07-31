import { winningNumbers } from "@/data/winning-numbers"

// 1. 요일별 패턴 분석
export function analyzeDayOfWeekPatterns(): number[] {
  const dayPatterns = Array(7)
    .fill(0)
    .map(() => Array(45).fill(0))

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const dayOfWeek = date.getDay() // 0=일요일, 6=토요일

    draw.numbers.forEach((num) => {
      dayPatterns[dayOfWeek][num - 1]++
    })
  })

  // 현재 요일에 따른 번호별 가중치 반환
  const today = new Date().getDay()
  return dayPatterns[today].map((count) => count / winningNumbers.length)
}

// 2. 계절별 패턴 분석
export function analyzeSeasonalPatterns(): number[] {
  const seasonPatterns = Array(4)
    .fill(0)
    .map(() => Array(45).fill(0))

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth()
    const season = Math.floor(month / 3) // 0=봄, 1=여름, 2=가을, 3=겨울

    draw.numbers.forEach((num) => {
      seasonPatterns[season][num - 1]++
    })
  })

  // 현재 계절에 따른 번호별 가중치 반환
  const currentSeason = Math.floor(new Date().getMonth() / 3)
  return seasonPatterns[currentSeason].map((count) => count / winningNumbers.length)
}

// 3. 월별 패턴 분석
export function analyzeMonthlyPatterns(): number[] {
  const monthPatterns = Array(12)
    .fill(0)
    .map(() => Array(45).fill(0))

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth()

    draw.numbers.forEach((num) => {
      monthPatterns[month][num - 1]++
    })
  })

  // 현재 월에 따른 번호별 가중치 반환
  const currentMonth = new Date().getMonth()
  return monthPatterns[currentMonth].map((count) => count / winningNumbers.length)
}

// 4. 피보나치 수열 패턴
export function analyzeFibonacciPatterns(numbers: number[]): number {
  const fibNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34] // 45 이하 피보나치 수
  const fibCount = numbers.filter((num) => fibNumbers.includes(num)).length
  return fibCount / numbers.length
}

// 5. 소수 패턴 분석
export function analyzePrimePatterns(numbers: number[]): number {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]
  const primeCount = numbers.filter((num) => primes.includes(num)).length
  return primeCount / numbers.length
}

// 6. 완전제곱수 패턴
export function analyzePerfectSquarePatterns(numbers: number[]): number {
  const perfectSquares = [1, 4, 9, 16, 25, 36] // 45 이하 완전제곱수
  const squareCount = numbers.filter((num) => perfectSquares.includes(num)).length
  return squareCount / numbers.length
}

// 7. 대칭 패턴 분석 (번호판 대칭)
export function analyzeSymmetryPatterns(numbers: number[]): number {
  // 로또 번호판을 7x7 격자로 배치 (1-45번, 46-49는 사용하지 않음)
  // 1  2  3  4  5  6  7
  // 8  9  10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31 32 33 34 35
  // 36 37 38 39 40 41 42
  // 43 44 45

  // 수직 대칭 쌍들 (중앙 세로축 기준)
  const verticalSymmetryPairs = [
    // 첫 번째 줄
    [1, 7],
    [2, 6],
    [3, 5],
    // 두 번째 줄
    [8, 14],
    [9, 13],
    [10, 12],
    // 세 번째 줄
    [15, 21],
    [16, 20],
    [17, 19],
    // 네 번째 줄
    [22, 28],
    [23, 27],
    [24, 26],
    // 다섯 번째 줄
    [29, 35],
    [30, 34],
    [31, 33],
    // 여섯 번째 줄
    [36, 42],
    [37, 41],
    [38, 40],
    // 일곱 번째 줄 (45는 중앙이므로 대칭 쌍 없음)
    [43, 45], // 44는 중앙
  ]

  // 수평 대칭 쌍들 (중앙 가로축 기준)
  const horizontalSymmetryPairs = [
    // 첫 번째 열
    [1, 43],
    [8, 36],
    [15, 29],
    // 두 번째 열
    [2, 44],
    [9, 37],
    [16, 30],
    // 세 번째 열
    [3, 45],
    [10, 38],
    [17, 31],
    // 네 번째 열 (중앙 열)
    [4, 25],
    [11, 32],
    [18, 39], // 25는 중앙점
    // 다섯 번째 열
    [5, 33],
    [12, 40],
    [19, 26],
    // 여섯 번째 열
    [6, 34],
    [13, 41],
    [20, 27],
    // 일곱 번째 열
    [7, 35],
    [14, 42],
    [21, 28],
  ]

  // 대각선 대칭 쌍들 (좌상-우하 대각선 기준)
  const diagonalSymmetryPairs1 = [
    [2, 8],
    [3, 9],
    [4, 10],
    [5, 11],
    [6, 12],
    [7, 13],
    [9, 15],
    [10, 16],
    [11, 17],
    [12, 18],
    [13, 19],
    [14, 20],
    [16, 22],
    [17, 23],
    [18, 24],
    [19, 25],
    [20, 26],
    [21, 27],
    [23, 29],
    [24, 30],
    [25, 31],
    [26, 32],
    [27, 33],
    [28, 34],
    [30, 36],
    [31, 37],
    [32, 38],
    [33, 39],
    [34, 40],
    [35, 41],
    [37, 43],
    [38, 44],
    [39, 45],
  ]

  // 대각선 대칭 쌍들 (우상-좌하 대각선 기준)
  const diagonalSymmetryPairs2 = [
    [6, 8],
    [5, 9],
    [4, 10],
    [3, 11],
    [2, 12],
    [1, 13],
    [13, 15],
    [12, 16],
    [11, 17],
    [10, 18],
    [9, 19],
    [8, 20],
    [20, 22],
    [19, 23],
    [18, 24],
    [17, 25],
    [16, 26],
    [15, 27],
    [27, 29],
    [26, 30],
    [25, 31],
    [24, 32],
    [23, 33],
    [22, 34],
    [34, 36],
    [33, 37],
    [32, 38],
    [31, 39],
    [30, 40],
    [29, 41],
    [41, 43],
    [40, 44],
    [39, 45],
  ]

  // 점 대칭 쌍들 (중앙점 25 기준)
  const pointSymmetryPairs = [
    [1, 45],
    [2, 44],
    [3, 43],
    [8, 42],
    [9, 41],
    [10, 40],
    [15, 35],
    [16, 34],
    [17, 33],
    [22, 28],
    [23, 27],
    [24, 26],
    [4, 46],
    [5, 47],
    [6, 48],
    [7, 49], // 실제로는 존재하지 않는 번호들
    [11, 39],
    [12, 38],
    [13, 37],
    [14, 36],
    [18, 32],
    [19, 31],
    [20, 30],
    [21, 29],
  ].filter(([a, b]) => a <= 45 && b <= 45) // 45 이하 번호만 필터링

  // 각 대칭 유형별 점수 계산
  let verticalScore = 0
  verticalSymmetryPairs.forEach(([a, b]) => {
    if (numbers.includes(a) && numbers.includes(b)) {
      verticalScore += 1
    }
  })

  let horizontalScore = 0
  horizontalSymmetryPairs.forEach(([a, b]) => {
    if (numbers.includes(a) && numbers.includes(b)) {
      horizontalScore += 1
    }
  })

  let diagonal1Score = 0
  diagonalSymmetryPairs1.forEach(([a, b]) => {
    if (numbers.includes(a) && numbers.includes(b)) {
      diagonal1Score += 1
    }
  })

  let diagonal2Score = 0
  diagonalSymmetryPairs2.forEach(([a, b]) => {
    if (numbers.includes(a) && numbers.includes(b)) {
      diagonal2Score += 1
    }
  })

  let pointScore = 0
  pointSymmetryPairs.forEach(([a, b]) => {
    if (numbers.includes(a) && numbers.includes(b)) {
      pointScore += 1
    }
  })

  // 전체 대칭 점수 계산 (가중 평균)
  const totalPairs =
    verticalSymmetryPairs.length +
    horizontalSymmetryPairs.length +
    diagonalSymmetryPairs1.length +
    diagonalSymmetryPairs2.length +
    pointSymmetryPairs.length

  const totalScore = verticalScore + horizontalScore + diagonal1Score + diagonal2Score + pointScore

  return totalScore / totalPairs
}

// 8. 등차수열 패턴
export function analyzeArithmeticSequencePatterns(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let maxSequenceLength = 1

  for (let diff = 1; diff <= 22; diff++) {
    // 최대 공차 22
    let currentLength = 1
    let lastNumber = sortedNumbers[0]

    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] === lastNumber + diff) {
        currentLength++
        lastNumber = sortedNumbers[i]
      } else {
        maxSequenceLength = Math.max(maxSequenceLength, currentLength)
        currentLength = 1
        lastNumber = sortedNumbers[i]
      }
    }
    maxSequenceLength = Math.max(maxSequenceLength, currentLength)
  }

  return maxSequenceLength / 6 // 정규화
}

// 9. 번호 클러스터링 패턴
export function analyzeClusterPatterns(numbers: number[]): number[] {
  // 번호를 5개 구간으로 나누어 클러스터 분석
  const clusters = Array(5).fill(0)
  const clusterSize = 9 // 45/5 = 9

  numbers.forEach((num) => {
    const clusterIndex = Math.min(Math.floor((num - 1) / clusterSize), 4)
    clusters[clusterIndex]++
  })

  return clusters.map((count) => count / 6) // 정규화
}

// 10. 가중치 기반 번호 선호도
export function calculateNumberPreferences(): number[] {
  const preferences = Array(45).fill(0)
  const recentWeight = 0.7 // 최근 데이터에 더 높은 가중치

  winningNumbers.forEach((draw, index) => {
    const weight = Math.pow(recentWeight, winningNumbers.length - index - 1)

    draw.numbers.forEach((num) => {
      preferences[num - 1] += weight
    })
  })

  // 정규화
  const maxPreference = Math.max(...preferences)
  return preferences.map((pref) => pref / maxPreference)
}

// 11. 번호 간 거리 패턴
export function analyzeDistancePatterns(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let totalDistance = 0

  for (let i = 1; i < sortedNumbers.length; i++) {
    totalDistance += sortedNumbers[i] - sortedNumbers[i - 1]
  }

  return totalDistance / (44 * 5) // 정규화 (최대 거리는 44*5)
}

// 12. 번호 분산 패턴
export function analyzeVariancePatterns(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length

  return Math.sqrt(variance) / 23 // 정규화 (최대 표준편차는 약 23)
}

// 13. 회차별 유사도 패턴
export function analyzeSimilarityPatterns(currentNumbers: number[]): number {
  let maxSimilarity = 0

  winningNumbers.forEach((draw) => {
    const intersection = currentNumbers.filter((num) => draw.numbers.includes(num))
    const similarity = intersection.length / 6
    maxSimilarity = Math.max(maxSimilarity, similarity)
  })

  return maxSimilarity
}

// 14. 번호 조합 빈도 패턴
export function analyzeCombinationFrequency(numbers: number[]): number {
  let combinationScore = 0

  // 2개 번호 조합 빈도 확인
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const pair = [numbers[i], numbers[j]]

      const frequency = winningNumbers.filter((draw) => pair.every((num) => draw.numbers.includes(num))).length

      combinationScore += frequency
    }
  }

  return combinationScore / (winningNumbers.length * 15) // 정규화
}

// 15. 트렌드 기반 예측
export function analyzeTrendPatterns(): number[] {
  const trendScores = Array(45).fill(0)
  const windowSize = 10 // 최근 10회 기준

  for (let num = 1; num <= 45; num++) {
    let recentCount = 0
    let olderCount = 0

    // 최근 10회
    for (let i = 0; i < Math.min(windowSize, winningNumbers.length); i++) {
      if (winningNumbers[winningNumbers.length - 1 - i].numbers.includes(num)) {
        recentCount++
      }
    }

    // 그 이전 10회
    for (let i = windowSize; i < Math.min(windowSize * 2, winningNumbers.length); i++) {
      if (winningNumbers[winningNumbers.length - 1 - i].numbers.includes(num)) {
        olderCount++
      }
    }

    // 트렌드 점수 (증가 추세면 양수, 감소 추세면 음수)
    trendScores[num - 1] = (recentCount - olderCount) / windowSize
  }

  return trendScores
}
