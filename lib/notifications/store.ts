"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { authorizedFetch } from "@/lib/auth/client"
import { supabase } from "@/lib/supabase/client"

const ENDPOINT = "/api/notifications"

/** 실시간 이벤트가 오지 않는 환경을 위한 예비 갱신 주기 (ms) */
const POLL_INTERVAL = 60_000

export interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface NotificationState {
  items: NotificationItem[]
  /** 안 읽은 건수. 목록은 최근 것만 받으므로 개수는 서버에서 따로 센다. */
  unreadCount: number
  isLoading: boolean
  hasLoaded: boolean
}

const EMPTY: NotificationState = { items: [], unreadCount: 0, isLoading: false, hasLoaded: false }

/**
 * 알림 상태를 앱 전체가 공유하는 스토어
 *
 * 헤더 배지와 알림 센터, 알림 페이지가 각자 조회하면 한쪽에서 읽음 처리를 해도
 * 다른 쪽 숫자가 그대로 남는다. 상태를 한 곳에 두고 모두 여기를 구독한다.
 */
let state: NotificationState = EMPTY
const listeners = new Set<() => void>()

const publish = (next: Partial<NotificationState>) => {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

export const subscribeStore = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getStoreSnapshot = () => state

/** 서버 렌더에서는 항상 같은 빈 상태를 돌려준다. */
export const getServerSnapshot = () => EMPTY

let inFlight: Promise<void> | null = null

/** 서버에서 목록과 안 읽은 개수를 다시 받는다. 같은 요청이 겹치지 않게 막는다. */
export const loadNotifications = (): Promise<void> => {
  if (inFlight) return inFlight

  publish({ isLoading: true })

  inFlight = (async () => {
    try {
      const response = await authorizedFetch(ENDPOINT)
      const data = await response.json()

      if (data.success) {
        publish({ items: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 })
      }
    } catch (error) {
      console.error("알림을 불러오지 못했습니다:", error)
    } finally {
      inFlight = null
      publish({ isLoading: false, hasLoaded: true })
    }
  })()

  return inFlight
}

/** 로그아웃처럼 사용자가 바뀔 때 남은 알림을 비운다. */
export const resetNotifications = () => {
  publish(EMPTY)
}

/** 화면을 먼저 바꾼 뒤 서버에 알린다. 실패하면 서버 값으로 되돌린다. */
const send = async (method: "PATCH" | "DELETE", body?: Record<string, unknown>) => {
  try {
    const response = await authorizedFetch(ENDPOINT, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok) throw new Error(`요청이 ${response.status} 로 끝났습니다.`)
  } catch (error) {
    console.error("알림 처리에 실패했습니다:", error)
    await loadNotifications()
  }
}

export const markAsRead = async (id: string) => {
  const target = state.items.find((item) => item.id === id)
  if (!target || target.is_read) return

  publish({
    items: state.items.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })

  await send("PATCH", { id })
}

export const markAllAsRead = async () => {
  if (state.unreadCount === 0) return

  publish({ items: state.items.map((item) => ({ ...item, is_read: true })), unreadCount: 0 })

  await send("PATCH")
}

export const remove = async (id: string) => {
  const target = state.items.find((item) => item.id === id)
  if (!target) return

  publish({
    items: state.items.filter((item) => item.id !== id),
    unreadCount: target.is_read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
  })

  await send("DELETE", { id })
}

export const removeAll = async () => {
  publish({ items: [], unreadCount: 0 })

  await send("DELETE")
}

let consumers = 0
let pollTimer: ReturnType<typeof setInterval> | null = null
let channel: RealtimeChannel | null = null
let channelUserId: string | null = null

/** 보이지 않는 탭까지 갱신하지는 않는다. */
const refreshIfVisible = () => {
  if (document.visibilityState === "visible") void loadNotifications()
}

/**
 * 알림 스토어에 연결한다. 화면에서 쓰는 컴포넌트가 하나라도 있으면
 * 실시간 구독과 예비 갱신이 살아 있고, 모두 사라지면 정리된다.
 */
export const connectNotifications = (userId: string | null) => {
  consumers += 1

  if (consumers === 1) {
    void loadNotifications()
    pollTimer = setInterval(refreshIfVisible, POLL_INTERVAL)
    document.addEventListener("visibilitychange", refreshIfVisible)
    window.addEventListener("focus", refreshIfVisible)
  }

  if (userId && channelUserId !== userId) openChannel(userId)

  return () => {
    consumers -= 1
    if (consumers > 0) return

    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }

    document.removeEventListener("visibilitychange", refreshIfVisible)
    window.removeEventListener("focus", refreshIfVisible)
    closeChannel()
  }
}

/** 내 알림에 생긴 변화를 서버에서 밀어준다. */
const openChannel = (userId: string) => {
  closeChannel()
  channelUserId = userId

  channel = supabase
      .channel(`notifications-${userId}`)
      .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => {
            void loadNotifications()
          },
      )
      .subscribe((status) => {
        // 테이블이 Realtime 발행 목록에 없으면 연결은 정상이고 이벤트만 오지 않는다.
        // 그 경우까지 알아채기는 어려우므로 예비 갱신을 항상 함께 돌린다.
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`알림 실시간 연결 실패(${status}). 주기적 갱신으로 대체합니다.`)
        }
      })
}

const closeChannel = () => {
  if (channel) void supabase.removeChannel(channel)
  channel = null
  channelUserId = null
}
