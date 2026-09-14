"use client"

import { RefreshCw, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import MemberRow from "@/components/admin/member-row"
import { useTranslation } from "@/components/i18n/locale-provider"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminMembers, type Member } from "@/hooks/use-admin-members"
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

  return (
      <MembersView
          members={members}
          found={found}
          keyword={keyword}
          error={error}
          selfId={userData?.id ?? null}
          onKeywordChange={setKeyword}
          onReload={() => void reload()}
          onChangeLevel={(userId, level) => void changeLevel(userId, level)}
          onChangeAvatar={(userId, avatarUrl) => patch(userId, { avatar_url: avatarUrl })}
      />
  )
}

interface MembersViewProps {
  members: Member[]
  /** 검색어로 거른 회원 */
  found: Member[]
  keyword: string
  error: string | null
  /** 지금 로그인한 관리자. 자기 등급은 바꿀 수 없다. */
  selfId: string | null
  onKeywordChange: (keyword: string) => void
  onReload: () => void
  onChangeLevel: (userId: string, level: number) => void
  onChangeAvatar: (userId: string, avatarUrl: string | null) => void
}

/** 화면 본문. 스켈레톤도 이 함수를 자리표시 값으로 부르므로 글자는 <sk-t> 로 감싼다. */
function MembersView({
  members,
  found,
  keyword,
  error,
  selfId,
  onKeywordChange,
  onReload,
  onChangeLevel,
  onChangeAvatar,
}: MembersViewProps) {
  const { t } = useTranslation()
  const adminCount = members.filter((member) => member.level >= ADMIN_LEVEL).length

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={Users}
            title={t.admin.members.title}
            description={t.admin.members.summary(members.length, adminCount)}
            actions={
              <Button variant="outline" onClick={onReload} className="bg-surface border-line">
                <RefreshCw className="mr-2 h-4 w-4" />
                <sk-t>{t.common.refresh}</sk-t>
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
                onChange={(event) => onKeywordChange(event.target.value)}
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
                        isSelf={member.id === selfId}
                        onChangeLevel={onChangeLevel}
                        onChangeAvatar={onChangeAvatar}
                    />
                ))}
              </div>
          )}
        </Panel>

        <Notice title={t.admin.members.guideTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li><sk-t>{t.admin.members.guideAdminLevel(ADMIN_LEVEL)}</sk-t></li>
            <li><sk-t>{t.admin.members.guideRole}</sk-t></li>
            <li><sk-t>{t.admin.members.guideSelf}</sk-t></li>
          </ul>
        </Notice>
      </div>
  )
}

/** 자리표시 회원. 지금 가입한 회원 수(5명)만큼 흔한 길이의 글로 채운다. */
const PLACEHOLDER_MEMBERS: Member[] = Array.from({ length: 5 }, (_, index) => ({
  id: `placeholder-${index}`,
  email: "member@example.com",
  nickname: "닉네임",
  avatar_url: null,
  banner_url: null,
  role: "user",
  level: 1,
  phone_number: null,
  created_at: "2026-09-01T00:00:00Z",
}))

const noop = () => {}

/** 목록을 불러오는 동안 실제 화면(MembersView)을 자리표시 값으로 그리고 글자만 가린다. */
function MembersSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.admin.members.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <MembersView
              members={PLACEHOLDER_MEMBERS}
              found={PLACEHOLDER_MEMBERS}
              keyword=""
              error={null}
              selfId={null}
              onKeywordChange={noop}
              onReload={noop}
              onChangeLevel={noop}
              onChangeAvatar={noop}
          />
        </div>
      </div>
  )
}
