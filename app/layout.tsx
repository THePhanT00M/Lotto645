import type React from "react"
import type { Metadata, Viewport } from "next" // Viewport 추가
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Suspense } from "react"
import SplashScreen from "@/components/splash-screen"
import localFont from "next/font/local"

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
}

const notoSansKR = localFont({
    src: [
        {
            path: "./fonts/NotoSansKR-Thin.ttf",
            weight: "100",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-ExtraLight.ttf",
            weight: "200",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-Light.ttf",
            weight: "300",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-Regular.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-SemiBold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-Bold.ttf",
            weight: "700",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-ExtraBold.ttf",
            weight: "800",
            style: "normal",
        },
        {
            path: "./fonts/NotoSansKR-Black.ttf",
            weight: "900",
            style: "normal",
        },
    ],
    variable: "--font-noto-sans-kr",
    display: "swap",
})

export const metadata: Metadata = {
    title: "로또 추첨기",
    icons: {
        icon: [
            { url: "/favicon/favicon.ico" },
            { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: "/favicon/apple-touch-icon.png",
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ko" suppressHydrationWarning>
        <body className={`${notoSansKR.variable} font-sans min-h-screen flex flex-col bg-white dark:bg-black pt-[env(safe-area-inset-top)]`}>
        <Suspense fallback={<SplashScreen />}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                {children}
                <Analytics />
                <SpeedInsights />
            </ThemeProvider>
        </Suspense>
        </body>
        </html>
    )
}