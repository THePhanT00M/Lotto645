"use client"

import { useEffect, useState } from "react"

/** 모바일로 취급하는 최대 너비 */
const MOBILE_BREAKPOINT = 768

/** 화면 폭이 모바일 기준 미만인지 알려준다. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return isMobile
}
