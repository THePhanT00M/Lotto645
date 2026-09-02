"use client"

import { RefreshCw, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import MemberRow from "@/components/admin/member-row"
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
            title="회원 관리"
            description={`전체 ${members.length.toLocaleString()}명 · 관리자 ${adminCount}명`}
            actions={
              <Button variant="outline" onClick={() => void reload()} className="bg-surface border-line">
                <RefreshCw className="mr-2 h-4 w-4" />
                새로고침
              </Button>
            }
        />

        {error && (
            <Notice title="회원 목록을 불러오지 못했습니다" tone="danger">
              <p className="opacity-90">{error}</p>
            </Notice>
        )}

        <Panel className="space-y-4">
          <div className="relative">
            <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="닉네임·이메일·연락처로 찾기"
                className="bg-surface border-line pl-9"
            />
          </div>

          {found.length === 0 ? (
              <EmptyState icon={Users} message={keyword ? "찾는 회원이 없습니다." : "아직 가입한 회원이 없습니다."} />
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

        <Notice title="등급 안내">
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>등급 {ADMIN_LEVEL} 이상이면 관리자 화면에 들어올 수 있습니다.</li>
            <li>등급을 바꾸면 권한(role)도 함께 맞춰집니다.</li>
            <li>자기 등급은 이 화면에서 바꿀 수 없습니다. 스스로 내리면 다시 들어올 수 없습니다.</li>
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
