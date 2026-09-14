"use client"

import { CheckCircle2, Circle, Mail, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { formatDateTime } from "@/lib/datetime"
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
  const { t } = useTranslation()
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
      setError(caught instanceof Error ? caught.message : t.admin.contacts.loadFailed)
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
        title: t.admin.contacts.toggleFailed,
        description: caught instanceof Error ? caught.message : t.auth.errors.unknown,
      })
    }
  }

  if (isLoading) return <ContactsSkeleton />

  return (
      <ContactsView
          messages={messages}
          error={error}
          onReload={() => void load()}
          onToggle={(message) => void toggle(message)}
      />
  )
}

interface ContactsViewProps {
  messages: ContactMessage[]
  error: string | null
  onReload: () => void
  onToggle: (message: ContactMessage) => void
}

/** 화면 본문. 스켈레톤도 이 함수를 자리표시 값으로 부르므로 글자는 <sk-t> 로 감싼다. */
function ContactsView({ messages, error, onReload, onToggle }: ContactsViewProps) {
  const { t } = useTranslation()
  const pending = messages.filter((message) => !message.answered_at).length

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={Mail}
            title={t.admin.contacts.title}
            description={t.admin.contacts.summary(messages.length, pending)}
            actions={
              <Button variant="outline" onClick={onReload} className="bg-surface border-line">
                <RefreshCw className="mr-2 h-4 w-4" />
                <sk-t>{t.common.refresh}</sk-t>
              </Button>
            }
        />

        {error && (
            <Notice title={t.admin.contacts.loadFailed} tone="danger">
              <p className="opacity-90">{error}</p>
            </Notice>
        )}

        {messages.length === 0 ? (
            <Panel>
              <EmptyState icon={Mail} message={t.admin.contacts.empty} />
            </Panel>
        ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                  <Panel key={message.id} className={cn("space-y-3", message.answered_at && "opacity-60")}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-ink truncate font-semibold"><sk-t>{message.subject}</sk-t></h3>
                        <p className="text-ink-muted mt-0.5 truncate text-xs">
                          <sk-t>
                            {message.email}
                            {!message.user_id && ` · ${t.admin.contacts.guest}`}
                            {" · "}
                            {formatDateTime(message.created_at)}
                          </sk-t>
                        </p>
                      </div>

                      <Button
                          variant="ghost"
                          size="custom"
                          onClick={() => onToggle(message)}
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
                        <sk-t>{message.answered_at ? t.admin.contacts.answered : t.admin.contacts.pending}</sk-t>
                      </Button>
                    </div>

                    <p className="text-ink-muted bg-surface-2 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      <sk-t>{message.message}</sk-t>
                    </p>
                  </Panel>
              ))}
            </div>
        )}
      </div>
  )
}

const noop = () => {}

/**
 * 목록을 불러오는 동안 실제 화면(ContactsView)을 자리표시 값으로 그리고 글자만 가린다.
 *
 * 문의는 드물어 받은 문의가 없는 화면이 가장 흔하므로, 빈 목록을 자리표시로 둔다.
 */
function ContactsSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.admin.contacts.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <ContactsView messages={[]} error={null} onReload={noop} onToggle={noop} />
        </div>
      </div>
  )
}
