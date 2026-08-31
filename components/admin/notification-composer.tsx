"use client"

import { AlertCircle, Loader2, Send } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NotificationComposerProps {
  recipientCount: number
  onSend: (payload: { title: string; content: string }) => Promise<void>
}

/** 알림 제목·본문을 작성하고 발송하는 폼. */
export default function NotificationComposer({ recipientCount, onSend }: NotificationComposerProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const hasRecipients = recipientCount > 0
  const canSend = hasRecipients && title.trim() !== "" && content.trim() !== ""

  const send = async () => {
    if (!canSend || isSending) return

    setIsSending(true)
    try {
      await onSend({ title: title.trim(), content: content.trim() })
      setTitle("")
      setContent("")
    } finally {
      setIsSending(false)
    }
  }

  return (
      <div className="bg-panel border-line rounded-xl border p-6 shadow-sm">
        <h2 className="text-ink mb-4 text-lg font-semibold">알림 작성</h2>

        <div className="space-y-4">
          <Field label="발송 대상">
            <div
                className={cn(
                    "rounded-lg border p-3 text-sm transition-colors",
                    hasRecipients
                        ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : "bg-surface border-line text-ink-muted",
                )}
            >
              선택된 인원: <span className="font-bold underline">{recipientCount}명</span>
              {!hasRecipients && (
                  <span className="ml-2 text-xs italic opacity-70">(왼쪽 목록에서 대상을 선택하세요)</span>
              )}
            </div>
          </Field>

          <Field label="알림 제목">
            <input
                type="text"
                placeholder="공지사항 또는 알림 제목"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={INPUT_CLASS}
            />
          </Field>

          <Field label="알림 내용">
            <textarea
                rows={13}
                placeholder="회원에게 전달할 내용을 입력하세요..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={cn(INPUT_CLASS, "resize-none")}
            />
          </Field>

          <div className="pt-2">
            {hasRecipients && !canSend && !isSending && (
                <p className="mb-2 flex items-center gap-1 text-[11px] text-amber-500">
                  <AlertCircle className="h-3.5 w-3.5" /> 제목과 본문을 모두 작성해야 발송이 가능합니다.
                </p>
            )}

            <button
                type="button"
                onClick={send}
                disabled={!canSend || isSending}
                className={cn(
                    "flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all",
                    canSend
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98]"
                        : "text-ink-muted cursor-not-allowed bg-gray-100 dark:bg-[#3f3f3f]",
                )}
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
              알림 발송하기
            </button>
          </div>
        </div>
      </div>
  )
}

const INPUT_CLASS =
    "bg-surface border-line text-ink w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
      <div>
        <label className="text-ink mb-1.5 block text-sm font-medium">{label}</label>
        {children}
      </div>
  )
}
