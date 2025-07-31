import { winningNumbers } from "@/data/winning-numbers"

// Number frequency analysis
export interface NumberFrequency {
  number: number
  count: number
  percentage: number
}

// Get frequency of each number (1-45) from winning numbers
export const getNumberFrequencies = (): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // Count occurrences of each number in winning numbers
  winningNumbers.forEach((result) => {
    result.numbers.forEach((num) => {
      frequencies[num]++
    })
  })

  // Calculate total draws and convert to array
  const totalDraws = winningNumbers.length
  const totalNumbers = totalDraws * 6 // 6 numbers per draw

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalNumbers > 0 ? (count / totalNumbers) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// Get frequency of each bonus number (1-45)
export const getBonusNumberFrequencies = (): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // Count occurrences of each bonus number
  winningNumbers.forEach((result) => {
    frequencies[result.bonusNo]++
  })

  // Calculate total draws
  const totalDraws = winningNumbers.length

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// Get most frequently drawn numbers
export const getMostFrequentNumbers = (limit = 5): NumberFrequency[] => {
  return getNumberFrequencies()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get least frequently drawn numbers
export const getLeastFrequentNumbers = (limit = 5): NumberFrequency[] => {
  return getNumberFrequencies()
    .sort((a, b) => a.count - b.count)
    .slice(0, limit)
}

// Get most frequently drawn bonus numbers
export const getMostFrequentBonusNumbers = (limit = 5): NumberFrequency[] => {
  return getBonusNumberFrequencies()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get total number of draws
export const getTotalDraws = (): number => {
  return winningNumbers.length
}

// Get latest draw information
export const getLatestDraw = () => {
  if (winningNumbers.length === 0) return null
  return winningNumbers[winningNumbers.length - 1] // Return the last element (most recent draw)
}

// Get statistics by number range (1-10, 11-20, etc.)
export const getNumberRangeStatistics = (): { range: string; count: number; percentage: number }[] => {
  const frequencies = getNumberFrequencies()
  const ranges = [
    { name: "1-10", min: 1, max: 10 },
    { name: "11-20", min: 11, max: 20 },
    { name: "21-30", min: 21, max: 30 },
    { name: "31-40", min: 31, max: 40 },
    { name: "41-45", min: 41, max: 45 },
  ]

  const totalCount = frequencies.reduce((sum, freq) => sum + freq.count, 0)

  return ranges.map((range) => {
    const rangeNumbers = frequencies.filter((freq) => freq.number >= range.min && freq.number <= range.max)
    const count = rangeNumbers.reduce((sum, freq) => sum + freq.count, 0)

    return {
      range: range.name,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }
  })
}

// Get bonus number range statistics
export const getBonusNumberRangeStatistics = (): { range: string; count: number; percentage: number }[] => {
  const frequencies = getBonusNumberFrequencies()
  const ranges = [
    { name: "1-10", min: 1, max: 10 },
    { name: "11-20", min: 11, max: 20 },
    { name: "21-30", min: 21, max: 30 },
    { name: "31-40", min: 31, max: 40 },
    { name: "41-45", min: 41, max: 45 },
  ]

  const totalCount = winningNumbers.length

  return ranges.map((range) => {
    const rangeNumbers = frequencies.filter((freq) => freq.number >= range.min && freq.number <= range.max)
    const count = rangeNumbers.reduce((sum, freq) => sum + freq.count, 0)

    return {
      range: range.name,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }
  })
}

// 새로운 함수: 최근 N회 동안의 번호 빈도 분석
export const getRecentNumberFrequencies = (lastNDraws = 50): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // 최근 N회 당첨 번호만 가져오기
  const recentDraws = winningNumbers.slice(-Math.min(lastNDraws, winningNumbers.length))

  // Count occurrences of each number in recent winning numbers
  recentDraws.forEach((result) => {
    result.numbers.forEach((num) => {
      frequencies[num]++
    })
  })

  // Calculate total draws and convert to array
  const totalDraws = recentDraws.length
  const totalNumbers = totalDraws * 6 // 6 numbers per draw

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalNumbers > 0 ? (count / totalNumbers) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// 새로운 함수: 홀짝 분석
export const getOddEvenAnalysis = (): { type: string; count: number; percentage: number }[] => {
  let oddCount = 0
  let evenCount = 0
  let totalNumbers = 0

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      if (num % 2 === 0) {
        evenCount++
      } else {
        oddCount++
      }
      totalNumbers++
    })
  })

  return [
    {
      type: "홀수",
      count: oddCount,
      percentage: totalNumbers > 0 ? (oddCount / totalNumbers) * 100 : 0,
    },
    {
      type: "짝수",
      count: evenCount,
      percentage: totalNumbers > 0 ? (evenCount / totalNumbers) * 100 : 0,
    },
  ]
}

