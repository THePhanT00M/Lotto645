import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense, type ReactNode } from "react"
import SplashScreen from "@/components/layout/splash-screen"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

/** 본문에 쓰는 한글 폰트. 굵기별 파일을 직접 싣는다. */
const notoSansKR = localFont({
  src: [
    { path: "./fonts/NotoSansKR-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/NotoSansKR-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/NotoSansKR-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/NotoSansKR-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansKR-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/NotoSansKR-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/NotoSansKR-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/NotoSansKR-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/NotoSansKR-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-noto-sans-kr",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
      <html lang="ko" suppressHydrationWarning>
        <body className={`${notoSansKR.variable} bg-canvas flex min-h-screen flex-col font-sans`}>
          <Suspense fallback={<SplashScreen />}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </Suspense>
        </body>
      </html>
  )
}
