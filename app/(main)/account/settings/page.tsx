"use client"

import { LogOut, Monitor, Moon, Settings, Sun, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Panel } from "@/components/common/panel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { clearSessionMark, getRememberLogin, setRememberLogin } from "@/lib/auth/session-persistence"
import { clearLottoHistory, getLottoHistory } from "@/lib/lotto/storage"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "밝게", icon: Sun },
  { value: "dark", label: "어둡게", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
] as const

/**
 * 설정
 *
 * 화면 테마, 자동 로그인 여부, 이 기기에 저장된 기록 정리를 다룬다.
 * 서버에 저장된 기록은 추첨 기록 화면에서 지운다.
 */
export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const [isMounted, setIsMounted] = useState(false)
  const [remember, setRemember] = useState(true)
  const [localCount, setLocalCount] = useState(0)

  // 테마와 저장소 값은 브라우저에서만 읽을 수 있다.
  useEffect(() => {
    setIsMounted(true)
    setRemember(getRememberLogin())
    setLocalCount(getLottoHistory().length)
  }, [])

  const changeRemember = (value: boolean) => {
    setRemember(value)
    setRememberLogin(value)
    toast({
      title: "설정 저장됨",
      description: value ? "다음 접속부터 자동으로 로그인합니다." : "브라우저를 닫으면 로그아웃됩니다.",
    })
  }

  const clearLocal = () => {
    clearLottoHistory()
    setLocalCount(0)
    toast({ title: "삭제 완료", description: "이 기기에 저장된 기록을 지웠습니다." })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    clearSessionMark()
    router.push("/")
    router.refresh()
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            설정
          </h1>
          <p className="text-ink-muted mt-1 text-sm">화면과 계정 동작을 조정합니다.</p>
        </div>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">화면 테마</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                        "border-line flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors",
                        isMounted && theme === value
                            ? "border-accent-line bg-accent-soft text-accent"
                            : "bg-surface text-ink-muted hover:bg-hover",
                    )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">자동 로그인</h2>
          <label className="flex cursor-pointer items-start gap-3">
            <input
                type="checkbox"
                checked={remember}
                onChange={(event) => changeRemember(event.target.checked)}
                className="border-line mt-0.5 h-4 w-4 rounded accent-blue-600"
            />
            {/* 제목이 이미 '자동 로그인'이라 라벨에는 설명만 둔다. */}
            <span className="text-ink-muted text-sm">
              해제하면 브라우저를 닫을 때 로그아웃됩니다. 공용 컴퓨터에서 권장합니다.
            </span>
          </label>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">이 기기의 기록</h2>
          <p className="text-ink-muted text-sm">
            로그인하지 않고 만든 번호는 이 브라우저에만 저장됩니다. 현재{" "}
            <span className="text-ink font-medium">{localCount}건</span>이 있습니다.
          </p>
          <p className="text-ink-muted text-xs">
            서버에 저장된 &lsquo;내 기록&rsquo;은 추첨 기록 화면에서 지울 수 있습니다.
          </p>

          <ConfirmButton
              label="이 기기의 기록 삭제"
              title="이 기기에 저장된 기록을 지울까요?"
              description="브라우저에 저장된 기록만 사라지며, 서버에 저장된 기록은 그대로 남습니다."
              disabled={localCount === 0}
              onConfirm={clearLocal}
          />
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">계정</h2>
          <Button variant="outline" onClick={() => void logout()} className="bg-surface border-line">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </Panel>
      </div>
  )
}

interface ConfirmButtonProps {
  label: string
  title: string
  description: string
  disabled?: boolean
  onConfirm: () => void
}

function ConfirmButton({ label, title, description, disabled, onConfirm }: ConfirmButtonProps) {
  return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
              variant="destructive"
              disabled={disabled}
              className="bg-danger hover:bg-danger/90 border-none text-white shadow-none"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-line border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted">{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-ink border-line bg-transparent">취소</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className="bg-danger hover:bg-danger/90 text-white">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}
