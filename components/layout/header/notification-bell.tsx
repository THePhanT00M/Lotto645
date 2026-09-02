"use client"

import { Bell, Check, Loader2, Settings, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import NotificationCard from "@/components/notifications/notification-card"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 배지에 그대로 노출할 최대 개수 */
const MAX_BADGE_COUNT = 99

/** 좁은 화면에서 알림 센터 좌우로 남길 여백(px) */
const MOBILE_GUTTER = 16

/** Tailwind sm 기준. 이 위로는 벨 기준 배치를 그대로 쓴다. */
const DESKTOP_QUERY = "(min-width: 640px)"

interface NotificationBellProps {
  userId?: string
  /** 서버에서 미리 센 개수. 목록을 받기 전까지 배지에 쓴다. */
  initialUnreadCount: number
}

/**
 * 알림 벨과 알림 센터
 *
 * 화면 가운데를 덮는 대신 벨 아래에 붙는 형태로 열어, 보던 화면을 가리지 않는다.
 * 배지는 알림 센터와 같은 상태를 보므로 읽음 처리를 하면 그 자리에서 줄어든다.
 */
export default function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  // 좁은 화면에서 화면 폭에 맞추려고 계산한 벨 기준 가로 위치. sm 이상에서는 null.
  const [mobileBox, setMobileBox] = useState<{ left: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, isLoading, hasLoaded, markAsRead, markAllAsRead, remove, removeAll } =
      useNotifications(userId)

  // 목록을 받기 전에는 서버가 세어준 값을 쓴다.
  const badgeCount = hasLoaded ? unreadCount : initialUnreadCount

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

  // 좁은 화면에서는 벨 오른쪽에 다른 버튼이 있어 벨에 붙이면 화면 밖으로 밀린다.
  // 그래서 화면 폭에 맞춘 가로 위치를 벨 기준 좌표로 환산해 둔다.
  useLayoutEffect(() => {
    if (!isOpen) return

    const sync = () => {
      const container = containerRef.current
      if (!container) return

      if (window.matchMedia(DESKTOP_QUERY).matches) {
        setMobileBox(null)
        return
      }

      const { left } = container.getBoundingClientRect()
      setMobileBox({
        left: MOBILE_GUTTER - left,
        width: document.documentElement.clientWidth - MOBILE_GUTTER * 2,
      })
    }

    sync()
    window.addEventListener("resize", sync)

    return () => window.removeEventListener("resize", sync)
  }, [isOpen])

  return (
      <div className="relative" ref={containerRef}>
        <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={badgeCount > 0 ? t.header.notificationsWithCount(badgeCount) : t.header.notifications}
            aria-expanded={isOpen}
            className="hover:bg-hover relative cursor-pointer rounded-lg p-2 transition-colors"
        >
          <Bell className="text-ink-muted h-5 w-5" />
          {badgeCount > 0 && (
              <span className="border-canvas absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-solid bg-blue-500 text-[9px] leading-none font-bold text-white tabular-nums">
                {badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : badgeCount}
              </span>
          )}
        </button>

        {isOpen && (
            <div
                role="dialog"
                aria-label={t.header.notificationCenter}
                // 화면(viewport)이 아니라 벨을 기준으로 놓아, 스크롤해도 연 자리에 그대로 남는다.
                style={mobileBox ? { left: mobileBox.left, width: mobileBox.width, right: "auto" } : undefined}
                className={cn(
                    "bg-panel border-line absolute top-full right-0 z-50 mt-3 flex max-h-[70vh] flex-col",
                    "overflow-hidden rounded-xl border shadow-xl",
                    "sm:w-[380px]",
                )}
            >
              {/* 벨에서 이어지는 꼬리. 화면 폭에 맞춰 벌어지는 좁은 화면에서는 위치가 어긋나 감춘다. */}
              <span className="border-line bg-surface absolute -top-[7px] right-3 hidden h-3 w-3 rotate-45 border-t border-l sm:block" />

              {/* 머리말은 목록 영역보다 밝게 둬서 경계가 드러나게 한다. */}
              <div className="bg-surface border-line relative flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-ink text-base font-bold">{t.header.center}</h2>
                <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    aria-label={t.header.notificationSettings}
                    className="hover:bg-hover rounded-md p-1.5 transition-colors"
                >
                  <Settings className="text-ink-muted h-4 w-4" />
                </Link>
              </div>

              {notifications.length > 0 && (
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <span className="text-ink-muted text-xs">
                      {unreadCount > 0 ? t.header.unreadCount(unreadCount) : t.header.allChecked}
                    </span>

                    <div className="flex items-center gap-1">
                      <ActionButton onClick={() => void markAllAsRead()} disabled={unreadCount === 0}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        {t.header.markAllRead}
                      </ActionButton>
                      <ActionButton onClick={() => void removeAll()} tone="danger">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t.header.clearAll}
                      </ActionButton>
                    </div>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {isLoading && notifications.length === 0 ? (
                    <div className="text-ink-muted flex items-center justify-center gap-2 py-10 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.header.loading}
                    </div>
                ) : notifications.length === 0 ? (
                    <p className="text-ink-muted py-10 text-center text-sm">{t.header.noNew}</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                      {notifications.map((notification) => (
                          <li key={notification.id}>
                            <NotificationCard
                                notification={notification}
                                onRead={(id) => void markAsRead(id)}
                                onRemove={(id) => void remove(id)}
                                compact
                            />
                          </li>
                      ))}
                    </ul>
                )}
              </div>

              <div className="border-line bg-surface border-t">
                <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    className="text-ink-muted hover:text-ink block py-2.5 text-center text-xs transition-colors"
                >
                  {t.header.seeAll}
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
