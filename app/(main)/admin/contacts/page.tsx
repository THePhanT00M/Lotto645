"use client"

import { CheckCircle2, Circle, Loader2, Mail, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { LINE, SkeletonLine } from "@/components/common/skeleton-text"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { cn } from "@/lib/utils"

interface ContactMessage {
  id: number
  created_at: string
  user_id: string | null
  email: string
  subject: string
  message: string
  answered_at: string | null
}

/**
 * 문의 관리 (관리자)
 *
 * 들어온 문의를 한 화면에 두고 답변을 마쳤는지 표시한다. 답변 자체는 남겨 준
 * 이메일로 보내므로 여기서는 무엇이 남았는지만 가린다.
 */
export default function AdminContactsPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await authorizedFetch("/api/admin/contacts")
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문의를 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async (message: ContactMessage) => {
    const answered = !message.answered_at

    try {
      const response = await authorizedFetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: message.id, answered }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      setMessages((previous) =>
          previous.map((item) => (item.id === message.id ? { ...item, answered_at: data.answeredAt } : item)),
      )
    } catch (caught) {
      toast({
        variant: "destructive",
        title: "표시를 바꾸지 못했습니다",
        description: caught instanceof Error ? caught.message : "잠시 후 다시 시도해주세요.",
      })
    }
  }

  if (isLoading) return <ContactsSkeleton />

  const pending = messages.filter((message) => !message.answered_at).length

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={Mail}
            title="문의 관리"
            description={`전체 ${messages.length.toLocaleString()}건 · 답변 대기 ${pending.toLocaleString()}건`}
            actions={
              <Button variant="outline" onClick={() => void load()} className="bg-surface border-line">
                <RefreshCw className="mr-2 h-4 w-4" />
                새로고침
              </Button>
            }
        />

        {error && (
            <Notice title="문의를 불러오지 못했습니다" tone="danger">
              <p className="opacity-90">{error}</p>
            </Notice>
        )}

        {messages.length === 0 ? (
            <Panel>
              <EmptyState icon={Mail} message="아직 들어온 문의가 없습니다." />
            </Panel>
        ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                  <Panel key={message.id} className={cn("space-y-3", message.answered_at && "opacity-60")}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-ink truncate font-semibold">{message.subject}</h3>
                        <p className="text-ink-muted mt-0.5 truncate text-xs">
                          {message.email}
                          {!message.user_id && " · 비회원"}
                          {" · "}
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>

                      <Button
                          variant="ghost"
                          size="custom"
                          onClick={() => void toggle(message)}
                          className={cn(
                              "h-8 shrink-0 px-2 text-xs",
                              message.answered_at ? "text-green-600 dark:text-green-500" : "text-ink-muted",
                          )}
                      >
                        {message.answered_at ? (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        ) : (
                            <Circle className="mr-1 h-3.5 w-3.5" />
                        )}
                        {message.answered_at ? "답변 완료" : "답변 대기"}
                      </Button>
                    </div>

                    <p className="text-ink-muted bg-surface-2 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </Panel>
              ))}
            </div>
        )}
      </div>
  )
}

/** 목록을 불러오는 동안 실제 화면과 같은 골격으로 자리를 잡아 둔다. */
function ContactsSkeleton() {
  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col space-y-2">
            <div className="flex h-8 items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-24" />
            </div>
            <SkeletonLine width="w-44" line={LINE.sm} bar="h-3.5" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
              <Panel key={index} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <SkeletonLine width="w-40 max-w-full" line={LINE.sm} bar="h-3.5" />
                    <SkeletonLine width="w-56 max-w-full" />
                  </div>
                  <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </Panel>
          ))}
        </div>
      </div>
  )
}
