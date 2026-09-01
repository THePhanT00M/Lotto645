"use client"

import { Bell, Check, Loader2, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, useNotifications, type NotificationItem } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

/** 배지에 그대로 노출할 최대 개수 */
const MAX_BADGE_COUNT = 99

interface NotificationBellProps {
  unreadCount: number
}

/** 읽지 않은 알림 개수를 배지로 보여주고, 누르면 알림 창을 연다. */
export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, isLoading, markAsRead, markAllAsRead, remove, removeAll } = useNotifications(isOpen)

  // 창이 열려 있는 동안에는 뒤쪽이 스크롤되지 않게 한다.
  useEffect(() => {
    if (!isOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const unread = notifications.filter((item) => !item.is_read).length

  return (
      <>
        <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : "알림"}
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
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
              {/* 바깥을 눌러도 닫히게 한다. */}
              <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setIsOpen(false)}
                  aria-hidden
              />

              <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="알림"
                  className="bg-surface border-line relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border shadow-xl"
              >
                <div className="border-line flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-ink flex items-center gap-2 font-semibold">
                    <Bell className="h-4 w-4" />
                    알림
                    {unread > 0 && <span className="text-accent text-sm">{unread}</span>}
                  </h2>

                  <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="닫기"
                      className="hover:bg-hover rounded-md p-1.5 transition-colors"
                  >
                    <X className="text-ink-muted h-4 w-4" />
                  </button>
                </div>

                {notifications.length > 0 && (
                    <div className="border-line flex items-center justify-between border-b px-3 py-2">
                      <Button
                          variant="ghost"
                          size="custom"
                          onClick={() => void markAllAsRead()}
                          disabled={unread === 0}
                          className="text-ink-muted hover:text-ink h-8 px-2 text-xs"
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        모두 읽음
                      </Button>

                      <Button
                          variant="ghost"
                          size="custom"
                          onClick={() => void removeAll()}
                          className="text-danger hover:bg-danger/10 h-8 px-2 text-xs"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        전체 삭제
                      </Button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <NotificationList
                      notifications={notifications}
                      isLoading={isLoading}
                      onRead={markAsRead}
                      onRemove={remove}
                  />
                </div>

                <div className="border-line bg-panel border-t p-2">
                  <Button asChild variant="ghost" size="sm" className="h-8 w-full text-xs">
                    <Link href="/account/notifications" onClick={() => setIsOpen(false)}>
                      알림 전체보기
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
        )}
      </>
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
      <ul className="flex flex-col">
        {notifications.map((notification) => (
            <li
                key={notification.id}
                className={cn(
                    "border-line flex items-start gap-2 border-b px-4 py-3 last:border-0",
                    !notification.is_read && "bg-accent-soft",
                )}
            >
              <button
                  type="button"
                  onClick={() => onRead(notification.id)}
                  className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("text-sm font-medium", notification.is_read ? "text-ink" : "text-accent")}>
                    {notification.title}
                  </span>
                  <span className="text-ink-muted shrink-0 text-xs">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-ink-muted mt-0.5 text-xs leading-relaxed">{notification.message}</p>
              </button>

              <button
                  type="button"
                  onClick={() => onRemove(notification.id)}
                  aria-label="이 알림 삭제"
                  className="text-ink-muted hover:text-danger hover:bg-danger/10 shrink-0 rounded-md p-1.5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
        ))}
      </ul>
  )
}
