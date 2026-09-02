"use client"

/**
 * 프로필 변경 알림
 *
 * 헤더는 사용자 정보를 한 번만 조회해 들고 있어, 프로필 화면에서 사진을 바꿔도
 * 새로고침 전까지 예전 사진이 남는다. 조회를 다시 돌리는 대신 바뀐 값만 알린다.
 */

const AVATAR_CHANGED = "profile:avatar-changed"

/** 아바타가 바뀌었음을 알린다. */
export const emitAvatarChanged = (avatarUrl: string | null): void => {
  window.dispatchEvent(new CustomEvent(AVATAR_CHANGED, { detail: avatarUrl }))
}

/** 아바타 변경을 구독한다. 구독을 끊는 함수를 돌려준다. */
export const onAvatarChanged = (listener: (avatarUrl: string | null) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<string | null>).detail)

  window.addEventListener(AVATAR_CHANGED, handler)
  return () => window.removeEventListener(AVATAR_CHANGED, handler)
}
