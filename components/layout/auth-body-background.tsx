"use client"

import { useEffect } from "react"

/**
 * 인증 화면에서만 body 배경을 전용 색으로 바꾼다.
 *
 * 카드 바깥 여백(특히 iOS safe-area)까지 같은 색으로 덮어야 해서
 * 화면 자체가 아니라 body에 클래스를 건다.
 */
export default function AuthBodyBackground() {
  useEffect(() => {
    document.body.classList.add("auth-page")
    return () => document.body.classList.remove("auth-page")
  }, [])

  return null
}