// 새로운 함수: 번호 합계 범위 분석
export const getSumRangeAnalysis = (): { range: string; count: number; percentage: number }[] => {
  const sumRanges = [
    { name: "1-100", min: 1, max: 100 },
    { name: "101-150", min: 101, max: 150 },
    { name: "151-200", min: 151, max: 200 },
    { name: "201-255", min: 201, max: 255 },
  ]

  const rangeCounts: Record<string, number> = {}
  sumRanges.forEach((range) => {
    rangeCounts[range.name] = 0
  })

  winningNumbers.forEach((draw) => {
    const sum = draw.numbers.reduce((acc, num) => acc + num, 0)
    for (const range of sumRanges) {
      if (sum >= range.min && sum <= range.max) {
        rangeCounts[range.name]++
        break
      }
    }
  })

  const totalDraws = winningNumbers.length

  return sumRanges.map((range) => ({
    range: range.name,
    count: rangeCounts[range.name],
    percentage: totalDraws > 0 ? (rangeCounts[range.name] / totalDraws) * 100 : 0,
  }))
}

// 새로운 함수: 번호 간 간격 분석
export const getGapAnalysis = (): { gap: string; count: number; percentage: number }[] => {
  const gapRanges = [
    { name: "작은 간격 (1-3)", min: 1, max: 3 },
    { name: "중간 간격 (4-8)", min: 4, max: 8 },
    { name: "큰 간격 (9+)", min: 9, max: 100 },
  ]

  const gapCounts: Record<string, number> = {}
  gapRanges.forEach((range) => {
    gapCounts[range.name] = 0
  })

  let totalGaps = 0

  winningNumbers.forEach((draw) => {
    const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)

    for (let i = 1; i < sortedNumbers.length; i++) {
      const gap = sortedNumbers[i] - sortedNumbers[i - 1]
      totalGaps++

      for (const range of gapRanges) {
        if (gap >= range.min && gap <= range.max) {
          gapCounts[range.name]++
          break
        }
      }
    }
  })

  return gapRanges.map((range) => ({
    gap: range.name,
    count: gapCounts[range.name],
    percentage: totalGaps > 0 ? (gapCounts[range.name] / totalGaps) * 100 : 0,
  }))
}

// 새로운 함수: 연속 번호 분석
export const getConsecutiveNumbersAnalysis = (): { count: number; occurrences: number; percentage: number }[] => {
  const consecutiveCounts: Record<number, number> = {
    0: 0, // 연속 번호 없음
    1: 0, // 연속 번호 1쌍
    2: 0, // 연속 번호 2쌍
    3: 0, // 연속 번호 3쌍 이상
  }

  winningNumbers.forEach((draw) => {
    const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)
    let consecutivePairs = 0

    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] === sortedNumbers[i - 1] + 1) {
        consecutivePairs++
      }
    }

    if (consecutivePairs >= 3) {
      consecutiveCounts[3]++
    } else {
      consecutiveCounts[consecutivePairs]++
    }
  })

  const totalDraws = winningNumbers.length

  return Object.entries(consecutiveCounts).map(([count, occurrences]) => ({
    count: Number.parseInt(count),
    occurrences,
    percentage: totalDraws > 0 ? (occurrences / totalDraws) * 100 : 0,
  }))
}

// 새로운 함수: 번호 휴면 기간 분석 (마지막 등장 이후 경과 회차)
export const getNumberDormancyPeriods = (): { number: number; lastAppearance: number; dormancyPeriod: number }[] => {
  const latestAppearances: Record<number, number> = {}
  const currentDraw = winningNumbers.length

  // Initialize with -1 to indicate never appeared
  for (let i = 1; i <= 45; i++) {
    latestAppearances[i] = -1
  }

  // Find the latest appearance of each number
  winningNumbers.forEach((draw, index) => {
    draw.numbers.forEach((num) => {
      latestAppearances[num] = index
    })
    // Also check bonus number
    latestAppearances[draw.bonusNo] = index
  })

  return Object.entries(latestAppearances)
    .map(([number, lastAppearance]) => ({
      number: Number.parseInt(number),
      lastAppearance: lastAppearance + 1, // Convert to 1-based draw number
      dormancyPeriod: lastAppearance === -1 ? currentDraw : currentDraw - lastAppearance - 1,
    }))
    .sort((a, b) => b.dormancyPeriod - a.dormancyPeriod) // Sort by dormancy period (descending)
}

