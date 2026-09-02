"use client"

import { Check, Trash2 } from "lucide-react"
import { relativeTime, type NotificationItem } from "@/hooks/use-notifications"
import { useTranslation } from "@/components/i18n/locale-provider"
import type { Messages } from "@/lib/i18n/messages/types"
import { cn } from "@/lib/utils"

interface NotificationCardProps {
  notification: NotificationItem
  onRead: (id: string) => void
  onRemove: (id: string) => void
  /** 알림 센터처럼 좁은 곳에서 쓸 때 */
  compact?: boolean
}

/**
 * 알림 한 건
 *
 * 읽지 않은 알림은 배경색과 파란 점으로 구분하고, 체크 버튼을 함께 둬서
 * 어떻게 읽음 처리하는지 보이게 한다. 카드를 눌러도 읽음으로 바뀐다.
 */
export default function NotificationCard({ notification, onRead, onRemove, compact }: NotificationCardProps) {
  const { t } = useTranslation()
  const isUnread = !notification.is_read

  return (
      <div
          onClick={isUnread ? () => onRead(notification.id) : undefined}
          className={cn(
              "rounded-lg border transition-colors",
              compact ? "p-3 shadow-sm" : "p-4",
              isUnread ? "border-accent-line bg-accent-soft cursor-pointer" : "bg-surface border-line",
          )}
      >
        {/* 시각과 버튼을 제목과 같은 줄에 묶어야 세로 가운데가 맞는다. */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
            <span
                className={cn(
                    "truncate font-semibold",
                    compact ? "text-sm" : "",
                    isUnread ? "text-ink" : "text-ink-muted",
                )}
            >
              {notification.title}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="text-ink-muted text-xs">{describeTime(t, relativeTime(notification.created_at))}</span>

            {isUnread && (
                <IconButton
                    onClick={() => onRead(notification.id)}
                    label={t.notifications.markRead}
                    className="text-ink-muted hover:text-accent hover:bg-hover"
                    compact={compact}
                >
                  <Check className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </IconButton>
            )}

            <IconButton
                onClick={() => onRemove(notification.id)}
                label={t.notifications.deleteOne}
                className="text-ink-muted hover:text-danger hover:bg-danger/10"
                compact={compact}
            >
              <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </IconButton>
          </div>
        </div>

        <p
            className={cn(
                "text-ink-muted mt-1 leading-relaxed",
                compact ? "line-clamp-2 text-xs" : "text-sm",
            )}
        >
          {notification.message}
        </p>
      </div>
  )
}

function IconButton({
                      onClick,
                      label,
                      className,
                      compact,
                      children,
                    }: {
  onClick: () => void
  label: string
  className: string
  compact?: boolean
  children: React.ReactNode
}) {
  return (
      <button
          type="button"
          // 카드 전체가 읽음 처리라서, 버튼은 눌린 곳에서 멈춰야 한다.
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
          aria-label={label}
          title={label}
          className={cn("rounded-md transition-colors", compact ? "p-1" : "p-1.5", className)}
      >
        {children}
      </button>
  )
}

/** 지난 시간을 그때의 언어로 적는다. */
const describeTime = (t: Messages, value: ReturnType<typeof relativeTime>): string => {
  if (value.unit === "now") return t.common.justNow
  if (value.unit === "minutes") return t.common.minutesAgo(value.value)
  if (value.unit === "hours") return t.common.hoursAgo(value.value)
  if (value.unit === "days") return t.common.daysAgo(value.value)

  return String(value.value)
}
