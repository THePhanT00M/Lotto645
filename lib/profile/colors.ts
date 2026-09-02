/**
 * 프로필 기본 색
 *
 * 사진도 배너도 올리지 않은 사람이 회색 덩어리로만 보이지 않도록, 회원마다
 * 자기 색을 갖게 한다. 색은 회원 id 에서 뽑으므로 따로 저장할 것이 없고,
 * 가입 시점에 부여하는 절차도 필요 없다. 어디서 그리든 같은 색이 나온다.
 *
 * 나중에 색을 직접 고르게 하려면 profiles 에 컬럼을 두고, 비어 있을 때
 * 여기서 뽑은 값을 쓰면 된다.
 */

/**
 * 배너에 깔 색 짝
 *
 * 흰 글자를 얹어도 읽히도록 중간 밝기로 고르고, 두 색의 색상환 거리가 너무
 * 벌어지면 탁해져 이웃한 색끼리 묶었다.
 */
const GRADIENTS: readonly (readonly [string, string])[] = [
  ["#4f46e5", "#9333ea"], // 남보라 → 보라
  ["#2563eb", "#0891b2"], // 파랑 → 청록
  ["#0d9488", "#65a30d"], // 청록 → 풀색
  ["#c026d3", "#db2777"], // 자주 → 분홍
  ["#e11d48", "#ea580c"], // 다홍 → 주황
  ["#ea580c", "#ca8a04"], // 주황 → 겨자
  ["#7c3aed", "#2563eb"], // 보라 → 파랑
  ["#0f766e", "#1d4ed8"], // 짙은 청록 → 파랑
]

/** 문자열을 고르게 흩어진 정수로 바꾼다 (FNV-1a). */
const hash = (seed: string): number => {
  let value = 0x811c9dc5

  for (let index = 0; index < seed.length; index++) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }

  return Math.abs(value)
}

const pick = (seed: string | null | undefined): readonly [string, string] =>
    GRADIENTS[seed ? hash(seed) % GRADIENTS.length : 0]

/** 배너에 깔 그라데이션. style 의 backgroundImage 에 그대로 넣는다. */
export const profileGradient = (seed: string | null | undefined): string => {
  const [from, to] = pick(seed)
  return `linear-gradient(135deg, ${from}, ${to})`
}

/** 그라데이션의 대표 색. 아바타 자리처럼 한 가지 색만 필요할 때 쓴다. */
export const profileColor = (seed: string | null | undefined): string => pick(seed)[0]
