import { WinningLottoNumbers } from "@/types/lotto"

// 날짜 간의 개월 수 차이를 계산하는 함수
const getMonthsDifference = (date1: Date, date2: Date) => {
    return (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth())
}

// 두 숫자 배열의 교집합 개수를 구하는 함수
const getIntersectionCount = (arr1: number[], arr2: number[]): number => {
    const set2 = new Set(arr2)
    return arr1.filter((item) => set2.has(item)).length
}

// 1~45 사이의 랜덤 로또 번호 6개를 생성하는 함수
const generateRandomLottoNumbers = (): number[] => {
    const numbers = new Set<number>()
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1)
    }
    return Array.from(numbers).sort((a, b) => a - b)
}

// AI 추천 V2 필터링 로직 함수
// 조건: 5개 일치(전체), 4개 일치(2년), 3개 일치(1개월) 제외
// *수정사항: 보너스 번호는 2등 당첨 여부 확인 시에만 사용되므로, 번호 필터링 기준에서는 메인 번호 6개와의 일치 여부만 판단하도록 수정함
export const generateFilteredNumbers = (history: WinningLottoNumbers[]): number[] | null => {
    if (!history || history.length === 0) return null

    const now = new Date()
    const MAX_ATTEMPTS = 50000

    // 기간별 비교군 데이터 분류
    const historyLast1Months: WinningLottoNumbers[] = []
    const historyLast2Years: WinningLottoNumbers[] = []
    const historyAll: WinningLottoNumbers[] = [...history]

    history.forEach((draw) => {
        const drawDate = new Date(draw.date)
        const monthsDiff = getMonthsDifference(now, drawDate)

        if (monthsDiff <= 1) {
            historyLast1Months.push(draw)
        }
        if (monthsDiff <= 24) {
            historyLast2Years.push(draw)
        }
    })

    // 랜덤 번호 생성 후 조건 검증 반복
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const candidate = generateRandomLottoNumbers()
        let isValid = true

        // 1. 전체 기간 대상 5개 일치 여부 확인 (메인 번호 6개 기준)
        for (const draw of historyAll) {
            const matchCount = getIntersectionCount(candidate, draw.numbers)

            // 메인 번호 6개 중 5개 이상 일치 시 제외 (1등, 2등, 3등 당첨 패턴 차단)
            if (matchCount >= 5) {
                isValid = false
                break
            }
        }
        if (!isValid) continue

        // 2. 최근 2년 대상 4개 일치 여부 확인 (메인 번호 6개 기준)
        for (const draw of historyLast2Years) {
            const matchCount = getIntersectionCount(candidate, draw.numbers)

            // 메인 번호 6개 중 4개 이상 일치 시 제외 (4등 당첨 패턴 차단)
            if (matchCount >= 4) {
                isValid = false
                break
            }
        }
        if (!isValid) continue

        // 3. 최근 1개월 대상 3개 일치 여부 확인 (메인 번호 6개 기준)
        for (const draw of historyLast1Months) {
            const matchCount = getIntersectionCount(candidate, draw.numbers)

            // 메인 번호 6개 중 3개 이상 일치 시 제외 (5등 당첨 패턴 차단)
            if (matchCount >= 3) {
                isValid = false
                break
            }
        }

        // 모든 조건을 통과하면 해당 번호 반환
        if (isValid) {
            return candidate
        }
    }

    return null
}