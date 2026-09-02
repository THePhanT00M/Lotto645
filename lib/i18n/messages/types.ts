import type ko from "@/lib/i18n/messages/ko"

/**
 * 문구 하나의 형
 *
 * 한국어 파일은 `as const` 로 굳혀 두어 값 하나하나가 그 문장 자체를 형으로
 * 갖는다. 다른 언어는 당연히 다른 문장이므로, 문자열은 string 으로 넓히고
 * 함수는 인자와 반환형만 남긴다. 깊이에 상관없이 훑어야 중첩된 묶음도 걸린다.
 *
 * 목록은 readonly 로 둔다. 기준 파일이 `as const` 라 읽기 전용인데 여기서
 * 고쳐 쓸 수 있는 형으로 넓히면 기준 파일 자신이 이 형을 만족하지 못한다.
 */
type Widen<T> = T extends string
    ? string
    : T extends (...args: infer Args) => infer Result
        ? (...args: Args) => Result
        : T extends readonly (infer Item)[]
            ? readonly Widen<Item>[]
            : { -readonly [Key in keyof T]: Widen<T[Key]> }

/**
 * 문구의 모양
 *
 * 한국어 파일을 기준으로 삼는다. 다른 언어가 이 형을 만족하지 못하면 타입
 * 오류가 나므로, 키를 빠뜨리거나 이름을 잘못 적은 채 지나갈 수 없다.
 */
export type Messages = Widen<typeof ko>