// 시계열 분석 관련 함수 추가
// 특정 기간 동안의 번호 출현 추세 분석
export const getNumberTrends = (periods = 5): { number: number; trend: number[]; direction: string }[] => {
  // 전체 데이터를 periods 개의 구간으로 나눔
  const totalDraws = winningNumbers.length
  const drawsPerPeriod = Math.floor(totalDraws / periods)

  // 각 구간별 번호 빈도 계산
  const periodFrequencies: Record<number, number[]> = {}

  // 1-45 모든 번호에 대해 초기화
  for (let num = 1; num <= 45; num++) {
    periodFrequencies[num] = Array(periods).fill(0)
  }

  // 각 구간별로 번호 빈도 계산
  for (let period = 0; period < periods; period++) {
    const startIdx = Math.max(0, totalDraws - (period + 1) * drawsPerPeriod)
    const endIdx = Math.max(0, totalDraws - period * drawsPerPeriod)

    // 해당 구간의 당첨 번호 추출
    const periodDraws = winningNumbers.slice(startIdx, endIdx)

    // 각 번호의 빈도 계산
    periodDraws.forEach((draw) => {
      draw.numbers.forEach((num) => {
        periodFrequencies[num][period]++
      })
    })
  }

  // 각 번호별 추세 계산
  return Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
    const trend = [...periodFrequencies[num]].reverse() // 최신 데이터가 마지막에 오도록 역순 정렬

    // 추세 방향 계산 (상승, 하락, 유지)
    let direction = "유지"
    if (trend.length >= 2) {
      const recentAvg = (trend[trend.length - 1] + trend[trend.length - 2]) / 2
      const olderAvg = (trend[0] + trend[1]) / 2

      if (recentAvg > olderAvg * 1.2) {
        direction = "상승"
      } else if (recentAvg < olderAvg * 0.8) {
        direction = "하락"
      }
    }

    return {
      number: num,
      trend,
      direction,
    }
  })
}

