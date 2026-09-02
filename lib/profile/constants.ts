/**
 * 프로필 이미지 규칙
 *
 * 서버와 브라우저가 같은 값을 봐야 하므로, 서버 전용 모듈을 끌어오지 않는
 * 이 파일에 모아 둔다.
 */

/** 프로필에 붙는 이미지 종류 */
export type ProfileImageKind = "avatar" | "banner"

/** 허용하는 형식과 저장할 확장자 */
export const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
}

export const ACCEPTED_TYPES = Object.keys(EXTENSIONS)

/** 2MB. 화면에서 잘라 올리므로 원본이 커도 여기서 넘지 않는다. */
export const MAX_BYTES = 2 * 1024 * 1024

/**
 * 고를 수 있는 원본 크기 상한.
 *
 * 잘라서 올리므로 저장 용량과는 상관없고, 너무 큰 파일을 읽다가 브라우저가
 * 멎지 않게만 막는다.
 */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024
