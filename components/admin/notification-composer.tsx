"use client"

import { Loader2, PencilLine, Send, Trash2 } from "lucide-react"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** 자주 쓰는 문구. 눌러서 채우고 그대로 고쳐 쓴다. */
const TEMPLATES = [
  {
    label: "당첨 안내",
    title: "당첨을 축하합니다!",
    message: "회원님이 저장하신 번호가 당첨되었습니다. 나의 추첨 기록에서 등수를 확인해보세요.",
  },
  {
    label: "점검 안내",
    title: "서비스 점검 안내",
    message: "안정적인 서비스 제공을 위해 점검을 진행합니다. 점검 중에는 일부 기능 이용이 제한될 수 있습니다.",
  },
  {
    label: "신규 기능",
    title: "새로운 기능이 추가되었습니다",
    message: "더 나아진 번호 추천 기능을 만나보세요. 지금 바로 확인하실 수 있습니다.",
  },
] as const

const TITLE_LIMIT = 50
const MESSAGE_LIMIT = 300

interface NotificationComposerProps {
  title: string
  message: string
  onTitleChange: (value: string) => void
  onMessageChange: (value: string) => void
  /** 이번 발송으로 알림을 받을 사람 수 */
  recipientCount: number
  isSending: boolean
  onSend: () => void
}

/**
 * 알림 작성
 *
 * 회원이 실제로 보게 될 모습과 같은 카드로 미리보기를 붙였다.
 * 발송은 되돌릴 수 없으므로 받는 사람 수를 버튼에 그대로 적어둔다.
 */
export default function NotificationComposer({
                                               title,
                                               message,
                                               onTitleChange,
                                               onMessageChange,
                                               recipientCount,
                                               isSending,
                                               onSend,
                                             }: NotificationComposerProps) {
  const canSend = title.trim() !== "" && message.trim() !== "" && recipientCount > 0 && !isSending

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    onTitleChange(template.title)
    onMessageChange(template.message)
  }

  return (
      <Panel className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-ink flex items-center gap-2 font-semibold">
            <PencilLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            내용
          </h2>
          <p className="text-ink-muted mt-1 text-sm">작성한 그대로 알림 센터에 표시됩니다.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((template) => (
              <button
                  key={template.label}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="bg-surface border-line text-ink-muted hover:bg-hover hover:text-ink rounded-full border px-3 py-1 text-xs transition-colors"
              >
                {template.label}
              </button>
          ))}
        </div>

        <Field label="제목" current={title.length} limit={TITLE_LIMIT}>
          <input
              type="text"
              value={title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="예) 서비스 점검 안내"
              className="bg-surface border-line text-ink w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="내용" current={message.length} limit={MESSAGE_LIMIT}>
          <textarea
              value={message}
              maxLength={MESSAGE_LIMIT}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="회원에게 전할 내용을 입력하세요."
              rows={5}
              className="bg-surface border-line text-ink w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <div className="space-y-2">
          <span className="text-ink-muted text-sm font-medium">미리보기</span>
          <div className="bg-canvas border-line rounded-lg border p-3">
            <PreviewCard title={title} message={message} />
          </div>
        </div>

        <div className="mt-auto space-y-2 pt-2">
          <Button
              onClick={onSend}
              disabled={!canSend}
              className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
            ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {recipientCount > 0 ? `${recipientCount.toLocaleString()}명에게 발송` : "받는 사람을 선택하세요"}
                </>
            )}
          </Button>
          <p className="text-ink-muted text-center text-xs">발송한 알림은 회수할 수 없습니다.</p>
        </div>
      </Panel>
  )
}

function Field({
                 label,
                 current,
                 limit,
                 children,
               }: {
  label: string
  current: number
  limit: number
  children: React.ReactNode
}) {
  return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-ink-muted text-sm font-medium">{label}</span>
          <span className={cn("text-xs", current >= limit ? "text-danger" : "text-ink-muted")}>
            {current}/{limit}
          </span>
        </div>
        {children}
      </div>
  )
}

/** 알림 센터에 실제로 그려지는 카드와 같은 모양. */
function PreviewCard({ title, message }: { title: string; message: string }) {
  return (
      <div className="bg-surface border-line rounded-lg border p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span className={cn("truncate text-sm font-semibold", title ? "text-ink" : "text-ink-muted")}>
              {title || "제목이 여기에 표시됩니다"}
            </span>
          </div>

          <div className="text-ink-muted flex shrink-0 items-center gap-1">
            <span className="text-xs">방금 전</span>
            <Trash2 className="h-3.5 w-3.5" />
          </div>
        </div>

        <p className="text-ink-muted mt-1 line-clamp-2 text-xs leading-relaxed">
          {message || "내용이 여기에 표시됩니다."}
        </p>
      </div>
  )
}
