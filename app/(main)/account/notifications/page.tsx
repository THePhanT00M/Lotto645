"use client"

import { Bell, Check, Loader2, Trash2 } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"
import { Panel } from "@/components/common/panel"
import NotificationCard from "@/components/notifications/notification-card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useNotifications } from "@/hooks/use-notifications"

/**
 * 알림
 *
 * 헤더 벨에는 최근 것만 보이므로, 여기서 전체 목록을 보고 읽음 처리를 한다.
 */
export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, remove, removeAll } = useNotifications()

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

          <div className="flex gap-2">
            {unreadCount > 0 && (
                <Button variant="outline" onClick={() => void markAllAsRead()} className="bg-surface border-line">
                  <Check className="mr-2 h-4 w-4" />
                  모두 읽음
                </Button>
            )}

            {notifications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className="bg-danger hover:bg-danger/90 border-none text-white shadow-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      전체 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-surface border-line border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-ink">알림을 모두 지우시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription className="text-ink-muted">
                        받은 알림이 모두 사라지며 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-ink border-line bg-transparent">취소</AlertDialogCancel>
                      <AlertDialogAction
                          onClick={() => void removeAll()}
                          className="bg-danger hover:bg-danger/90 text-white"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
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
                  <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={(id) => void markAsRead(id)}
                      onRemove={(id) => void remove(id)}
                  />
              ))}
            </div>
        )}
      </div>
  )
}
