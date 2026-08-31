"use client"

import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import NotificationComposer from "@/components/admin/notification-composer"
import UserPicker from "@/components/admin/user-picker"
import { PageHeader } from "@/components/common/page-header"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

/**
 * 알림 발송 관리 (관리자)
 *
 * 왼쪽에서 회원을 검색·필터해 고르고, 오른쪽에서 작성한 알림을 한 번에 보낸다.
 * 어드민 등급(Lv.2) 미만은 진입 시 홈으로 돌려보낸다.
 */
export default function AdminNotificationPage() {
  const { users, isLoading } = useAdminUsers()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const send = async ({ title, content }: { title: string; content: string }) => {
    const rows = selectedIds.map((userId) => ({
      user_id: userId,
      title,
      message: content,
      is_read: false,
    }))

    const { error } = await supabase.from("notifications").insert(rows)

    if (error) {
      console.error("알림 발송 실패:", error.message)
      toast({ variant: "destructive", title: "발송 실패", description: "알림 발송 중 오류가 발생했습니다." })
      return
    }

    toast({ title: "발송 완료", description: `${selectedIds.length}명에게 알림을 보냈습니다.` })
    setSelectedIds([])
  }

  if (isLoading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )
  }

  return (
      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader icon={Send} title="알림 발송 관리" description="선택한 회원에게 알림을 일괄 발송합니다." />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <UserPicker users={users} selectedIds={selectedIds} onChange={setSelectedIds} />
          <NotificationComposer recipientCount={selectedIds.length} onSend={send} />
        </div>
      </div>
  )
}
