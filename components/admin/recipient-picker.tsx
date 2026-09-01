"use client"

import { Check, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { Panel } from "@/components/common/panel"
import type { UserData } from "@/hooks/use-header-data"
import { cn } from "@/lib/utils"

/** 필터 칩에 노출할 등급 */
const LEVELS = [0, 1, 2, 3] as const

type LevelFilter = number | "all"

/** 누구에게 보낼지 */
export type Target = { kind: "all" } | { kind: "selected"; userIds: string[] }

interface RecipientPickerProps {
  users: UserData[]
  target: Target
  onChange: (target: Target) => void
}

/**
 * 받는 사람 고르기
 *
 * 전 회원과 고른 회원 중 하나를 먼저 정하고, 고른 회원일 때만 목록을 연다.
 * 전 회원 발송은 실수가 크므로 기본값은 고른 회원이다.
 */
export default function RecipientPicker({ users, target, onChange }: RecipientPickerProps) {
  const [keyword, setKeyword] = useState("")
  const [level, setLevel] = useState<LevelFilter>("all")

  const selectedIds = target.kind === "selected" ? target.userIds : []

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase()

    return users.filter((user) => {
      const matchesKeyword =
          needle === "" || user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)

      return matchesKeyword && (level === "all" || user.level === level)
    })
  }, [keyword, level, users])

  const allFilteredSelected = filtered.length > 0 && filtered.every((user) => selectedIds.includes(user.id))

  const toggleUser = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((each) => each !== id) : [...selectedIds, id]
    onChange({ kind: "selected", userIds: next })
  }

  const toggleFiltered = () => {
    const filteredIds = filtered.map((user) => user.id)
    const next = allFilteredSelected
        ? selectedIds.filter((id) => !filteredIds.includes(id))
        : [...new Set([...selectedIds, ...filteredIds])]

    onChange({ kind: "selected", userIds: next })
  }

  return (
      <Panel className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-ink flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            받는 사람
          </h2>
          <p className="text-ink-muted mt-1 text-sm">전체에게 보내거나, 조건에 맞는 회원만 고를 수 있습니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ModeButton
              active={target.kind === "selected"}
              onClick={() => onChange({ kind: "selected", userIds: selectedIds })}
              label="고른 회원"
              hint={`${selectedIds.length}명 선택됨`}
          />
          <ModeButton
              active={target.kind === "all"}
              onClick={() => onChange({ kind: "all" })}
              label="전체 회원"
              hint={`${users.length.toLocaleString()}명 전원`}
          />
        </div>

        {target.kind === "all" ? (
            <div className="border-accent-line bg-accent-soft text-ink-muted rounded-lg border p-4 text-sm leading-relaxed">
              가입한 <span className="text-ink font-semibold">{users.length.toLocaleString()}명 전원</span>에게
              발송합니다. 받는 사람을 따로 고를 필요가 없습니다.
            </div>
        ) : (
            <>
              <div className="relative">
                <Search className="text-ink-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="이름 또는 이메일 검색"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    className="bg-surface border-line text-ink w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <LevelChip active={level === "all"} onClick={() => setLevel("all")}>
                  전체
                </LevelChip>
                {LEVELS.map((each) => (
                    <LevelChip key={each} active={level === each} onClick={() => setLevel(each)}>
                      Lv.{each}
                    </LevelChip>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{filtered.length}명 표시 중</span>
                <button
                    type="button"
                    onClick={toggleFiltered}
                    disabled={filtered.length === 0}
                    className="text-accent font-medium disabled:opacity-40"
                >
                  {allFilteredSelected ? "이 목록 해제" : "이 목록 전체 선택"}
                </button>
              </div>

              <ul className="bg-surface border-line max-h-[420px] flex-1 space-y-1 overflow-y-auto rounded-lg border p-1">
                {filtered.length === 0 ? (
                    <li className="text-ink-muted py-10 text-center text-sm">조건에 맞는 회원이 없습니다.</li>
                ) : (
                    filtered.map((user) => {
                      const isSelected = selectedIds.includes(user.id)

                      return (
                          <li key={user.id}>
                            <button
                                type="button"
                                onClick={() => toggleUser(user.id)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                                    isSelected ? "bg-accent-soft" : "hover:bg-hover",
                                )}
                            >
                              <span
                                  className={cn(
                                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                      isSelected ? "border-blue-500 bg-blue-500" : "border-line",
                                  )}
                              >
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="text-ink block truncate text-sm font-medium">{user.name}</span>
                                <span className="text-ink-muted block truncate text-xs">{user.email}</span>
                              </span>

                              <span
                                  className={cn(
                                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                      user.level >= 2
                                          ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                          : "text-ink-muted bg-gray-100 dark:bg-[#3f3f3f]",
                                  )}
                              >
                                Lv.{user.level}
                              </span>
                            </button>
                          </li>
                      )
                    })
                )}
              </ul>
            </>
        )}
      </Panel>
  )
}

function ModeButton({
                      active,
                      onClick,
                      label,
                      hint,
                    }: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={cn(
              "rounded-lg border px-3 py-2.5 text-left transition-colors",
              active ? "border-accent-line bg-accent-soft" : "bg-surface border-line hover:bg-hover",
          )}
      >
        <span className={cn("block text-sm font-semibold", active ? "text-accent" : "text-ink")}>{label}</span>
        <span className="text-ink-muted block text-xs">{hint}</span>
      </button>
  )
}

function LevelChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active ? "border-blue-500 bg-blue-500 text-white" : "bg-surface border-line text-ink-muted hover:bg-hover",
          )}
      >
        {children}
      </button>
  )
}
