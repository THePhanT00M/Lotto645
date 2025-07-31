// 로또 번호판 격자 분석을 위한 유틸리티 함수들

export interface GridPosition {
  row: number
  col: number
}

export interface SymmetryAnalysis {
  verticalSymmetry: number
  horizontalSymmetry: number
  diagonal1Symmetry: number
  diagonal2Symmetry: number
  pointSymmetry: number
  overallSymmetry: number
}

// 번호를 7x7 격자의 위치로 변환
export function numberToGridPosition(number: number): GridPosition {
  if (number < 1 || number > 45) {
    throw new Error("번호는 1-45 사이여야 합니다.")
  }

  const row = Math.floor((number - 1) / 7)
  const col = (number - 1) % 7

  return { row, col }
}

// 격자 위치를 번호로 변환
export function gridPositionToNumber(position: GridPosition): number {
  const { row, col } = position

  if (row < 0 || row > 6 || col < 0 || col > 6) {
    throw new Error("격자 위치가 유효하지 않습니다.")
  }

  const number = row * 7 + col + 1
  return number <= 45 ? number : -1 // 45를 초과하면 -1 반환
}

// 7x7 격자 시각화
export function visualizeGrid(selectedNumbers: number[] = []): string {
  let grid = ""

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const number = gridPositionToNumber({ row, col })

      if (number === -1 || number > 45) {
        grid += "   " // 빈 공간
      } else {
        const isSelected = selectedNumbers.includes(number)
        const numberStr = number.toString().padStart(2, " ")
        grid += isSelected ? `[${numberStr}]` : ` ${numberStr} `
      }

      if (col < 6) grid += " "
    }
    grid += "\n"
  }

  return grid
}

// 상세한 대칭성 분석
export function analyzeDetailedSymmetry(numbers: number[]): SymmetryAnalysis {
  const positions = numbers.map(numberToGridPosition)

  // 수직 대칭 (중앙 세로축 기준, col = 3)
  let verticalPairs = 0
  let verticalMatches = 0

  positions.forEach((pos) => {
    const mirrorCol = 6 - pos.col
    if (pos.col !== 3 && mirrorCol !== pos.col) {
      // 중앙 열 제외
      verticalPairs++
      const mirrorNumber = gridPositionToNumber({ row: pos.row, col: mirrorCol })
      if (mirrorNumber !== -1 && numbers.includes(mirrorNumber)) {
        verticalMatches++
      }
    }
  })

  // 수평 대칭 (중앙 가로축 기준, row = 3)
  let horizontalPairs = 0
  let horizontalMatches = 0

  positions.forEach((pos) => {
    const mirrorRow = 6 - pos.row
    if (pos.row !== 3 && mirrorRow !== pos.row) {
      // 중앙 행 제외
      horizontalPairs++
      const mirrorNumber = gridPositionToNumber({ row: mirrorRow, col: pos.col })
      if (mirrorNumber !== -1 && numbers.includes(mirrorNumber)) {
        horizontalMatches++
      }
    }
  })

  // 대각선 대칭 1 (좌상-우하)
  let diagonal1Pairs = 0
  let diagonal1Matches = 0

  positions.forEach((pos) => {
    if (pos.row !== pos.col) {
      // 주 대각선 제외
      diagonal1Pairs++
      const mirrorNumber = gridPositionToNumber({ row: pos.col, col: pos.row })
      if (mirrorNumber !== -1 && numbers.includes(mirrorNumber)) {
        diagonal1Matches++
      }
    }
  })

  // 대각선 대칭 2 (우상-좌하)
  let diagonal2Pairs = 0
  let diagonal2Matches = 0

  positions.forEach((pos) => {
    const mirrorRow = 6 - pos.col
    const mirrorCol = 6 - pos.row
    if (pos.row + pos.col !== 6) {
      // 반 대각선 제외
      diagonal2Pairs++
      const mirrorNumber = gridPositionToNumber({ row: mirrorRow, col: mirrorCol })
      if (mirrorNumber !== -1 && numbers.includes(mirrorNumber)) {
        diagonal2Matches++
      }
    }
  })

  // 점 대칭 (중앙점 기준)
  let pointPairs = 0
  let pointMatches = 0

  positions.forEach((pos) => {
    const mirrorRow = 6 - pos.row
    const mirrorCol = 6 - pos.col
    if (!(pos.row === 3 && pos.col === 3)) {
      // 중앙점 제외
      pointPairs++
      const mirrorNumber = gridPositionToNumber({ row: mirrorRow, col: mirrorCol })
      if (mirrorNumber !== -1 && numbers.includes(mirrorNumber)) {
        pointMatches++
      }
    }
  })

  return {
    verticalSymmetry: verticalPairs > 0 ? verticalMatches / verticalPairs : 0,
    horizontalSymmetry: horizontalPairs > 0 ? horizontalMatches / horizontalPairs : 0,
    diagonal1Symmetry: diagonal1Pairs > 0 ? diagonal1Matches / diagonal1Pairs : 0,
    diagonal2Symmetry: diagonal2Pairs > 0 ? diagonal2Matches / diagonal2Pairs : 0,
    pointSymmetry: pointPairs > 0 ? pointMatches / pointPairs : 0,
    overallSymmetry:
      (verticalMatches + horizontalMatches + diagonal1Matches + diagonal2Matches + pointMatches) /
      (verticalPairs + horizontalPairs + diagonal1Pairs + diagonal2Pairs + pointPairs),
  }
}

