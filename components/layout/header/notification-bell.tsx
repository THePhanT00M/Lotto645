"use client"

import { Bell, Check } from "lucide-react"
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
import { cn } from "@/lib/utils"

/** 배지에 그대로 노출할 최대 개수 */
const MAX_BADGE_COUNT = 99

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

/** TODO: notifications 테이블 연동 전까지 쓰는 예시 데이터. */
const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "당첨 번호 발표", message: "제 1000회 로또 당첨 번호가 발표되었습니다.", time: "방금 전", read: false },
  { id: "2", title: "분석 완료", message: "요청하신 번호 분석이 완료되었습니다. 결과를 확인해보세요.", time: "1시간 전", read: false },
  { id: "3", title: "시스템 점검 안내", message: "내일 새벽 2시부터 4시까지 시스템 점검이 예정되어 있습니다.", time: "1일 전", read: true },
]

interface NotificationBellProps {
  unreadCount: number
}

/** 읽지 않은 알림 개수를 배지로 보여주고, 목록을 펼친다. 모바일은 시트로 연다. */
export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS)

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

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
              <NotificationList notifications={notifications} onRead={markAsRead} />
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
                      markAllAsRead()
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600"
                >
                  <Check className="h-3 w-3" /> 모두 읽음
                </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <NotificationList notifications={notifications} onRead={markAsRead} />
          </div>

          <div className="border-line bg-panel border-t p-2">
            <Button variant="ghost" size="sm" className="h-8 w-full text-xs">
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
            <span className="absolute top-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-bold text-white dark:border-[#121212]">
              {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
            </span>
        )}
      </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onRead: (id: string) => void
}

function NotificationList({ notifications, onRead }: NotificationListProps) {
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
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10",
                )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                    className={cn(
                        "text-sm font-medium",
                        notification.read ? "text-ink" : "text-blue-600 dark:text-blue-400",
                    )}
                >
                  {notification.title}
                </span>
                <span className="text-ink-muted ml-2 text-xs whitespace-nowrap">{notification.time}</span>
              </div>
              <p className="text-ink-muted line-clamp-2 text-xs">{notification.message}</p>
            </button>
        ))}
      </div>
  )
}
