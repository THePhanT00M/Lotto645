import { winningNumbers } from "@/data/winning-numbers"

// 번호 합계 계산
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0)
}

// 홀짝 비율 계산 (홀수 번호의 비율)
export function calculateOddEvenRatio(numbers: number[]): number {
  const oddCount = numbers.filter((num) => num % 2 === 1).length
  return oddCount / numbers.length
}

// 번호 범위 분포 계산
export function calculateRangeDistribution(numbers: number[]): number[] {
  const ranges = [0, 0, 0] // [1-15, 16-30, 31-45]

  numbers.forEach((num) => {
    if (num <= 15) ranges[0]++
    else if (num <= 30) ranges[1]++
    else ranges[2]++
  })

  return ranges
}

// 연속 번호 개수 계산
export function calculateConsecutiveNumbers(numbers: number[]): number {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let maxConsecutive = 1
  let currentConsecutive = 1

  for (let i = 1; i < sortedNumbers.length; i++) {
    if (sortedNumbers[i] === sortedNumbers[i - 1] + 1) {
      currentConsecutive++
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
    } else {
      currentConsecutive = 1
    }
  }

  return maxConsecutive
}

// 번호 간 간격 통계 계산
export function calculateGapStatistics(numbers: number[]): { mean: number; max: number; min: number } {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  const gaps = []

  for (let i = 1; i < sortedNumbers.length; i++) {
    gaps.push(sortedNumbers[i] - sortedNumbers[i - 1])
  }

  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const max = Math.max(...gaps)
  const min = Math.min(...gaps)

  return { mean, max, min }
}

// 번호별 과거 당첨 빈도 계산
export function calculateNumberFrequencies(): number[] {
  const frequencies = Array(45).fill(0)

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      frequencies[num - 1]++
    })
  })

  return frequencies
}

// 번호별 최근 등장 회차 계산
export function calculateLastAppearance(): number[] {
  const lastAppearance = Array(45).fill(0)
  const totalDraws = winningNumbers.length

  for (let i = 0; i < 45; i++) {
    for (let j = totalDraws - 1; j >= 0; j--) {
      if (winningNumbers[j].numbers.includes(i + 1)) {
        lastAppearance[i] = totalDraws - j
        break
      }
    }
  }

  return lastAppearance
}

// 번호 간 상관관계 계산 (함께 등장한 횟수)
export function calculateNumberCorrelations(): number[][] {
  const correlations = Array(45)
    .fill(0)
    .map(() => Array(45).fill(0))

  winningNumbers.forEach((draw) => {
    for (let i = 0; i < draw.numbers.length; i++) {
      for (let j = i + 1; j < draw.numbers.length; j++) {
        const num1 = draw.numbers[i] - 1
        const num2 = draw.numbers[j] - 1
        correlations[num1][num2]++
        correlations[num2][num1]++
      }
    }
  })

  return correlations
}

// 모든 특성을 추출하여 단일 배열로 반환
export function extractAllFeatures(drawNumbers: number[][]): number[] {
  // 최근 5회 당첨 번호를 평탄화
  const flatNumbers = drawNumbers.flat()

  // 각 회차별 특성 추출
  const drawFeatures = drawNumbers.map((numbers) => {
    const sum = calculateSum(numbers)
    const oddEvenRatio = calculateOddEvenRatio(numbers)
    const rangeDistribution = calculateRangeDistribution(numbers)
    const consecutiveCount = calculateConsecutiveNumbers(numbers)
    const gapStats = calculateGapStatistics(numbers)

    return [
      sum / 255, // 정규화 (최대 가능 합계는 45+44+43+42+41+40=255)
      oddEvenRatio,
      ...rangeDistribution.map((count) => count / 6), // 정규화
      consecutiveCount / 6, // 정규화
      gapStats.mean / 44, // 정규화 (최대 가능 간격은 44)
      gapStats.max / 44, // 정규화
      gapStats.min / 44, // 정규화
    ]
  })

  // 전체 특성 배열 생성
  return [
    ...flatNumbers, // 기본 입력 (5회 x 6개 번호 = 30개)
    ...drawFeatures.flat(), // 추가 특성 (5회 x 9개 특성 = 45개)
  ]
}

// 전체 데이터셋에 대한 특성 추출
export function extractFeaturesForDataset(
  winningNumbers: any[],
  sequenceLength: number,
): {
  sequences: number[][]
  targets: number[][]
} {
  const sequences: number[][] = []
  const targets: number[][] = []

  // 시퀀스 생성
  for (let i = 0; i < winningNumbers.length - sequenceLength; i++) {
    const sequence = winningNumbers.slice(i, i + sequenceLength).map((draw) => draw.numbers)
    const target = winningNumbers[i + sequenceLength].numbers

    // 특성 추출
    const features = extractAllFeatures(sequence)

    sequences.push(features)

    // 타겟 번호를 원-핫 인코딩으로 변환
    const targetOneHot = Array(45).fill(0)
    target.forEach((num) => {
      targetOneHot[num - 1] = 1
    })

    targets.push(targetOneHot)
  }

  return { sequences, targets }
}
