// app/layout.tsx
import type React from "react"
import type { Metadata, Viewport } from "next" // Viewport 추가
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Suspense } from "react"
import SplashScreen from "@/components/splash-screen"

// 1. Viewport 설정 추가 (상단바 영역 활용을 위해 viewport-fit=cover 설정)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 노치 영역까지 화면을 채우게 합니다.
}

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
      <body className="min-h-screen flex flex-col bg-white dark:bg-black pt-[env(safe-area-inset-top)]">
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