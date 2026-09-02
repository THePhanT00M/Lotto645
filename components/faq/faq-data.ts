import { Save, ShieldQuestion, Sparkles, type LucideIcon } from "lucide-react"

/**
 * FAQ 묶음의 껍데기
 *
 * 질문과 답은 언어마다 다르므로 문구 사전(lib/i18n/messages)에 두고, 여기에는
 * 어느 묶음을 어떤 아이콘·색으로 그릴지만 남긴다.
 */
export interface FaqSection {
  /** 탭을 가리키는 값이자 문구 사전에서 찾을 이름 */
  key: "service" | "analysis" | "data"
  icon: LucideIcon
  /** 아이콘·강조 색 (Tailwind 클래스) */
  accentClass: string
}

export const FAQ_SECTIONS: readonly FaqSection[] = [
  { key: "service", icon: ShieldQuestion, accentClass: "text-blue-600 dark:text-blue-400" },
  { key: "analysis", icon: Sparkles, accentClass: "text-purple-600 dark:text-purple-400" },
  { key: "data", icon: Save, accentClass: "text-green-600 dark:text-green-400" },
]
