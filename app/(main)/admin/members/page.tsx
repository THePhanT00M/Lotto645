"use client"

import { RefreshCw, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import MemberRow from "@/components/admin/member-row"
import { useTranslation } from "@/components/i18n/locale-provider"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { LINE, SkeletonLine } from "@/components/common/skeleton-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminMembers } from "@/hooks/use-admin-members"
import { useHeaderData } from "@/hooks/use-header-data"
import { ADMIN_LEVEL } from "@/lib/auth/levels"

/**
 * 회원 관리 (관리자)
 *
 * 전체 회원을 한 화면에 두고 등급과 프로필 사진을 바로 바꾼다. 등급을 올리면
 * 권한도 함께 따라가므로, 화면에는 관리자로 보이는데 못 들어오는 어긋남이 없다.
 */
export default function AdminMembersPage() {
  const { members, isLoading, error, reload, changeLevel, patch } = useAdminMembers()
  const { userData } = useHeaderData(true)
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState("")

  const found = useMemo(() => {
    const needle = keyword.trim().toLowerCase()
    if (!needle) return members

    return members.filter((member) =>
        [member.nickname, member.email, member.phone_number].some((value) =>
            (value ?? "").toLowerCase().includes(needle),
        ),
    )
  }, [members, keyword])

  if (isLoading) return <MembersSkeleton />

  const adminCount = members.filter((member) => member.level >= ADMIN_LEVEL).length

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={Users}
            title={t.admin.members.title}
            description={t.admin.members.summary(members.length, adminCount)}
            actions={
              <Button variant="outline" onClick={() => void reload()} className="bg-surface border-line">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.common.refresh}
              </Button>
            }
        />

        {error && (
            <Notice title={t.admin.members.loadFailed} tone="danger">
              <p className="opacity-90">{error}</p>
            </Notice>
        )}

        <Panel className="space-y-4">
          <div className="relative">
            <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={t.admin.members.search}
                className="bg-surface border-line pl-9"
            />
          </div>

          {found.length === 0 ? (
              <EmptyState icon={Users} message={keyword ? t.admin.members.notFound : t.admin.members.empty} />
          ) : (
              <div className="space-y-2">
                {found.map((member) => (
                    <MemberRow
                        key={member.id}
                        member={member}
                        isSelf={member.id === userData?.id}
                        onChangeLevel={(userId, level) => void changeLevel(userId, level)}
                        onChangeAvatar={(userId, avatarUrl) => patch(userId, { avatar_url: avatarUrl })}
                    />
                ))}
              </div>
          )}
        </Panel>

        <Notice title={t.admin.members.guideTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>{t.admin.members.guideAdminLevel(ADMIN_LEVEL)}</li>
            <li>{t.admin.members.guideRole}</li>
            <li>{t.admin.members.guideSelf}</li>
          </ul>
        </Notice>
      </div>
  )
}

/** 목록을 불러오는 동안 실제 화면과 같은 골격으로 자리를 잡아 둔다. */
function MembersSkeleton() {
  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col space-y-2">
            <div className="flex h-8 items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-28" />
            </div>
            <SkeletonLine width="w-48" line={LINE.sm} bar="h-3.5" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>

        <Panel className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />

          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="bg-surface border-line rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <SkeletonLine width="w-24" line={LINE.sm} bar="h-3.5" />
                      <SkeletonLine width="w-40 max-w-full" />
                      <SkeletonLine width="w-52 max-w-full" />
                    </div>
                    <Skeleton className="h-8 w-16 shrink-0 rounded-md" />
                    <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
                  </div>
                </div>
            ))}
          </div>
        </Panel>
      </div>
  )
}
