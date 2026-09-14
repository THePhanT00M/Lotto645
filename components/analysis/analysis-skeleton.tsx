import AnalysisBody from "@/components/analysis/analysis-body"
import { useTranslation } from "@/components/i18n/locale-provider"
import { findMultiples } from "@/lib/lotto/analytics"

const noop = () => {}

/**
 * 분석 패널 자리표시
 *
 * 본문(AnalysisBody)을 자리표시 값으로 그리고 .is-sk 로 글자만 가린다. 쌍둥이 조합은 방금 뽑은
 * 번호로 만들고 등장 이력만 비워 둔다. 기본으로 보이는 5개짜리 조합은 대부분 이력이 없어
 * 실제와 같은 높이가 된다.
 */
export function AnalysisSkeleton({ numbers }: { numbers: number[] }) {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.analysis.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <AnalysisBody
              multiples={findMultiples(numbers, [])}
              target="user"
              recommendation={null}
              stats={null}
              isGenerating={false}
              isRecommendBlocked
              onRecommend={noop}
              onTargetChange={noop}
          />
        </div>
      </div>
  )
}
