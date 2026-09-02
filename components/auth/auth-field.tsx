"use client"

import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useState, type ChangeEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

interface AuthFieldProps {
  id: string
  label: string
  type?: "text" | "email" | "password"
  placeholder?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: string
  /** 라벨 오른쪽에 놓는 보조 링크 등 */
  action?: ReactNode
}

/** 라벨·입력·에러 메시지를 묶은 인증 폼 필드. */
export default function AuthField({
                                    id,
                                    label,
                                    type = "text",
                                    placeholder,
                                    value,
                                    onChange,
                                    disabled,
                                    error,
                                    action,
                                  }: AuthFieldProps) {
  const { t } = useTranslation()
  const [isRevealed, setIsRevealed] = useState(false)
  const isPassword = type === "password"

  return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-ink text-sm font-medium">
            {label}
          </Label>
          {action}
        </div>

        <div className="relative">
          <Input
              id={id}
              type={isPassword && isRevealed ? "text" : type}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={cn(
                  "border-line h-12 rounded-lg bg-white transition-all focus:ring-2 dark:bg-[#121212]",
                  isPassword && "pr-10",
                  error && "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500",
              )}
          />

          {isPassword && (
              <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRevealed((prev) => !prev)}
                  aria-label={isRevealed ? t.auth.hidePassword : t.auth.showPassword}
                  className="text-ink-muted absolute top-1 right-1 h-10 w-10 px-0 hover:bg-transparent"
              >
                {isRevealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
          )}
        </div>

        {/* 테두리만 강조하려고 빈 문자열을 넘기는 경우가 있어 공백은 무시한다. */}
        {error?.trim() && (
            <div className="flex items-center text-red-500 dark:text-red-400">
              <AlertCircle className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs font-medium">{error}</span>
            </div>
        )}
      </div>
  )
}
