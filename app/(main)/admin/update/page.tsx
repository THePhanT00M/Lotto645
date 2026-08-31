"use client"

import { AlertTriangle, CheckCircle, DatabaseZap, Loader2, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/lib/api-config"
import type { WinningLottoNumbers } from "@/lib/lotto/types"
import { cn } from "@/lib/utils"

/** 업데이트 진행 상태 */
type UpdateState =
    | { kind: "loading"; message: string }
    | { kind: "success"; message: string; draw: WinningLottoNumbers }
    | { kind: "error"; message: string }

/**
 * 당첨 번호 업데이트 (관리자)
 *
 * 동행복권 API에서 다음 회차 결과를 가져와 DB에 넣고, 성공하면 전 회원에게
 * 알림을 보낸다. 알림 실패는 데이터 삽입 성공을 가리지 않도록 따로 처리한다.
 */
export default function UpdateDrawPage() {
  const [state, setState] = useState<UpdateState>({ kind: "loading", message: "업데이트 대기 중..." })

  const runUpdate = useCallback(async () => {
    setState({ kind: "loading", message: "최신 회차 확인 및 업데이트 시작..." })

    try {
      const response = await fetch(getApiUrl("/api/update-draw"))
      const result = await response.json()

      if (!response.ok || !result.success) {
        setState({ kind: "error", message: result.message ?? "알 수 없는 오류가 발생했습니다." })
        return
      }

      setState({ kind: "success", message: result.message, draw: result.data })
      await notifyMembers()
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "네트워크 오류 발생" })
    }
  }, [])

  useEffect(() => {
    void runUpdate()
  }, [runUpdate])

  const isLoading = state.kind === "loading"

  return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={DatabaseZap}
            title="당첨 번호 업데이트"
            description="동행복권 API를 확인하여 최신 당첨 번호를 업데이트 진행합니다."
        />

        <Panel>
          <Button
              onClick={runUpdate}
              disabled={isLoading}
              className="w-full bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  업데이트 중...
                </>
            ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  수동으로 다시 업데이트
                </>
            )}
          </Button>

          <div className={cn("mt-6 rounded-lg border p-5 transition-colors", STATE_STYLES[state.kind].box)}>
            <h2 className={cn("mb-3 flex items-center font-semibold", STATE_STYLES[state.kind].title)}>업데이트 상태:</h2>

            <div className={cn("flex items-center", STATE_STYLES[state.kind].body)}>
              {state.kind === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {state.kind === "success" && <CheckCircle className="mr-2 h-4 w-4" />}
              {state.kind === "error" && <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />}
              <span>
                {state.kind === "error" && <strong>오류: </strong>}
                {state.message}
              </span>
            </div>

            {state.kind === "success" && <DrawSummary draw={state.draw} />}
          </div>
        </Panel>
      </div>
  )
}

const STATE_STYLES = {
  loading: {
    box: "bg-surface border-line",
    title: "text-ink",
    body: "text-blue-600 dark:text-blue-400",
  },
  success: {
    box: "bg-accent-soft border-accent-line",
    title: "text-accent",
    body: "text-green-600 dark:text-green-400",
  },
  error: {
    box: "bg-[#fff0f0] border-[#ffcdcd] dark:bg-[#3e1b1b] dark:border-[#5c2b2b]",
    title: "text-danger",
    body: "text-danger",
  },
} as const

function DrawSummary({ draw }: { draw: WinningLottoNumbers }) {
  return (
      <div className="border-accent-line mt-4 border-t pt-4">
        <h3 className="text-ink mb-2 font-medium">{draw.drawNo}회 데이터가 삽입되었습니다:</h3>
        <dl className="text-ink-muted space-y-1 text-sm">
          <SummaryRow label="날짜">{draw.date}</SummaryRow>
          <SummaryRow label="번호">{draw.numbers.join(", ")}</SummaryRow>
          <SummaryRow label="보너스">{draw.bonusNo}</SummaryRow>
        </dl>
      </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
      <div className="flex gap-2">
        <dt className="text-ink font-medium">{label}:</dt>
        <dd>{children}</dd>
      </div>
  )
}

/** 새 당첨 번호가 들어오면 전 회원에게 알림을 보낸다. */
const notifyMembers = async () => {
  try {
    await fetch(getApiUrl("/api/admin/notifications"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "신규 당첨 번호 안내",
        message: "이번 주 로또 당첨 번호가 업데이트되었습니다. 지금 확인해보세요!",
      }),
    })
  } catch (error) {
    console.error("알림 전송 중 오류 발생:", error)
  }
}
