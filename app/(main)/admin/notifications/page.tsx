"use client"

import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import NotificationComposer from "@/components/admin/notification-composer"
import RecipientPicker, { type Target } from "@/components/admin/recipient-picker"
import { PageHeader } from "@/components/common/page-header"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"

/**
 * 알림 발송 관리 (관리자)
 *
 * 받는 사람을 고르고 내용을 쓰는 두 단계로 나눴다.
 * 발송은 브라우저에서 테이블에 직접 넣지 않고 관리자 API를 거치므로,
 * 전 회원 발송처럼 권한이 필요한 작업도 서버에서 한 번에 처리된다.
 */
export default function AdminNotificationPage() {
  const { users, isLoading } = useAdminUsers()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [target, setTarget] = useState<Target>({ kind: "selected", userIds: [] })
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const recipientCount = target.kind === "all" ? users.length : target.userIds.length

  const send = async () => {
    setIsSending(true)

    try {
      const response = await authorizedFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          target: target.kind === "all" ? "all" : target.userIds,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? t.admin.notify.failed)

      toast({ title: t.admin.notify.sent, description: result.message })

      // 같은 내용을 두 번 보내는 사고를 막으려고 작성 내용까지 비운다.
      setTarget({ kind: "selected", userIds: [] })
      setTitle("")
      setMessage("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.admin.notify.failed,
        description: error instanceof Error ? error.message : t.auth.errors.unknown,
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )
  }

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={Send}
            title={t.admin.notify.title}
            description={t.admin.notify.description}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <RecipientPicker users={users} target={target} onChange={setTarget} />
          <NotificationComposer
              title={title}
              message={message}
              onTitleChange={setTitle}
              onMessageChange={setMessage}
              recipientCount={recipientCount}
              isSending={isSending}
              onSend={send}
          />
        </div>
      </div>
  )
}
