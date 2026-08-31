"use client"

import { Check, Filter, Search, User } from "lucide-react"
import { useMemo, useState } from "react"
import type { UserData } from "@/hooks/use-header-data"
import { cn } from "@/lib/utils"

/** 필터 버튼에 노출할 등급 */
const LEVELS = [0, 1, 2] as const

type LevelFilter = number | "all"

interface UserPickerProps {
  users: UserData[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/** 알림을 받을 회원을 검색·필터해 고르는 목록. */
export default function UserPicker({ users, selectedIds, onChange }: UserPickerProps) {
  const [keyword, setKeyword] = useState("")
  const [level, setLevel] = useState<LevelFilter>("all")

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase()

    return users.filter((user) => {
      const matchesKeyword =
          needle === "" ||
          user.name.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle)

      return matchesKeyword && (level === "all" || user.level === level)
    })
  }, [keyword, level, users])

  const allSelected = filtered.length > 0 && filtered.every((user) => selectedIds.includes(user.id))

  const toggleUser = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((each) => each !== id) : [...selectedIds, id])
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : filtered.map((user) => user.id))
  }

  return (
      <div className="bg-panel border-line flex h-[650px] flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="border-line space-y-4 border-b p-4">
          <div className="relative">
            <Search className="text-ink-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
                type="text"
                placeholder="이름 또는 이메일 검색..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="bg-surface border-line text-ink w-full rounded-lg border py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-muted flex items-center gap-1 text-xs font-semibold">
              <Filter className="h-3 w-3" /> 등급:
            </span>
            <LevelButton active={level === "all"} onClick={() => setLevel("all")}>
              전체
            </LevelButton>
            {LEVELS.map((each) => (
                <LevelButton key={each} active={level === each} onClick={() => setLevel(each)}>
                  Lv.{each}
                </LevelButton>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-ink-muted">결과: {filtered.length}명</span>
            <button
                type="button"
                onClick={toggleAll}
                className="font-medium text-blue-500 transition-colors hover:text-blue-600"
            >
              {allSelected ? "전체 해제" : "목록 전체 선택"}
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-panel border-line sticky top-0 z-10 border-b">
              <tr className="text-ink-muted text-xs uppercase">
                <th className="w-14 px-4 py-3 text-center font-medium">선택</th>
                <th className="px-4 py-3 font-medium">회원정보</th>
                <th className="px-4 py-3 text-right font-medium">등급</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {filtered.map((user) => {
                const isSelected = selectedIds.includes(user.id)

                return (
                    <tr
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={cn(
                            "cursor-pointer transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-900/10",
                            isSelected && "bg-blue-50/50 dark:bg-blue-900/20",
                        )}
                    >
                      <td className="px-4 py-3 text-center">
                        <div
                            className={cn(
                                "mx-auto flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                isSelected ? "border-blue-500 bg-blue-500" : "border-line",
                            )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="border-line flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-gray-100 dark:bg-[#3f3f3f]">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <User className="text-ink-muted h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-ink text-sm font-medium">{user.name}</div>
                            <div className="text-ink-muted text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                            className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                user.level >= 2
                                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                    : "text-ink-muted bg-gray-100 dark:bg-[#3f3f3f]",
                            )}
                        >
                          Lv.{user.level}
                        </span>
                      </td>
                    </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
  )
}

function LevelButton({
                       active,
                       onClick,
                       children,
                     }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              active ? "border-blue-500 bg-blue-500 text-white" : "bg-surface border-line text-ink-muted",
          )}
      >
        {children}
      </button>
  )
}
