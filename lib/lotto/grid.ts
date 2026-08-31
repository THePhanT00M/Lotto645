import { ALL_NUMBERS, MAX_NUMBER } from "./constants"

/**
 * 로또 용지 격자
 *
 * 실제 마킹 용지는 한 줄에 7칸씩 놓이고 마지막 줄에만 43·44·45가 온다.
 * 번호를 이 좌표계 위의 점으로 옮겨야 "선으로 이어 만든 모양"을 다룰 수 있다.
 */
export const GRID_COLUMNS = 7

/** 마지막 줄까지 포함한 행 수 */
export const GRID_ROWS = Math.ceil(MAX_NUMBER / GRID_COLUMNS)

/** 용지 위의 한 점 */
export interface GridPoint {
  /** 가로 위치 (0 ~ 6) */
  col: number
  /** 세로 위치 (0 ~ 6) */
  row: number
}

/** 번호가 놓이는 용지 좌표를 구한다. */
export const toGridPoint = (number: number): GridPoint => ({
  col: (number - 1) % GRID_COLUMNS,
  row: Math.floor((number - 1) / GRID_COLUMNS),
})

/** 번호 목록을 용지 좌표로 옮긴다. */
export const toGridPoints = (numbers: readonly number[]): GridPoint[] => numbers.map(toGridPoint)

/** 미리 계산해 둔 전체 번호의 좌표. 반복 호출에서 재계산을 피한다. */
export const GRID_POINTS: readonly GridPoint[] = ALL_NUMBERS.map(toGridPoint)

/** 용지 가장자리 칸인지 확인한다. */
export const isEdgeCell = ({ col, row }: GridPoint): boolean =>
    col === 0 || col === GRID_COLUMNS - 1 || row === 0 || row === GRID_ROWS - 1

/** 두 점 사이의 거리 */
export const distance = (a: GridPoint, b: GridPoint): number => Math.hypot(a.col - b.col, a.row - b.row)

/** 상하좌우로 맞닿아 있는지 확인한다. */
export const isOrthogonalNeighbor = (a: GridPoint, b: GridPoint): boolean => {
  const dc = Math.abs(a.col - b.col)
  const dr = Math.abs(a.row - b.row)
  return dc + dr === 1
}

/** 대각으로 맞닿아 있는지 확인한다. */
export const isDiagonalNeighbor = (a: GridPoint, b: GridPoint): boolean =>
    Math.abs(a.col - b.col) === 1 && Math.abs(a.row - b.row) === 1
