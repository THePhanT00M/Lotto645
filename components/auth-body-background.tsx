"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export default function AuthBodyBackground() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        // 원래 body 스타일 백업
        const originalBg = document.body.style.backgroundColor

        const updateBodyBg = () => {
            // 다크모드 여부에 따라 색상 지정
            const isDark = resolvedTheme === "dark"
            const color = isDark ? "#0f0f0f" : "#f0f2f5"

            // Tailwind 클래스보다 우선순위를 높이기 위해 !important 스타일 적용
            document.body.style.setProperty("background-color", color, "important")
        }

        updateBodyBg()

        // 언마운트 시(페이지를 나갈 때) 원래 색상으로 복구
        return () => {
            document.body.style.backgroundColor = originalBg
        }
    }, [resolvedTheme])

    return null
}