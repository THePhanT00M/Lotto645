import { distance, type GridPoint } from "./grid"

/** 부동소수 비교에 쓰는 허용 오차 */
const EPSILON = 1e-9

/** 세 점의 방향을 판별하는 외적. 0이면 한 직선 위에 있다. */
const cross = (o: GridPoint, a: GridPoint, b: GridPoint): number =>
    (a.col - o.col) * (b.row - o.row) - (a.row - o.row) * (b.col - o.col)

/**
 * 볼록 껍질을 구한다 (앤드루 모노톤 체인).
 *
 * 점들을 감싸는 가장 바깥 테두리로, 조합이 용지에서 차지하는 영역의 모양을 준다.
 */
export const convexHull = (points: readonly GridPoint[]): GridPoint[] => {
  if (points.length < 3) return [...points]

  const sorted = [...points].sort((a, b) => a.col - b.col || a.row - b.row)
  const build = (source: GridPoint[]): GridPoint[] => {
    const chain: GridPoint[] = []
    for (const point of source) {
      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) {
        chain.pop()
      }
      chain.push(point)
    }
    chain.pop()
    return chain
  }

  return [...build(sorted), ...build([...sorted].reverse())]
}

/** 다각형의 넓이 (신발끈 공식) */
export const polygonArea = (polygon: readonly GridPoint[]): number => {
  if (polygon.length < 3) return 0

  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i]
    const next = polygon[(i + 1) % polygon.length]
    sum += current.col * next.row - next.col * current.row
  }

  return Math.abs(sum) / 2
}

/** 다각형의 둘레 */
export const polygonPerimeter = (polygon: readonly GridPoint[]): number => {
  if (polygon.length < 2) return 0

  let total = 0
  for (let i = 0; i < polygon.length; i++) {
    total += distance(polygon[i], polygon[(i + 1) % polygon.length])
  }

  return total
}

/**
 * 최소 신장 트리의 총 길이 (프림 알고리즘).
 *
 * 여섯 점을 가장 짧게 모두 잇는 선의 길이로, 번호들이 뭉쳐 있는지 흩어져 있는지를 나타낸다.
 */
export const minimumSpanningTreeLength = (points: readonly GridPoint[]): number => {
  if (points.length < 2) return 0

  const visited = new Array(points.length).fill(false)
  const best = new Array(points.length).fill(Infinity)
  best[0] = 0
  let total = 0

  for (let step = 0; step < points.length; step++) {
    let pick = -1
    for (let i = 0; i < points.length; i++) {
      if (!visited[i] && (pick === -1 || best[i] < best[pick])) pick = i
    }

    visited[pick] = true
    total += best[pick]

    for (let i = 0; i < points.length; i++) {
      if (visited[i]) continue
      const d = distance(points[pick], points[i])
      if (d < best[i]) best[i] = d
    }
  }

  return total
}

/** 각 점에서 가장 가까운 다른 점까지의 거리 평균 */
export const meanNearestNeighborDistance = (points: readonly GridPoint[]): number => {
  if (points.length < 2) return 0

  let total = 0
  for (let i = 0; i < points.length; i++) {
    let nearest = Infinity
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue
      nearest = Math.min(nearest, distance(points[i], points[j]))
    }
    total += nearest
  }

  return total / points.length
}

/** 한 직선 위에 놓인 세 점 조합의 개수 */
export const collinearTripleCount = (points: readonly GridPoint[]): number => {
  let count = 0

  for (let i = 0; i < points.length - 2; i++) {
    for (let j = i + 1; j < points.length - 1; j++) {
      for (let k = j + 1; k < points.length; k++) {
        if (Math.abs(cross(points[i], points[j], points[k])) < EPSILON) count++
      }
    }
  }

  return count
}

/** 점들의 무게중심 */
export const centroid = (points: readonly GridPoint[]): GridPoint => {
  const sum = points.reduce((acc, p) => ({ col: acc.col + p.col, row: acc.row + p.row }), { col: 0, row: 0 })
  return { col: sum.col / points.length, row: sum.row / points.length }
}

/** 점 분포의 주축 분석 결과 */
export interface PrincipalAxes {
  /** 큰 쪽 고윳값 (주축 방향의 분산) */
  major: number
  /** 작은 쪽 고윳값 */
  minor: number
  /** 주축이 가로축과 이루는 각 (라디안, -π/2 ~ π/2) */
  angle: number
  /** 얼마나 한 줄에 가까운지 (0이면 원형, 1에 가까울수록 직선) */
  eccentricity: number
}

/**
 * 점 분포의 2×2 관성 행렬을 고윳값 분해한다.
 *
 * 대칭 2×2 행렬이라 근의 공식으로 고윳값을 바로 구할 수 있다.
 * 주축이 길고 부축이 짧을수록 번호들이 한 방향으로 늘어서 있다는 뜻이다.
 */
export const principalAxes = (points: readonly GridPoint[]): PrincipalAxes => {
  const center = centroid(points)

  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const point of points) {
    const dx = point.col - center.col
    const dy = point.row - center.row
    sxx += dx * dx
    syy += dy * dy
    sxy += dx * dy
  }

  const n = points.length
  sxx /= n
  syy /= n
  sxy /= n

  const trace = sxx + syy
  const gap = Math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy)
  const major = (trace + gap) / 2
  const minor = (trace - gap) / 2

  return {
    major,
    minor,
    angle: 0.5 * Math.atan2(2 * sxy, sxx - syy),
    eccentricity: major <= EPSILON ? 0 : Math.sqrt(Math.max(0, 1 - minor / major)),
  }
}
