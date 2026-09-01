"use client"

import { Bell, Check, Loader2, Settings, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { formatRelativeTime, useNotifications, type NotificationItem } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

/** 배지에 그대로 노출할 최대 개수 */
const MAX_BADGE_COUNT = 99

interface NotificationBellProps {
  unreadCount: number
}

/**
 * 알림 벨과 알림 센터
 *
 * 화면 가운데를 덮는 대신 벨 아래에 붙는 형태로 열어, 보던 화면을 가리지 않는다.
 * 좁은 화면에서는 폭이 화면에 맞춰 줄어든다.
 */
export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { notifications, isLoading, markAsRead, markAllAsRead, remove, removeAll } = useNotifications(isOpen)

  // 바깥을 누르거나 Esc를 누르면 닫는다.
  useEffect(() => {
    if (!isOpen) return

    const closeOnOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("mousedown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("mousedown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const unread = notifications.filter((item) => !item.is_read).length

  return (
      <div className="relative" ref={containerRef}>
        <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : "알림"}
            aria-expanded={isOpen}
            className="hover:bg-hover relative cursor-pointer rounded-lg p-2 transition-colors"
        >
          <Bell className="text-ink-muted h-5 w-5" />
          {unreadCount > 0 && (
              <span className="border-canvas absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-solid bg-blue-500 text-[9px] leading-none font-bold text-white tabular-nums">
                {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
              </span>
          )}
        </button>

        {isOpen && (
            <div
                role="dialog"
                aria-label="알림 센터"
                className={cn(
                    "bg-panel border-line z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border shadow-xl",
                    // 좁은 화면에서는 벨 위치와 무관하게 화면에 맞춰 붙인다.
                    // 벨 오른쪽에 다른 버튼이 있어 기준을 벨로 잡으면 화면 밖으로 밀린다.
                    "fixed top-16 right-4 left-4",
                    "sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3 sm:w-[380px]",
                )}
            >
              {/* 벨에서 이어지는 꼬리. 화면 기준으로 붙는 좁은 화면에서는 감춘다. */}
              <span className="border-line bg-surface absolute -top-[7px] right-3 hidden h-3 w-3 rotate-45 border-t border-l sm:block" />

              {/* 머리말은 목록 영역보다 밝게 둬서 경계가 드러나게 한다. */}
              <div className="bg-surface border-line relative flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-ink text-base font-bold">알림센터</h2>
                <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    aria-label="알림 설정"
                    className="hover:bg-hover rounded-md p-1.5 transition-colors"
                >
                  <Settings className="text-ink-muted h-4 w-4" />
                </Link>
              </div>

              {notifications.length > 0 && (
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <span className="text-ink-muted text-xs">
                      {unread > 0 ? `읽지 않은 알림 ${unread}건` : "모두 확인했습니다"}
                    </span>

                    <div className="flex items-center gap-1">
                      <ActionButton onClick={() => void markAllAsRead()} disabled={unread === 0}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        모두 읽음
                      </ActionButton>
                      <ActionButton onClick={() => void removeAll()} tone="danger">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        전체 삭제
                      </ActionButton>
                    </div>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto px-3 pb-3">
                <NotificationList
                    notifications={notifications}
                    isLoading={isLoading}
                    onRead={markAsRead}
                    onRemove={remove}
                />
              </div>

              <div className="border-line bg-surface border-t">
                <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    className="text-ink-muted hover:text-ink block py-2.5 text-center text-xs transition-colors"
                >
                  알림 전체보기
                </Link>
              </div>
            </div>
        )}
      </div>
  )
}

function ActionButton({
                        onClick,
                        disabled,
                        tone,
                        children,
                      }: {
  onClick: () => void
  disabled?: boolean
  tone?: "danger"
  children: React.ReactNode
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
              "flex items-center rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-40",
              tone === "danger"
                  ? "text-danger hover:bg-danger/10"
                  : "text-ink-muted hover:bg-hover hover:text-ink disabled:hover:bg-transparent",
          )}
      >
        {children}
      </button>
  )
}

interface NotificationListProps {
  notifications: NotificationItem[]
  isLoading: boolean
  onRead: (id: string) => void
  onRemove: (id: string) => void
}

function NotificationList({ notifications, isLoading, onRead, onRemove }: NotificationListProps) {
  if (isLoading && notifications.length === 0) {
    return (
        <div className="text-ink-muted flex items-center justify-center gap-2 py-10 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중...
        </div>
    )
  }

  if (notifications.length === 0) {
    return <p className="text-ink-muted py-10 text-center text-sm">새로운 알림이 없습니다.</p>
  }

  return (
      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => (
            <li
                key={notification.id}
                className="bg-surface border-line rounded-lg border p-3 shadow-sm transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {/* 읽지 않은 알림에만 점을 찍는다. */}
                  {!notification.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                  <span className={cn("truncate text-sm font-semibold", notification.is_read ? "text-ink-muted" : "text-ink")}>
                    {notification.title}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-ink-muted text-xs">{formatRelativeTime(notification.created_at)}</span>
                  <button
                      type="button"
                      onClick={() => onRemove(notification.id)}
                      aria-label="이 알림 삭제"
                      className="text-ink-muted hover:text-danger hover:bg-danger/10 rounded-md p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <button
                  type="button"
                  onClick={() => onRead(notification.id)}
                  className="mt-1 block w-full text-left"
              >
                <p className="text-ink-muted line-clamp-2 text-xs leading-relaxed">{notification.message}</p>
              </button>
            </li>
        ))}
      </ul>
  )
}
