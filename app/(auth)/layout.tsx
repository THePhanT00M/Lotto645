import type React from "react"

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <>
            <main className="bg-[#f0f2f5] dark:bg-[#0f0f0f]">{children}</main>
        </>
    )
}