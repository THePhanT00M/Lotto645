"use client"

import { useEffect, useSyncExternalStore } from "react"
import {
  connectNotifications,
  getServerSnapshot,
  getStoreSnapshot,
  loadNotifications,
  markAllAsRead,
  markAsRead,
  remove,
  removeAll,
  subscribeStore,
  type NotificationItem,
} from "@/lib/notifications/store"

export type { NotificationItem }

/**
 * 공유 알림 스토어를 화면에 연결한다.
 *
 * 헤더 배지와 알림 센터, 알림 페이지가 같은 상태를 보므로 한쪽에서 읽음 처리를 하면
 * 다른 쪽 숫자도 그 자리에서 바뀐다. userId 를 주면 실시간 구독까지 연다.
 */
export function useNotifications(userId?: string | null) {
  const state = useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerSnapshot)

  useEffect(() => connectNotifications(userId ?? null), [userId])

  return {
    notifications: state.items,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    hasLoaded: state.hasLoaded,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
    remove,
    removeAll,
  }
}

/**
 * 얼마나 지났는지 나타내는 값
 *
 * 말은 화면에서 그때의 언어로 붙이므로, 여기서는 단위와 수만 정한다.
 */
export type RelativeTime =
    | { unit: "now" }
    | { unit: "minutes" | "hours" | "days"; value: number }
    | { unit: "date"; value: string }

export const relativeTime = (isoDate: string): RelativeTime => {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000)

  if (minutes < 1) return { unit: "now" }
  if (minutes < 60) return { unit: "minutes", value: minutes }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { unit: "hours", value: hours }

  const days = Math.floor(hours / 24)
  if (days < 7) return { unit: "days", value: days }

  return { unit: "date", value: new Date(isoDate).toLocaleDateString() }
}

