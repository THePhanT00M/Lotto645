"use client"

import { Bell, Check, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

/**
 * 알림
 *
 * 헤더 벨에는 최근 것만 보이므로, 여기서 전체 목록을 보고 읽음 처리를 한다.
 */
export default function NotificationsPage() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(true)
  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              알림
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              {unreadCount > 0 ? `읽지 않은 알림이 ${unreadCount}건 있습니다.` : "모든 알림을 확인했습니다."}
            </p>
          </div>

          {unreadCount > 0 && (
              <Button variant="outline" onClick={() => void markAllAsRead()} className="bg-surface border-line">
                <Check className="mr-2 h-4 w-4" />
                모두 읽음
              </Button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
            <Panel className="flex items-center justify-center gap-2 py-16">
              <Loader2 className="text-ink-muted h-5 w-5 animate-spin" />
              <span className="text-ink-muted text-sm">불러오는 중...</span>
            </Panel>
        ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} message="받은 알림이 없습니다." />
        ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                  <button
                      key={notification.id}
                      type="button"
                      onClick={() => void markAsRead(notification.id)}
                      className={cn(
                          "border-line hover:bg-hover flex w-full flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
                          notification.is_read ? "bg-surface" : "border-accent-line bg-accent-soft",
                      )}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <span
                          className={cn(
                              "font-medium",
                              notification.is_read ? "text-ink" : "text-accent",
                          )}
                      >
                        {notification.title}
                      </span>
                      <span className="text-ink-muted shrink-0 text-xs">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-ink-muted text-sm leading-relaxed">{notification.message}</p>
                  </button>
              ))}
            </div>
        )}
      </div>
  )
}
