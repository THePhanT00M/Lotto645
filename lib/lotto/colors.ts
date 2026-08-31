/**
 * 번호 구간별 공 색상
 *
 * 동일한 매핑이 컴포넌트마다 복사돼 있어 단일 소스로 통합한다.
 */

interface BallColorRange {
  /** 구간의 최댓값(이하) */
  max: number
  /** 공 배경색 */
  color: string
}

const BALL_COLOR_RANGES: readonly BallColorRange[] = [
  { max: 10, color: "#fbc400" }, // 노랑
  { max: 20, color: "#69c8f2" }, // 하늘
  { max: 30, color: "#ff7272" }, // 빨강
  { max: 40, color: "#aaaaaa" }, // 회색
  { max: 45, color: "#b0d840" }, // 연두
]

/** 범위를 벗어난 번호에 쓰는 색 */
const FALLBACK_COLOR = "#000000"

/** 번호에 해당하는 공 색상을 반환한다. */
export const getBallColor = (number: number): string =>
    BALL_COLOR_RANGES.find((range) => number <= range.max)?.color ?? FALLBACK_COLOR
