"use client"

import { useEffect, useState } from "react"
import { readNextPath } from "@/lib/auth/redirect"

/**
 * 로그인·회원가입을 마치고 돌아갈 경로.
 *
 * useSearchParams 대신 주소를 직접 읽는다. 앱 빌드는 정적 내보내기라
 * 그 훅을 쓰면 Suspense 경계를 요구하고, 화면 전체가 클라이언트 렌더로 밀린다.
 */
export function useNextPath(): string {
  const [next, setNext] = useState("/")

  useEffect(() => setNext(readNextPath()), [])

  return next
}
