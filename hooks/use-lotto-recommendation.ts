"use client"

import { useState, useEffect, useCallback } from "react"
import { winningNumbers } from "@/data/winning-numbers"
import type { MultipleNumberType, SimilarDrawType } from "@/components/lotto-analysis/types"
import {
  getRecentNumberFrequencies,
  getOddEvenAnalysis,
  getSumRangeAnalysis,
  getGapAnalysis,
  getConsecutiveNumbersAnalysis,
  getNumberDormancyPeriods,
} from "@/utils/statistics-utils"

type RecommendationQuality = "최상급" | "최상" | "상급" | "상" | "중상" | "중" | "보통" | "기본" | "랜덤" | ""

interface UseRecommendationResult {
  recommendedNumbers: number[]
  isGenerating: boolean
  isSaved: boolean
  setIsSaved: (value: boolean) => void
  recommendationQuality: RecommendationQuality
  generateRecommendedNumbers: () => void
}

export function useLottoRecommendation(
  multipleNumbers: MultipleNumberType[],
  similarDraws: SimilarDrawType[],
  onRecommendationGenerated?: (numbers: number[]) => void,
  forceRefresh?: number,
): UseRecommendationResult {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastForceRefresh, setLastForceRefresh] = useState(forceRefresh)
  const [recommendationQuality, setRecommendationQuality] = useState<RecommendationQuality>("")

  // 추천 번호 생성 함수
  const generateRecommendedNumbers = useCallback(() => {
    setIsGenerating(true)
    setIsSaved(false) // 새로운 번호 생성 시 저장 상태 초기화

    // 최대 시도 횟수 설정
    const MAX_ATTEMPTS = 25 // 시도 횟수 대폭 증가
    let attempts = 0
    let validNumbersFound = false
    let sortedRecommendedNumbers: number[] = []
    let bestScore = -1
    let bestNumbers: number[] = []

    // 최근 당첨 번호 패턴 분석 데이터 가져오기
    const recentFrequencies = getRecentNumberFrequencies(30) // 최근 30회
    const oddEvenAnalysis = getOddEvenAnalysis()
    const sumRangeAnalysis = getSumRangeAnalysis()
    const gapAnalysis = getGapAnalysis()
    const consecutiveAnalysis = getConsecutiveNumbersAnalysis()
    const dormancyPeriods = getNumberDormancyPeriods()

    // 홀짝 비율 계산
    const oddPercentage = oddEvenAnalysis.find((item) => item.type === "홀수")?.percentage || 50
    const targetOddCount = Math.round((oddPercentage / 100) * 6) // 목표 홀수 개수

    // 번호 합계 범위 확률 계산
    const sumRangeProbabilities = sumRangeAnalysis.reduce(
      (acc, item) => {
        acc[item.range] = item.percentage / 100
        return acc
      },
      {} as Record<string, number>,
    )

    // 번호 간격 확률 계산
    const gapProbabilities = gapAnalysis.reduce(
      (acc, item) => {
        acc[item.gap] = item.percentage / 100
        return acc
      },
      {} as Record<string, number>,
    )

    // 연속 번호 확률 계산
    const consecutiveProbabilities = consecutiveAnalysis.reduce(
      (acc, item) => {
        acc[item.count] = item.percentage / 100
        return acc
      },
      {} as Record<string, number>,
    )

    // 유효한 번호를 찾을 때까지 반복 (최대 시도 횟수 제한)
    while (attempts < MAX_ATTEMPTS) {
      attempts++

      // 유사한 과거 당첨 번호에서 자주 등장하는 번호 찾기
      const frequentNumbers: Record<number, number> = {}
      if (similarDraws.length > 0) {
        similarDraws.forEach((draw) => {
          draw.numbers.forEach((num) => {
            frequentNumbers[num] = (frequentNumbers[num] || 0) + 1
          })
        })
      }

      // 빈도 높은 쌍둥이 조합 찾기
      const frequentQuads = multipleNumbers
        .filter((item) => item.type === "4쌍둥이" && item.count > 0)
        .sort((a, b) => b.count - a.count)

      const frequentTriplets = multipleNumbers
        .filter((item) => item.type === "3쌍둥이" && item.count > 0)
        .sort((a, b) => b.count - a.count)

      const frequentPairs = multipleNumbers
        .filter((item) => item.type === "2쌍둥이" && item.count > 0)
        .sort((a, b) => b.count - a.count)

      // 최종 추천 번호 생성
      const recommendedSet = new Set<number>()

      // 1. 4쌍둥이가 2개 이상 있을 때: 4쌍둥이들의 교집합을 찾아 활용
      if (frequentQuads.length >= 2) {
        // 상위 3개의 4쌍둥이 중에서 2개를 랜덤하게 선택
        const topQuads = frequentQuads.slice(0, Math.min(3, frequentQuads.length))
        const selectedIndices: number[] = []

        // 2개의 인덱스를 랜덤하게 선택
        while (selectedIndices.length < 2 && selectedIndices.length < topQuads.length) {
          const randomIndex = Math.floor(Math.random() * topQuads.length)
          if (!selectedIndices.includes(randomIndex)) {
            selectedIndices.push(randomIndex)
          }
        }

        // 선택된 4쌍둥이들의 교집합 찾기
        if (selectedIndices.length >= 2) {
          const quad1 = new Set(topQuads[selectedIndices[0]].numbers)
          const quad2 = new Set(topQuads[selectedIndices[1]].numbers)

          // 교집합 계산
          const intersection = Array.from(quad1).filter((num) => quad2.has(num))

          // 교집합이 있으면 추가
          if (intersection.length > 0) {
            intersection.forEach((num) => recommendedSet.add(num))
          }

          // 교집합이 없거나 부족하면 두 4쌍둥이에서 번호 추가
          if (recommendedSet.size < 6) {
            // 첫 번째 4쌍둥이에서 추가
            for (const num of topQuads[selectedIndices[0]].numbers) {
              if (!recommendedSet.has(num) && recommendedSet.size < 6) {
                recommendedSet.add(num)
              }
            }

            // 두 번째 4쌍둥이에서 추가
            for (const num of topQuads[selectedIndices[1]].numbers) {
              if (!recommendedSet.has(num) && recommendedSet.size < 6) {
                recommendedSet.add(num)
              }
            }
          }
        }
      }
      // 2. 4쌍둥이가 1개일 때: 4쌍둥이와 3쌍둥이 조합으로 구성
      else if (frequentQuads.length === 1) {
        // 4쌍둥이 번호 추가
        frequentQuads[0].numbers.forEach((num) => recommendedSet.add(num))

        // 남은 자리를 3쌍둥이로 채우기
        if (frequentTriplets.length > 0) {
          // 호환되는 3쌍둥이 찾기 (겹치는 번호가 있는 3쌍둥이)
          const compatibleTriplets = frequentTriplets.filter((triplet) => {
            const overlap = triplet.numbers.filter((num) => recommendedSet.has(num)).length
            return overlap > 0
          })

          if (compatibleTriplets.length > 0) {
            // 호환되는 3쌍둥이 중 랜덤 선택
            const selectedTriplet = compatibleTriplets[Math.floor(Math.random() * compatibleTriplets.length)]

            // 3쌍둥이에서 아직 추가되지 않은 번호만 추가
            for (const num of selectedTriplet.numbers) {
              if (!recommendedSet.has(num) && recommendedSet.size < 6) {
                recommendedSet.add(num)
              }
            }
          } else {
            // 호환되는 3쌍둥이가 없으면 상위 3쌍둥이에서 랜덤 선택
            const selectedTriplet = frequentTriplets[Math.floor(Math.random() * Math.min(3, frequentTriplets.length))]

            // 3쌍둥이에서 아직 추가되지 않은 번호만 추가
            for (const num of selectedTriplet.numbers) {
              if (!recommendedSet.has(num) && recommendedSet.size < 6) {
                recommendedSet.add(num)
              }
            }
          }
        }
      }
      // 3. 4쌍둥이가 없을 경우: 3쌍둥이로 조합
      else if (frequentTriplets.length > 0) {
        // 상위 3쌍둥이 2개 선택
        const maxTripletsToUse = Math.min(2, frequentTriplets.length)
        const selectedTripletIndices: number[] = []

        while (selectedTripletIndices.length < maxTripletsToUse) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, frequentTriplets.length))
          if (!selectedTripletIndices.includes(randomIndex)) {
            selectedTripletIndices.push(randomIndex)
          }
        }

        // 선택된 3쌍둥이 번호 추가
        for (const index of selectedTripletIndices) {
          for (const num of frequentTriplets[index].numbers) {
            if (!recommendedSet.has(num) && recommendedSet.size < 6) {
              recommendedSet.add(num)
            }
          }
        }
      }

      // 4. 번호 균형 고려: 아직 6개가 안 되면 번호 범위별로 균형있게 채우기
      if (recommendedSet.size < 6) {
        // 현재 선택된 번호들의 범위 분포 확인
        const lowRange = Array.from(recommendedSet).filter((num) => num >= 1 && num <= 15).length
        const midRange = Array.from(recommendedSet).filter((num) => num >= 16 && num <= 30).length
        const highRange = Array.from(recommendedSet).filter((num) => num >= 31 && num <= 45).length

        // 각 범위별 이상적인 분포 (균형 있는 분포를 위해)
        const idealLow = 2 // 1-15 범위에서 약 2개
        const idealMid = 2 // 16-30 범위에서 약 2개
        const idealHigh = 2 // 31-45 범위에서 약 2개

        // 부족한 범위 계산
        const needLow = Math.max(0, idealLow - lowRange)
        const needMid = Math.max(0, idealMid - midRange)
        const needHigh = Math.max(0, idealHigh - highRange)

        // 각 범위별 사용 가능한 번호 (이미 선택되지 않은 번호)
        const availableLow = Array.from({ length: 15 }, (_, i) => i + 1).filter((num) => !recommendedSet.has(num))
        const availableMid = Array.from({ length: 15 }, (_, i) => i + 16).filter((num) => !recommendedSet.has(num))
        const availableHigh = Array.from({ length: 15 }, (_, i) => i + 31).filter((num) => !recommendedSet.has(num))

        // 최근 당첨 빈도와 휴면 기간을 고려한 가중치 계산
        const getWeightedNumber = (numbers: number[]): number => {
          if (numbers.length === 0) return 0

          // 가중치 계산
          const weights = numbers.map((num) => {
            // 1. 유사 당첨 번호에서의 빈도
            const similarFrequency = frequentNumbers[num] || 0

            // 2. 최근 당첨 빈도
            const recentFrequency = recentFrequencies.find((f) => f.number === num)?.count || 0

            // 3. 휴면 기간 (오래 안 나온 번호에 가중치 부여)
            const dormancy = dormancyPeriods.find((d) => d.number === num)?.dormancyPeriod || 0
            const dormancyWeight = Math.min(dormancy / 10, 3) // 최대 3점까지 가중치 부여

            // 가중치 합산 (각 요소별 중요도 조정)
            const weight = 1 + similarFrequency * 2 + recentFrequency * 0.5 + dormancyWeight

            return { num, weight }
          })

          // 가중치 합계 계산
          const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0)

          // 랜덤 가중치 값 선택
          let random = Math.random() * totalWeight

          // 가중치에 따라 번호 선택
          for (const item of weights) {
            random -= item.weight
            if (random <= 0) {
              return item.num
            }
          }

          // 기본값 (가중치 계산에 문제가 있을 경우)
          return numbers[Math.floor(Math.random() * numbers.length)]
        }

        // 각 범위에서 필요한 만큼 번호 추가 (가중치 기반)
        for (let i = 0; i < needLow && availableLow.length > 0 && recommendedSet.size < 6; i++) {
          const selectedNum = getWeightedNumber(availableLow)
          recommendedSet.add(selectedNum)
          availableLow.splice(availableLow.indexOf(selectedNum), 1)
        }

        for (let i = 0; i < needMid && availableMid.length > 0 && recommendedSet.size < 6; i++) {
          const selectedNum = getWeightedNumber(availableMid)
          recommendedSet.add(selectedNum)
          availableMid.splice(availableMid.indexOf(selectedNum), 1)
        }

        for (let i = 0; i < needHigh && availableHigh.length > 0 && recommendedSet.size < 6; i++) {
          const selectedNum = getWeightedNumber(availableHigh)
          recommendedSet.add(selectedNum)
          availableHigh.splice(availableHigh.indexOf(selectedNum), 1)
        }
      }

      // 5. 아직도 6개가 안 되면 2쌍둥이 활용
      if (recommendedSet.size < 6 && frequentPairs.length > 0) {
        // 현재 선택된 번호와 호환되는 2쌍둥이 찾기
        const compatiblePairs = frequentPairs.filter((pair) => {
          // 이미 선택된 번호와 겹치는 번호가 있는지 확인
          return pair.numbers.some((num) => recommendedSet.has(num))
        })

        if (compatiblePairs.length > 0) {
          // 호환되는 2쌍둥이 중 랜덤 선택
          const selectedPair = compatiblePairs[Math.floor(Math.random() * compatiblePairs.length)]

          // 2쌍둥이에서 아직 추가되지 않은 번호만 추가
          for (const num of selectedPair.numbers) {
            if (!recommendedSet.has(num) && recommendedSet.size < 6) {
              recommendedSet.add(num)
            }
          }
        }
      }

      // 6. 최종적으로 부족한 번호는 랜덤으로 채우기
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((num) => !recommendedSet.has(num))

      while (recommendedSet.size < 6 && availableNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length)
        recommendedSet.add(availableNumbers[randomIndex])
        availableNumbers.splice(randomIndex, 1)
      }

      // 번호 정렬
      sortedRecommendedNumbers = Array.from(recommendedSet).sort((a, b) => a - b)

      // 7. 번호 검증 및 점수 계산
      const validateAndScore = (numbers: number[]): { isValid: boolean; score: number } => {
        const sortedNumbers = [...numbers].sort((a, b) => a - b)

        // 기본 유효성 검사
        // 연속된 번호가 3개 이상 있는지 확인
        let consecutiveCount = 1
        for (let i = 1; i < sortedNumbers.length; i++) {
          if (sortedNumbers[i] === sortedNumbers[i - 1] + 1) {
            consecutiveCount++
            if (consecutiveCount >= 3) {
              return { isValid: false, score: 0 }
            }
          } else {
            consecutiveCount = 1
          }
        }

        // 번호 간 간격이 너무 큰 경우 확인 (15 이상)
        for (let i = 1; i < sortedNumbers.length; i++) {
          if (sortedNumbers[i] - sortedNumbers[i - 1] >= 15) {
            return { isValid: false, score: 0 }
          }
        }

        // 이미 당첨된 번호인지 확인
        const isDuplicateWinning = winningNumbers.some((draw) => {
          const sortedDrawNumbers = [...draw.numbers].sort((a, b) => a - b)
          return sortedDrawNumbers.every((num, index) => num === sortedNumbers[index])
        })

        if (isDuplicateWinning) {
          return { isValid: false, score: 0 }
        }

        // 점수 계산 시작
        let score = 0

        // 1. 홀짝 비율 점수 (목표 홀수 개수에 가까울수록 높은 점수)
        const oddCount = sortedNumbers.filter((num) => num % 2 === 1).length
        const oddScore = 10 - Math.abs(oddCount - targetOddCount) * 2 // 최대 10점
        score += oddScore

        // 2. 번호 합계 점수 (개선된 범위 점수)
        const sum = sortedNumbers.reduce((acc, num) => acc + num, 0)
        let sumScore = 0
        if (sum >= 115 && sum <= 145) {
          sumScore = 15 // 가장 이상적인 범위 (더 좁은 범위로 조정)
        } else if (sum >= 100 && sum <= 160) {
          sumScore = 10 // 차선책 범위
        } else if (sum >= 90 && sum <= 170) {
          sumScore = 5 // 허용 가능한 범위
        }
        score += sumScore

        // 3. 번호 간격 점수 (개선된 간격 분석)
        let gapScore = 0
        let smallGaps = 0
        let mediumGaps = 0
        let largeGaps = 0
        let totalGapValue = 0

        for (let i = 1; i < sortedNumbers.length; i++) {
          const gap = sortedNumbers[i] - sortedNumbers[i - 1]
          totalGapValue += gap

          if (gap <= 3) smallGaps++
          else if (gap <= 8) mediumGaps++
          else largeGaps++
        }

        // 이상적인 간격 분포: 작은 간격 1-2개, 중간 간격 2-3개, 큰 간격 0-1개
        if (smallGaps >= 1 && smallGaps <= 2 && mediumGaps >= 2 && largeGaps <= 1) {
          gapScore = 15
        } else if (smallGaps <= 3 && mediumGaps >= 1 && largeGaps <= 2) {
          gapScore = 10
        } else if (smallGaps + mediumGaps >= 3) {
          gapScore = 5
        }

        // 평균 간격 점수 추가 (이상적인 평균 간격은 7-9)
        const avgGap = totalGapValue / 5
        if (avgGap >= 7 && avgGap <= 9) {
          gapScore += 5
        } else if (avgGap >= 6 && avgGap <= 10) {
          gapScore += 3
        }

        score += gapScore

        // 4. 번호 범위 분포 점수 (개선된 분포 분석)
        const lowRange = sortedNumbers.filter((num) => num >= 1 && num <= 15).length
        const midRange = sortedNumbers.filter((num) => num >= 16 && num <= 30).length
        const highRange = sortedNumbers.filter((num) => num >= 31 && num <= 45).length

        // 이상적인 분포: 각 범위에서 1-3개, 특히 중간 범위에서 2-3개
        let rangeScore = 0
        if (lowRange >= 1 && lowRange <= 3 && midRange >= 2 && midRange <= 3 && highRange >= 1 && highRange <= 3) {
          rangeScore = 15 // 최적의 분포
        } else if (lowRange >= 1 && midRange >= 1 && highRange >= 1) {
          rangeScore = 10 // 모든 범위에 최소 1개 이상
        } else {
          rangeScore = 5 // 기본 점수
        }
        score += rangeScore

        // 5. 최근 당첨 빈도 점수 (개선된 빈도 분석)
        let recentFrequencyScore = 0
        const frequencyCounts = {
          low: 0, // 0-1회
          medium: 0, // 2-3회
          high: 0, // 4회 이상
        }

        sortedNumbers.forEach((num) => {
          const freq = recentFrequencies.find((f) => f.number === num)?.count || 0
          if (freq <= 1) frequencyCounts.low++
          else if (freq <= 3) frequencyCounts.medium++
          else frequencyCounts.high++
        })

        // 이상적인 빈도 분포: 낮은 빈도 2-3개, 중간 빈도 2-3개, 높은 빈도 0-1개
        if (frequencyCounts.low >= 2 && frequencyCounts.medium >= 2 && frequencyCounts.high <= 1) {
          recentFrequencyScore = 15
        } else if (frequencyCounts.low >= 1 && frequencyCounts.medium >= 1 && frequencyCounts.high <= 2) {
          recentFrequencyScore = 10
        } else {
          recentFrequencyScore = 5
        }
        score += recentFrequencyScore

        // 6. 휴면 기간 점수 (개선된 휴면 기간 분석)
        const dormancyCounts = {
          short: 0, // 0-9회
          medium: 0, // 10-19회
          long: 0, // 20회 이상
        }

        sortedNumbers.forEach((num) => {
          const dormancy = dormancyPeriods.find((d) => d.number === num)?.dormancyPeriod || 0
          if (dormancy < 10) dormancyCounts.short++
          else if (dormancy < 20) dormancyCounts.medium++
          else dormancyCounts.long++
        })

        // 이상적인 휴면 기간 분포: 짧은 휴면 2-3개, 중간 휴면 2-3개, 긴 휴면 1개
        let dormancyScore = 0
        if (dormancyCounts.short >= 2 && dormancyCounts.medium >= 1 && dormancyCounts.long === 1) {
          dormancyScore = 15
        } else if (dormancyCounts.short >= 1 && dormancyCounts.medium >= 1 && dormancyCounts.long <= 2) {
          dormancyScore = 10
        } else if (dormancyCounts.long >= 1) {
          dormancyScore = 5
        }
        score += dormancyScore

        // 7. 유사 당첨 번호와의 일치도 점수
        let similarityScore = 0
        if (similarDraws.length > 0) {
          // 각 유사 당첨 번호와의 일치하는 번호 개수 계산
          const matchCounts = similarDraws.map((draw) => {
            return sortedNumbers.filter((num) => draw.numbers.includes(num)).length
          })

          // 최대 일치 개수
          const maxMatches = Math.max(...matchCounts)

          // 이상적인 일치 개수: 2-3개 (너무 많으면 이미 당첨된 번호와 유사, 너무 적으면 패턴 활용 X)
          if (maxMatches >= 2 && maxMatches <= 3) {
            similarityScore = 10
          } else if (maxMatches === 1 || maxMatches === 4) {
            similarityScore = 5
          }
        }
        score += similarityScore

        return { isValid: true, score }
      }

      // 번호 검증 및 점수 계산
      const { isValid, score } = validateAndScore(sortedRecommendedNumbers)

      // 유효하고 현재까지의 최고 점수보다 높으면 저장
      if (isValid && score > bestScore) {
        bestScore = score
        bestNumbers = [...sortedRecommendedNumbers]

        // 점수가 충분히 높으면 바로 종료
        if (score >= 40) {
          validNumbersFound = true
          break
        }
      }

      // 유효한 번호를 찾았고 마지막 시도이거나 점수가 충분히 높으면 종료
      if (isValid && (attempts === MAX_ATTEMPTS || score >= 35)) {
        validNumbersFound = true
        break
      }
    }

    // 최종 번호 선택 (최고 점수 번호 또는 마지막으로 생성된 유효한 번호)
    if (bestScore > 0) {
      sortedRecommendedNumbers = bestNumbers

      // 추천 품질 설정 (점수 범위 확장 및 세분화)
      if (bestScore >= 75) {
        setRecommendationQuality("최상급")
      } else if (bestScore >= 65) {
        setRecommendationQuality("최상")
      } else if (bestScore >= 55) {
        setRecommendationQuality("상급")
      } else if (bestScore >= 45) {
        setRecommendationQuality("상")
      } else if (bestScore >= 35) {
        setRecommendationQuality("중상")
      } else if (bestScore >= 25) {
        setRecommendationQuality("중")
      } else if (bestScore >= 15) {
        setRecommendationQuality("보통")
      } else {
        setRecommendationQuality("기본")
      }
    } else {
      // 모든 시도가 실패했을 경우 랜덤 번호 생성
      const randomNumbers = new Set<number>()
      while (randomNumbers.size < 6) {
        randomNumbers.add(Math.floor(Math.random() * 45) + 1)
      }
      sortedRecommendedNumbers = Array.from(randomNumbers).sort((a, b) => a - b)
      setRecommendationQuality("랜덤")
    }

    setRecommendedNumbers(sortedRecommendedNumbers)
    if (onRecommendationGenerated) {
      onRecommendationGenerated(sortedRecommendedNumbers)
    }
    setIsGenerating(false)
  }, [multipleNumbers, similarDraws, onRecommendationGenerated])

  // 초기 마운트 시 한 번만 실행
  useEffect(() => {
    if (multipleNumbers.length > 0) {
      generateRecommendedNumbers()
    }
  }, []) // 빈 의존성 배열로 초기 마운트 시에만 실행

  // forceRefresh가 변경될 때만 실행
  useEffect(() => {
    // forceRefresh가 undefined가 아니고, 이전 값과 다를 때만 실행
    if (forceRefresh !== undefined && forceRefresh !== lastForceRefresh) {
      setLastForceRefresh(forceRefresh)
      if (multipleNumbers.length > 0) {
        generateRecommendedNumbers()
      }
    }
  }, [forceRefresh, lastForceRefresh, multipleNumbers.length, generateRecommendedNumbers])

  return {
    recommendedNumbers,
    isGenerating,
    isSaved,
    setIsSaved,
    recommendationQuality,
    generateRecommendedNumbers,
  }
}
