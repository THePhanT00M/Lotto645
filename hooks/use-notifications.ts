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