// 계절성 분석 함수
export const getSeasonalAnalysis = (): {
  season: string
  topNumbers: number[]
  avgSum: number
  oddEvenRatio: string
}[] => {
  // 계절 정의 (월별)
  const seasons = [
    { name: "봄 (3-5월)", months: [3, 4, 5] },
    { name: "여름 (6-8월)", months: [6, 7, 8] },
    { name: "가을 (9-11월)", months: [9, 10, 11] },
    { name: "겨울 (12-2월)", months: [12, 1, 2] },
  ]

  // 계절별 데이터 분석 결과
  return seasons.map((season) => {
    // 해당 계절에 추첨된 번호만 필터링
    const seasonalDraws = winningNumbers.filter((draw) => {
      const drawDate = new Date(draw.date)
      const month = drawDate.getMonth() + 1 // 0-based 월을 1-based로 변환
      return season.months.includes(month)
    })

    // 번호별 빈도 계산
    const numberFrequencies: Record<number, number> = {}
    for (let i = 1; i <= 45; i++) {
      numberFrequencies[i] = 0
    }

    let totalSum = 0
    let oddCount = 0
    let evenCount = 0

    seasonalDraws.forEach((draw) => {
      // 번호 빈도 계산
      draw.numbers.forEach((num) => {
        numberFrequencies[num]++

        // 홀짝 계산
        if (num % 2 === 0) {
          evenCount++
        } else {
          oddCount++
        }
      })

      // 합계 계산
      totalSum += draw.numbers.reduce((sum, num) => sum + num, 0)
    })

    // 가장 빈도가 높은 5개 번호 추출
    const topNumbers = Object.entries(numberFrequencies)
      .map(([num, freq]) => ({ number: Number.parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((item) => item.number)

    // 평균 합계 계산
    const avgSum = seasonalDraws.length > 0 ? Math.round(totalSum / seasonalDraws.length) : 0

    // 홀짝 비율 계산
    const totalNumbers = oddCount + evenCount
    const oddPercentage = totalNumbers > 0 ? Math.round((oddCount / totalNumbers) * 100) : 0
    const evenPercentage = totalNumbers > 0 ? Math.round((evenCount / totalNumbers) * 100) : 0

    return {
      season: season.name,
      topNumbers,
      avgSum,
      oddEvenRatio: `${oddPercentage}:${evenPercentage}`,
    }
  })
}

// 클러스터링 분석 함수
export const getNumberClusters = (
  clusterCount = 3,
): {
  clusterId: number
  numbers: number[]
  frequency: number
  avgSum: number
  description: string
}[] => {
  // 간단한 K-means 클러스터링 구현
  // 실제 구현에서는 더 복잡한 알고리즘을 사용할 수 있음

  // 클러스터 중심점 초기화 (랜덤하게 선택)
  const centroids: number[][] = []
  const usedIndices = new Set<number>()

  // 랜덤하게 클러스터 중심점 선택
  while (centroids.length < clusterCount) {
    const randomIndex = Math.floor(Math.random() * winningNumbers.length)
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex)
      centroids.push([...winningNumbers[randomIndex].numbers])
    }
  }

  // 각 당첨 번호와 중심점 간의 거리 계산 함수
  const calculateDistance = (numbers1: number[], numbers2: number[]): number => {
    // 두 번호 세트 간의 유클리드 거리 계산
    const set1 = new Set(numbers1)
    const set2 = new Set(numbers2)

    // 공통 번호 수 계산
    let commonCount = 0
    set1.forEach((num) => {
      if (set2.has(num)) commonCount++
    })

    // 거리 = 6 - 공통 번호 수 (최대 거리 6, 최소 거리 0)
    return 6 - commonCount
  }

  // 클러스터 할당 및 중심점 업데이트 반복
  const MAX_ITERATIONS = 10
  let clusters: number[][] = Array(clusterCount)
    .fill(0)
    .map(() => [])

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // 클러스터 초기화
    clusters = Array(clusterCount)
      .fill(0)
      .map(() => [])

    // 각 당첨 번호를 가장 가까운 클러스터에 할당
    winningNumbers.forEach((draw, drawIndex) => {
      let minDistance = Number.POSITIVE_INFINITY
      let closestCluster = 0

      // 가장 가까운 클러스터 찾기
      centroids.forEach((centroid, centroidIndex) => {
        const distance = calculateDistance(draw.numbers, centroid)
        if (distance < minDistance) {
          minDistance = distance
          closestCluster = centroidIndex
        }
      })

      // 해당 클러스터에 당첨 번호 인덱스 추가
      clusters[closestCluster].push(drawIndex)
    })

    // 중심점 업데이트
    let centroidsChanged = false

    for (let i = 0; i < clusterCount; i++) {
      if (clusters[i].length === 0) continue

      // 클러스터 내 모든 번호의 빈도 계산
      const frequencyMap: Record<number, number> = {}
      for (let j = 1; j <= 45; j++) {
        frequencyMap[j] = 0
      }

      // 클러스터 내 각 번호의 빈도 계산
      clusters[i].forEach((drawIndex) => {
        winningNumbers[drawIndex].numbers.forEach((num) => {
          frequencyMap[num]++
        })
      })

      // 가장 빈도가 높은 6개 번호를 새 중심점으로 설정
      const newCentroid = Object.entries(frequencyMap)
        .map(([num, freq]) => ({ number: Number.parseInt(num), frequency: freq }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 6)
        .map((item) => item.number)
        .sort((a, b) => a - b)

      // 중심점이 변경되었는지 확인
      if (JSON.stringify(newCentroid) !== JSON.stringify(centroids[i])) {
        centroids[i] = newCentroid
        centroidsChanged = true
      }
    }

    // 중심점이 더 이상 변경되지 않으면 종료
    if (!centroidsChanged) break
  }

  // 클러스터 결과 분석
  return clusters
    .map((clusterDrawIndices, clusterId) => {
      if (clusterDrawIndices.length === 0) {
        return {
          clusterId: clusterId + 1,
          numbers: [],
          frequency: 0,
          avgSum: 0,
          description: "데이터 없음",
        }
      }

      // 클러스터 내 번호 빈도 계산
      const frequencyMap: Record<number, number> = {}
      for (let i = 1; i <= 45; i++) {
        frequencyMap[i] = 0
      }

      let totalSum = 0
      let oddCount = 0
      let evenCount = 0
      let lowRange = 0
      let midRange = 0
      let highRange = 0

      // 클러스터 내 각 번호의 통계 계산
      clusterDrawIndices.forEach((drawIndex) => {
        const numbers = winningNumbers[drawIndex].numbers

        // 번호 빈도
        numbers.forEach((num) => {
          frequencyMap[num]++

          // 홀짝 계산
          if (num % 2 === 0) {
            evenCount++
          } else {
            oddCount++
          }

          // 범위 계산
          if (num <= 15) lowRange++
          else if (num <= 30) midRange++
          else highRange++
        })

        // 합계 계산
        totalSum += numbers.reduce((sum, num) => sum + num, 0)
      })

      // 가장 빈도가 높은 6개 번호 추출
      const representativeNumbers = Object.entries(frequencyMap)
        .map(([num, freq]) => ({ number: Number.parseInt(num), frequency: freq }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 6)
        .map((item) => item.number)
        .sort((a, b) => a - b)

      // 평균 합계 계산
      const avgSum = Math.round(totalSum / clusterDrawIndices.length)

      // 클러스터 특성 설명 생성
      const totalNumbers = clusterDrawIndices.length * 6
      const oddPercentage = Math.round((oddCount / totalNumbers) * 100)
      const evenPercentage = Math.round((evenCount / totalNumbers) * 100)

      const lowPercentage = Math.round((lowRange / totalNumbers) * 100)
      const midPercentage = Math.round((midRange / totalNumbers) * 100)
      const highPercentage = Math.round((highRange / totalNumbers) * 100)

      let description = ""

      // 홀짝 특성
      if (oddPercentage >= 70) {
        description += "홀수 중심"
      } else if (evenPercentage >= 70) {
        description += "짝수 중심"
      } else {
        description += "홀짝 균형"
      }

      description += ", "

      // 번호 범위 특성
      if (lowPercentage >= 40) {
        description += "저범위 중심"
      } else if (highPercentage >= 40) {
        description += "고범위 중심"
      } else if (midPercentage >= 40) {
        description += "중범위 중심"
      } else {
        description += "범위 균형"
      }

      // 합계 특성
      if (avgSum < 120) {
        description += ", 낮은 합계"
      } else if (avgSum > 150) {
        description += ", 높은 합계"
      } else {
        description += ", 중간 합계"
      }

      return {
        clusterId: clusterId + 1,
        numbers: representativeNumbers,
        frequency: clusterDrawIndices.length,
        avgSum,
        description,
      }
    })
    .filter((cluster) => cluster.frequency > 0) // 빈 클러스터 제거
}

// 월별 당첨 번호 분석
export const getMonthlyAnalysis = (): {
  month: string
  topNumbers: number[]
  avgSum: number
  drawCount: number
}[] => {
  // 월별 데이터 초기화
  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

  const monthlyData = months.map((name, index) => {
    return {
      month: name,
      monthIndex: index + 1,
      numbers: [] as number[][],
      sums: [] as number[],
    }
  })

  // 월별로 당첨 번호 분류
  winningNumbers.forEach((draw) => {
    const drawDate = new Date(draw.date)
    const month = drawDate.getMonth() // 0-based 월

    monthlyData[month].numbers.push(draw.numbers)
    monthlyData[month].sums.push(draw.numbers.reduce((sum, num) => sum + num, 0))
  })

  // 월별 통계 계산
  return monthlyData.map((data) => {
    // 번호별 빈도 계산
    const numberFrequencies: Record<number, number> = {}
    for (let i = 1; i <= 45; i++) {
      numberFrequencies[i] = 0
    }

    data.numbers.forEach((numbers) => {
      numbers.forEach((num) => {
        numberFrequencies[num]++
      })
    })

    // 가장 빈도가 높은 5개 번호 추출
    const topNumbers = Object.entries(numberFrequencies)
      .map(([num, freq]) => ({ number: Number.parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((item) => item.number)

    // 평균 합계 계산
    const avgSum =
      data.sums.length > 0 ? Math.round(data.sums.reduce((acc, sum) => acc + sum, 0) / data.sums.length) : 0

    return {
      month: data.month,
      topNumbers,
      avgSum,
      drawCount: data.numbers.length,
    }
  })
}
