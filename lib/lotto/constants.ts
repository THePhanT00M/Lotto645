/**
 * 로또 6/45 도메인 상수
 *
 * 45개 번호 중 6개를 뽑는 규칙이 코드 전반의 매직 넘버로 흩어져 있어 한곳에 모은다.
 */

/** 번호 범위의 최솟값 */
export const MIN_NUMBER = 1

/** 번호 범위의 최댓값 */
export const MAX_NUMBER = 45

/** 한 게임에서 뽑는 번호 개수 */
export const PICK_COUNT = 6

/** 1 ~ 45 전체 번호 목록 */
export const ALL_NUMBERS: readonly number[] = Array.from(
    { length: MAX_NUMBER - MIN_NUMBER + 1 },
    (_, i) => i + MIN_NUMBER,
)

/** 1등 당첨 확률의 분모 (45C6) */
export const FIRST_PRIZE_ODDS = 8_145_060
