"use client"

import { getBallColor } from "@/lib/lotto/colors"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { GRID_COLUMNS, GRID_ROWS, toGridPoint } from "@/lib/lotto/grid"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 한 칸의 크기와 간격 (SVG 좌표) */
const CELL = 40
const GAP = 6

/** 공 반지름. 칸을 꽉 채우면 답답해 보여 여백을 남긴다. */
const BALL_RADIUS = CELL / 2 - 5

/** 칸에 적히는 번호 크기 */
const CELL_FONT = 13

/** 공 위에 적히는 번호 크기. 공이 칸보다 작으므로 함께 줄인다. */
const BALL_FONT = 12

/** 그림 바깥 여백. 칸 테두리가 잘리지 않을 만큼만 둔다. */
const PADDING = 2

const STEP = CELL + GAP
const WIDTH = PADDING * 2 + GRID_COLUMNS * STEP - GAP
const HEIGHT = PADDING * 2 + GRID_ROWS * STEP - GAP

/** 칸의 중심 좌표 */
const centerOf = (number: number) => {
  const { col, row } = toGridPoint(number)
  return { x: PADDING + col * STEP + CELL / 2, y: PADDING + row * STEP + CELL / 2 }
}

interface PaperPatternProps {
  numbers: readonly number[]
  /** 비교용으로 옅게 겹쳐 그릴 과거 회차 번호 */
  compare?: readonly number[]
  className?: string
}

/**
 * 로또 용지 위에 번호를 찍고 순서대로 이어 모양을 보여준다.
 *
 * 추천 근거가 되는 "용지에서의 생김새"를 눈으로 확인할 수 있게 한다.
 */
export default function PaperPattern({ numbers, compare, className }: PaperPatternProps) {
  const { t } = useTranslation()
  const selected = new Set(numbers)
  const path = [...numbers].sort((a, b) => a - b).map(centerOf)
  const comparePath = compare ? [...compare].sort((a, b) => a - b).map(centerOf) : []

  return (
      <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={className}
          role="img"
          aria-label={t.analysis.slipLabel([...numbers].sort((a, b) => a - b).join(", "))}
      >
        {ALL_NUMBERS.map((number) => {
          const { col, row } = toGridPoint(number)
          const isSelected = selected.has(number)

          return (
              <g key={number}>
                <rect
                    x={PADDING + col * STEP}
                    y={PADDING + row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={6}
                    className="fill-surface stroke-line"
                    strokeWidth={1}
                />
                <text
                    x={PADDING + col * STEP + CELL / 2}
                    y={PADDING + row * STEP + CELL / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={isSelected ? "fill-transparent" : "fill-ink-muted"}
                    fontSize={CELL_FONT}
                >
                  {number}
                </text>
              </g>
          )
        })}

        {/* 비교 회차는 뒤쪽에 옅게 깔아 둔다. */}
        {comparePath.length > 1 && (
            <polyline
                points={comparePath.map((p) => `${p.x},${p.y}`).join(" ")}
                className="fill-none stroke-ink-muted"
                strokeWidth={2}
                strokeOpacity={0.35}
                strokeDasharray="5 4"
                strokeLinejoin="round"
            />
        )}

        {path.length > 1 && (
            <polyline
                points={path.map((p) => `${p.x},${p.y}`).join(" ")}
                className="fill-none stroke-blue-500"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        )}

        {[...numbers].sort((a, b) => a - b).map((number) => {
          const { x, y } = centerOf(number)

          return (
              <g key={`marked-${number}`}>
                <circle cx={x} cy={y} r={BALL_RADIUS} fill={getBallColor(number)} stroke="#fff" strokeWidth={1.5} />
                <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={BALL_FONT}
                    fontWeight={700}
                    fill="#0f0f0f"
                >
                  {number}
                </text>
              </g>
          )
        })}
      </svg>
  )
}