// 격자 패턴 분석
export function analyzeGridPatterns(numbers: number[]): {
  rowDistribution: number[]
  colDistribution: number[]
  quadrantDistribution: number[]
  centerDistance: number
  edgeCount: number
  cornerCount: number
} {
  const positions = numbers.map(numberToGridPosition)

  // 행별 분포
  const rowDistribution = Array(7).fill(0)
  positions.forEach((pos) => {
    if (pos.row < 7) rowDistribution[pos.row]++
  })

  // 열별 분포
  const colDistribution = Array(7).fill(0)
  positions.forEach((pos) => {
    if (pos.col < 7) colDistribution[pos.col]++
  })

  // 사분면 분포 (3x3 중앙을 제외한 4개 사분면)
  const quadrantDistribution = Array(4).fill(0)
  positions.forEach((pos) => {
    if (pos.row < 3 && pos.col < 3)
      quadrantDistribution[0]++ // 좌상
    else if (pos.row < 3 && pos.col > 3)
      quadrantDistribution[1]++ // 우상
    else if (pos.row > 3 && pos.col < 3)
      quadrantDistribution[2]++ // 좌하
    else if (pos.row > 3 && pos.col > 3) quadrantDistribution[3]++ // 우하
  })

  // 중앙점(3,3)으로부터의 평균 거리
  const centerDistance =
    positions.reduce((sum, pos) => {
      const distance = Math.sqrt(Math.pow(pos.row - 3, 2) + Math.pow(pos.col - 3, 2))
      return sum + distance
    }, 0) / positions.length

  // 가장자리 번호 개수 (첫 번째/마지막 행 또는 열)
  const edgeCount = positions.filter((pos) => pos.row === 0 || pos.row === 6 || pos.col === 0 || pos.col === 6).length

  // 모서리 번호 개수
  const cornerCount = positions.filter(
    (pos) => (pos.row === 0 || pos.row === 6) && (pos.col === 0 || pos.col === 6),
  ).length

  return {
    rowDistribution,
    colDistribution,
    quadrantDistribution,
    centerDistance,
    edgeCount,
    cornerCount,
  }
}

// 인접성 분석
export function analyzeAdjacency(numbers: number[]): {
  adjacentPairs: number
  diagonalPairs: number
  isolatedNumbers: number
  clusters: number[][]
} {
  const positions = numbers.map(numberToGridPosition)
  const positionSet = new Set(positions.map((p) => `${p.row},${p.col}`))

  let adjacentPairs = 0
  let diagonalPairs = 0
  let isolatedNumbers = 0

  // 인접한 쌍과 대각선 쌍 계산
  positions.forEach((pos) => {
    let hasAdjacent = false
    let hasDiagonal = false

    // 8방향 확인
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue

        const newRow = pos.row + dr
        const newCol = pos.col + dc

        if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
          if (positionSet.has(`${newRow},${newCol}`)) {
            if (dr === 0 || dc === 0) {
              hasAdjacent = true
              adjacentPairs++
            } else {
              hasDiagonal = true
              diagonalPairs++
            }
          }
        }
      }
    }

    if (!hasAdjacent && !hasDiagonal) {
      isolatedNumbers++
    }
  })

  // 클러스터 찾기 (연결된 번호들의 그룹)
  const visited = new Set<string>()
  const clusters: number[][] = []

  positions.forEach((pos) => {
    const key = `${pos.row},${pos.col}`
    if (!visited.has(key)) {
      const cluster: number[] = []
      const stack = [pos]

      while (stack.length > 0) {
        const current = stack.pop()!
        const currentKey = `${current.row},${current.col}`

        if (visited.has(currentKey)) continue
        visited.add(currentKey)

        const number = gridPositionToNumber(current)
        if (number !== -1) cluster.push(number)

        // 인접한 위치 확인
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue

            const newRow = current.row + dr
            const newCol = current.col + dc
            const newKey = `${newRow},${newCol}`

            if (
              newRow >= 0 &&
              newRow < 7 &&
              newCol >= 0 &&
              newCol < 7 &&
              positionSet.has(newKey) &&
              !visited.has(newKey)
            ) {
              stack.push({ row: newRow, col: newCol })
            }
          }
        }
      }

      if (cluster.length > 0) {
        clusters.push(cluster.sort((a, b) => a - b))
      }
    }
  })

  return {
    adjacentPairs: adjacentPairs / 2, // 중복 제거
    diagonalPairs: diagonalPairs / 2, // 중복 제거
    isolatedNumbers,
    clusters,
  }
}
