"use client"

import { getBallColor } from "@/lib/lotto/colors"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { GRID_COLUMNS, GRID_ROWS, toGridPoint } from "@/lib/lotto/grid"

/** 한 칸의 크기와 간격 (SVG 좌표) */
const CELL = 40
const GAP = 8
const PADDING = 10

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
  const selected = new Set(numbers)
  const path = [...numbers].sort((a, b) => a - b).map(centerOf)
  const comparePath = compare ? [...compare].sort((a, b) => a - b).map(centerOf) : []

  return (
      <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={className}
          role="img"
          aria-label={`로또 용지에 표시한 번호 ${[...numbers].sort((a, b) => a - b).join(", ")}`}
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
                    className="fill-transparent stroke-line"
                    strokeWidth={1}
                />
                <text
                    x={PADDING + col * STEP + CELL / 2}
                    y={PADDING + row * STEP + CELL / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={isSelected ? "fill-transparent" : "fill-ink-muted"}
                    fontSize={15}
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
                <circle cx={x} cy={y} r={CELL / 2 - 2} fill={getBallColor(number)} stroke="#fff" strokeWidth={1.5} />
                <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
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
