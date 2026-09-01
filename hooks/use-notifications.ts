"use client"

import { useCallback, useEffect, useState } from "react"
import { authorizedFetch } from "@/lib/auth/client"

const ENDPOINT = "/api/notifications"

export interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

/**
 * 로그인한 사용자의 알림 목록을 다룬다.
 *
 * 벨을 열 때 처음 불러오고, 그 뒤로는 읽음 처리에 맞춰 화면만 갱신한다.
 * 안 읽은 개수는 헤더가 이미 실시간으로 구독하고 있어 여기서 따로 세지 않는다.
 */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await authorizedFetch(ENDPOINT)
      const data = await response.json()

      if (data.success) setNotifications(data.notifications ?? [])
    } catch (error) {
      console.error("알림을 불러오지 못했습니다:", error)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [])

  // 벨을 처음 열 때만 불러온다. 닫았다 열 때마다 다시 받지는 않는다.
  useEffect(() => {
    if (enabled && !hasLoaded) void load()
  }, [enabled, hasLoaded, load])

  /** 한 건을 읽음으로 표시한다. 서버 응답을 기다리지 않고 화면을 먼저 바꾼다. */
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))

    try {
      await authorizedFetch(ENDPOINT, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    } catch (error) {
      console.error("읽음 처리에 실패했습니다:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))

    try {
      await authorizedFetch(ENDPOINT, { method: "PATCH", headers: { "Content-Type": "application/json" } })
    } catch (error) {
      console.error("읽음 처리에 실패했습니다:", error)
    }
  }, [])

  return { notifications, isLoading, hasLoaded, reload: load, markAsRead, markAllAsRead }
}

/** 알림이 온 시각을 '방금 전', '3시간 전'처럼 바꾼다. */
export const formatRelativeTime = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return "방금 전"
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`

  return new Date(isoDate).toLocaleDateString()
}
