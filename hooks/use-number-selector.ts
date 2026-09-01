"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { recordPick } from "@/lib/lotto/pick-log"
import { pickUnique } from "@/lib/lotto/random"

/** 번호판 조작 모드 */
export type SelectorMode = "select" | "fix" | "exclude"

interface UseNumberSelectorOptions {
  /** 6개가 모두 채워졌을 때 호출된다. */
  onComplete: (numbers: number[]) => void
  /** 6개였던 선택이 깨졌을 때 호출된다. */
  onReset: () => void
  /** 이번 선택이 겨냥하는 회차 */
  targetDrawNo?: number
}

/**
 * 수동 추첨기의 상태 기계.
 *
 * 선택·고정·제외 세 집합의 관계(고정은 항상 선택에 포함되고 제외와 배타)를
 * 이 훅 안에서만 관리해 컴포넌트에서는 토글만 호출하면 되도록 한다.
 */
export function useNumberSelector({ onComplete, onReset, targetDrawNo }: UseNumberSelectorOptions) {
  const [mode, setMode] = useState<SelectorMode>("select")
  const [selected, setSelected] = useState<number[]>([])
  const [fixed, setFixed] = useState<number[]>([])
  const [excluded, setExcluded] = useState<number[]>([])

  /** 같은 조합을 중복 기록하지 않기 위한 잠금 */
  const recordedKeyRef = useRef<string | null>(null)
  /** 완성 상태가 풀리는 순간을 잡기 위한 직전 값 */
  const wasCompleteRef = useRef(false)

  const isComplete = selected.length === PICK_COUNT

  const toggle = useCallback(
      (number: number) => {
        if (mode === "select") {
          setSelected((prev) => {
            if (prev.includes(number)) {
              return fixed.includes(number) ? prev : prev.filter((n) => n !== number)
            }
            return prev.length < PICK_COUNT ? [...prev, number] : prev
          })
          return
        }

        if (mode === "fix") {
          if (excluded.includes(number)) return

          if (fixed.includes(number)) {
            setFixed((prev) => prev.filter((n) => n !== number))
            setSelected((prev) => prev.filter((n) => n !== number))
            return
          }

          // 고정은 선택 자리를 차지하므로 6자리를 넘길 수 없다.
          if (selected.length >= PICK_COUNT && !selected.includes(number)) return

          setFixed((prev) => [...prev, number])
          setSelected((prev) => (prev.includes(number) ? prev : [...prev, number]))
          return
        }

        if (fixed.includes(number)) return

        setExcluded((prev) =>
            prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number],
        )
        setSelected((prev) => prev.filter((n) => n !== number))
      },
      [excluded, fixed, mode, selected],
  )

  /** 고정 번호는 남기고 나머지 자리를 무작위로 채운다. */
  const autoFill = useCallback(() => {
    const blocked = new Set([...excluded, ...fixed])
    const candidates = ALL_NUMBERS.filter((n) => !blocked.has(n))
    const filled = pickUnique(candidates, PICK_COUNT - fixed.length)

    setSelected([...fixed, ...filled])
  }, [excluded, fixed])

  const reset = useCallback(() => {
    setSelected([])
    setFixed([])
    setExcluded([])
    recordedKeyRef.current = null
    onReset()
  }, [onReset])

  /** 외부에서 이미 뽑힌 번호를 그대로 반영한다(추첨기 결과 이어받기). */
  const applyNumbers = useCallback((numbers: number[]) => {
    setSelected(numbers)
    // 이어받은 번호는 추첨기 쪽에서 이미 기록됐으므로 다시 남기지 않는다.
    recordedKeyRef.current = [...numbers].sort((a, b) => a - b).join("-")
    wasCompleteRef.current = numbers.length === PICK_COUNT
  }, [])

  /** 번호판에서 해당 번호를 누를 수 없는지 판단한다. */
  const isDisabled = useCallback(
      (number: number) => {
        switch (mode) {
          case "select":
            return fixed.includes(number) || (selected.length >= PICK_COUNT && !selected.includes(number))
          case "fix":
            return excluded.includes(number) || (selected.length >= PICK_COUNT && !selected.includes(number))
          case "exclude":
            return fixed.includes(number)
        }
      },
      [excluded, fixed, mode, selected],
  )

  useEffect(() => {
    if (!isComplete) {
      recordedKeyRef.current = null
      // 6개가 채워졌다가 풀리면 분석 영역도 함께 초기화한다.
      if (wasCompleteRef.current) {
        wasCompleteRef.current = false
        onReset()
      }
      return
    }

    wasCompleteRef.current = true

    const numbers = [...selected].sort((a, b) => a - b)
    const key = numbers.join("-")
    if (recordedKeyRef.current === key) return

    recordedKeyRef.current = key
    onComplete(numbers)
    void recordPick({ numbers, source: "manual", drawNo: targetDrawNo })
  }, [isComplete, onComplete, onReset, selected, targetDrawNo])

  return {
    mode,
    setMode,
    selected,
    fixed,
    excluded,
    isComplete,
    toggle,
    autoFill,
    reset,
    applyNumbers,
    isDisabled,
  }
}
