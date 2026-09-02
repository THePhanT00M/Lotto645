import {
  collinearTripleCount,
  convexHull,
  centroid,
  meanNearestNeighborDistance,
  minimumSpanningTreeLength,
  polygonArea,
  polygonPerimeter,
  principalAxes,
} from "./geometry"
import { GRID_COLUMNS, isDiagonalNeighbor, isEdgeCell, isOrthogonalNeighbor, toGridPoints } from "./grid"

/**
 * 용지 위 모양에서 뽑아내는 특징
 *
 * 번호를 더하거나 홀짝을 세는 지표는 쓰지 않는다. 여섯 개를 용지에 찍고
 * 선으로 이었을 때 드러나는 모양, 즉 넓이·길이·방향·이웃 관계만 본다.
 */
export interface PatternFeatures {
  /** 여섯 점을 감싸는 테두리의 넓이 */
  hullArea: number
  /** 그 테두리의 둘레 */
  hullPerimeter: number
  /** 여섯 점을 가장 짧게 모두 이었을 때의 선 길이 */
  mstLength: number
  /** 각 점에서 가장 가까운 이웃까지 거리의 평균 */
  nearestMean: number
  /** 주축 방향의 퍼짐 */
  spreadMajor: number
  /** 부축 방향의 퍼짐 */
  spreadMinor: number
  /** 한 줄에 가까운 정도 */
  eccentricity: number
  /** 주축 기울기 (방향의 주기성을 살리려 2θ의 사인·코사인으로 나눈다) */
  axisSin: number
  axisCos: number
  /** 한 직선 위에 놓인 세 점 조합 수 */
  collinearTriples: number
  /** 상하좌우로 붙어 있는 쌍의 수 */
  orthogonalPairs: number
  /** 대각으로 붙어 있는 쌍의 수 */
  diagonalPairs: number
  /** 번호가 걸친 가로줄 수 */
  rowsUsed: number
  /** 번호가 걸친 세로줄 수 */
  columnsUsed: number
  /** 한 가로줄에 몰린 최대 개수 */
  maxPerRow: number
  /** 한 세로줄에 몰린 최대 개수 */
  maxPerColumn: number
  /** 용지 가장자리 칸의 수 */
  edgeCells: number
  /** 무게중심의 가로 위치 */
  centerCol: number
  /** 무게중심의 세로 위치 */
  centerRow: number
  /** 가로로 벌어진 폭 */
  spanCol: number
  /** 세로로 벌어진 폭 */
  spanRow: number
}

/** 특징 벡터에서 값을 꺼내는 순서. 학습과 통계 계산이 같은 순서를 공유한다. */
export const FEATURE_KEYS = [
  "hullArea",
  "hullPerimeter",
  "mstLength",
  "nearestMean",
  "spreadMajor",
  "spreadMinor",
  "eccentricity",
  "axisSin",
  "axisCos",
  "collinearTriples",
  "orthogonalPairs",
  "diagonalPairs",
  "rowsUsed",
  "columnsUsed",
  "maxPerRow",
  "maxPerColumn",
  "edgeCells",
  "centerCol",
  "centerRow",
  "spanCol",
  "spanRow",
] as const satisfies readonly (keyof PatternFeatures)[]

export const FEATURE_COUNT = FEATURE_KEYS.length


/** 번호 조합에서 용지 모양 특징을 뽑는다. */
export const extractFeatures = (numbers: readonly number[]): PatternFeatures => {
  const points = toGridPoints(numbers)
  const hull = convexHull(points)
  const axes = principalAxes(points)
  const center = centroid(points)

  const rowCounts = new Map<number, number>()
  const colCounts = new Map<number, number>()
  for (const point of points) {
    rowCounts.set(point.row, (rowCounts.get(point.row) ?? 0) + 1)
    colCounts.set(point.col, (colCounts.get(point.col) ?? 0) + 1)
  }

  let orthogonalPairs = 0
  let diagonalPairs = 0
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (isOrthogonalNeighbor(points[i], points[j])) orthogonalPairs++
      else if (isDiagonalNeighbor(points[i], points[j])) diagonalPairs++
    }
  }

  const cols = points.map((p) => p.col)
  const rows = points.map((p) => p.row)

  return {
    hullArea: polygonArea(hull),
    hullPerimeter: polygonPerimeter(hull),
    mstLength: minimumSpanningTreeLength(points),
    nearestMean: meanNearestNeighborDistance(points),
    spreadMajor: axes.major,
    spreadMinor: axes.minor,
    eccentricity: axes.eccentricity,
    axisSin: Math.sin(2 * axes.angle),
    axisCos: Math.cos(2 * axes.angle),
    collinearTriples: collinearTripleCount(points),
    orthogonalPairs,
    diagonalPairs,
    rowsUsed: rowCounts.size,
    columnsUsed: colCounts.size,
    maxPerRow: Math.max(...rowCounts.values()),
    maxPerColumn: Math.max(...colCounts.values()),
    edgeCells: points.filter(isEdgeCell).length,
    centerCol: center.col,
    centerRow: center.row,
    spanCol: Math.max(...cols) - Math.min(...cols),
    spanRow: Math.max(...rows) - Math.min(...rows),
  }
}

/** 특징을 학습에 쓰는 숫자 배열로 편다. */
export const toFeatureVector = (features: PatternFeatures): number[] =>
    FEATURE_KEYS.map((key) => features[key])

/** 번호 조합에서 곧바로 특징 벡터를 만든다. */
export const featureVectorOf = (numbers: readonly number[]): number[] =>
    toFeatureVector(extractFeatures(numbers))

/** 용지 한 줄의 칸 수. 시각화에서도 같은 값을 쓴다. */
export { GRID_COLUMNS }
