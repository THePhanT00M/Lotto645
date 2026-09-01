"use client"

import { Bell, Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatRelativeTime, useNotifications, type NotificationItem } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

/** 배지에 그대로 노출할 최대 개수 */
const MAX_BADGE_COUNT = 99

interface NotificationBellProps {
  unreadCount: number
}

/** 읽지 않은 알림 개수를 배지로 보여주고, 목록을 펼친다. 모바일은 시트로 연다. */
export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  // 벨을 처음 열 때 목록을 받아 온다.
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(isOpen)

  const trigger = <BellTrigger unreadCount={unreadCount} />

  if (isMobile) {
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl px-0">
            <SheetHeader className="border-line border-b px-4 pb-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Bell className="h-5 w-5" />
                알림 센터
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full pb-10">
              <NotificationList notifications={notifications} isLoading={isLoading} onRead={markAsRead} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
    )
  }

  return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="bg-surface border-line w-80 overflow-hidden rounded-lg border p-0 shadow-lg"
        >
          <div className="border-line flex items-center justify-between border-b px-4 py-3">
            <span className="text-ink flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4" />
              알림
            </span>
            {unreadCount > 0 && (
                <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      void markAllAsRead()
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600"
                >
                  <Check className="h-3 w-3" /> 모두 읽음
                </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <NotificationList notifications={notifications} isLoading={isLoading} onRead={markAsRead} />
          </div>

          <div className="border-line bg-panel border-t p-2">
            <Button variant="ghost" size="sm" className="h-8 w-full text-xs" disabled>
              알림 전체보기
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}

function BellTrigger({ unreadCount }: { unreadCount: number }) {
  return (
      <div className="relative cursor-pointer rounded-lg p-2 transition-colors hover:bg-hover">
        <Bell className="text-ink-muted h-5 w-5" />
        {unreadCount > 0 && (
            // 자릿수에 따라 가로로만 늘어나게 해, 두 자리여도 벨을 덮지 않는다.
            <span className="border-canvas bg-accent absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] leading-none font-bold text-white tabular-nums">
              {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
            </span>
        )}
      </div>
  )
}

interface NotificationListProps {
  notifications: NotificationItem[]
  isLoading: boolean
  onRead: (id: string) => void
}

function NotificationList({ notifications, isLoading, onRead }: NotificationListProps) {
  if (isLoading && notifications.length === 0) {
    return (
        <div className="text-ink-muted flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중...
        </div>
    )
  }

  if (notifications.length === 0) {
    return <p className="text-ink-muted py-8 text-center text-sm">새로운 알림이 없습니다.</p>
  }

  return (
      <div className="flex flex-col py-1">
        {notifications.map((notification) => (
            <button
                key={notification.id}
                type="button"
                onClick={() => onRead(notification.id)}
                className={cn(
                    "border-line flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-[#2b2b2b]",
                    !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10",
                )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                    className={cn(
                        "text-sm font-medium",
                        notification.is_read ? "text-ink" : "text-blue-600 dark:text-blue-400",
                    )}
                >
                  {notification.title}
                </span>
                <span className="text-ink-muted ml-2 text-xs whitespace-nowrap">
                  {formatRelativeTime(notification.created_at)}
                </span>
              </div>
              <p className="text-ink-muted line-clamp-2 text-xs">{notification.message}</p>
            </button>
        ))}
      </div>
  )
}
