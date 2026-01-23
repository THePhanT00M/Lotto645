import type React from "react"
import AuthBodyBackground from "@/components/auth-body-background"

export default function AuthLayout({children,}: {
    children: React.ReactNode
}) {
    return (
        <>
            <AuthBodyBackground />
            {children}
        </>
    )
}