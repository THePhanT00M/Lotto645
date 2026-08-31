"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { fetchDrawPage, fetchLatestDraw } from "@/lib/lotto/queries"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/** 한 번에 불러오는 회차 수 */
export const PAGE_SIZE = 20

/** 목록 위·아래 끝을 얼마나 앞당겨 감지할지 */
const TRIGGER_MARGIN = "50px"

/**
 * 회차 목록을 양방향 무한 스크롤로 탐색하는 상태 기계.
 *
 * 위쪽에 항목이 추가되면 브라우저가 스크롤 위치를 유지해주지 않으므로,
 * 삽입 전후의 높이 차이만큼 scrollTop을 직접 보정한다.
 */
export function useDrawBrowser() {
  const [latestDrawNo, setLatestDrawNo] = useState(0)
  const [draws, setDraws] = useState<WinningLottoNumbers[]>([])
  const [currentDraw, setCurrentDraw] = useState<WinningLottoNumbers | null>(null)

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [isLoadingNewer, setIsLoadingNewer] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [hasMoreNewer, setHasMoreNewer] = useState(false)

  /** 목록 중앙으로 옮겨야 할 회차 */
  const [scrollTargetNo, setScrollTargetNo] = useState<number | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const topTriggerRef = useRef<HTMLDivElement>(null)
  const bottomTriggerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<number, HTMLDivElement>())

  /**
   * 옵저버 콜백이 읽는 최신 상태.
   *
   * 콜백이 state를 직접 참조하면 목록이 바뀔 때마다 옵저버를 다시 만들어야 하는데,
   * observe()는 이미 교차 중인 요소를 즉시 콜백으로 알리기 때문에
   * 재생성 → 즉시 로드 → 재생성이 무한히 이어진다. 그래서 ref로 읽는다.
   */
  const stateRef = useRef({ draws, hasMoreOlder, hasMoreNewer })
  stateRef.current = { draws, hasMoreOlder, hasMoreNewer }

  /** 로딩 여부의 동기 가드. state는 갱신이 늦어 같은 프레임의 중복 호출을 막지 못한다. */
  const loadingRef = useRef({ older: false, newer: false })

  /** 회차 점프로 스크롤을 재배치하는 동안에는 자동 로딩을 멈춘다. */
  const isJumpingRef = useRef(false)

  /** 위쪽 삽입 직전의 스크롤 상태 */
  const prependRef = useRef<{ height: number; top: number } | null>(null)

  const registerItem = useCallback((drawNo: number, element: HTMLDivElement | null) => {
    if (element) itemRefs.current.set(drawNo, element)
    else itemRefs.current.delete(drawNo)
  }, [])

  // 최초 진입: 최신 회차를 기준으로 첫 페이지를 채운다.
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const latest = await fetchLatestDraw()
      if (cancelled || !latest) {
        setIsInitialLoading(false)
        return
      }

      const page = await fetchDrawPage(latest.drawNo, "older", PAGE_SIZE)
      if (cancelled) return

      setLatestDrawNo(latest.drawNo)
      setCurrentDraw(latest)
      setDraws(page)
      setHasMoreOlder(page.length === PAGE_SIZE)
      setHasMoreNewer(false)
      setIsInitialLoading(false)
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [])

  const loadOlder = useCallback(async () => {
    const { draws: loaded, hasMoreOlder: canLoad } = stateRef.current
    const oldest = loaded.at(-1)

    if (!oldest || !canLoad || loadingRef.current.older || isJumpingRef.current) return

    loadingRef.current.older = true
    setIsLoadingOlder(true)

    const page = await fetchDrawPage(oldest.drawNo - 1, "older", PAGE_SIZE)

    setDraws((prev) => mergeUnique(prev, page, "append"))
    setHasMoreOlder(page.length === PAGE_SIZE)
    setIsLoadingOlder(false)
    loadingRef.current.older = false
  }, [])

  const loadNewer = useCallback(async () => {
    const { draws: loaded, hasMoreNewer: canLoad } = stateRef.current
    const newest = loaded[0]

    if (!newest || !canLoad || loadingRef.current.newer || isJumpingRef.current) return

    loadingRef.current.newer = true
    setIsLoadingNewer(true)

    const page = await fetchDrawPage(newest.drawNo, "newer", PAGE_SIZE)

    // 삽입 직전 높이를 재두어야 아래 useLayoutEffect에서 위치를 되돌릴 수 있다.
    if (page.length > 0 && listRef.current) {
      prependRef.current = { height: listRef.current.scrollHeight, top: listRef.current.scrollTop }
    }

    setDraws((prev) => mergeUnique(prev, page, "prepend"))
    if (page.length < PAGE_SIZE) setHasMoreNewer(false)
    setIsLoadingNewer(false)
    loadingRef.current.newer = false
  }, [])

  /** 특정 회차로 이동한다. 목록에 없으면 그 회차 주변을 다시 불러온다. */
  const jumpTo = useCallback(
      async (targetNo: number) => {
        if (targetNo < 1 || targetNo > latestDrawNo) return false

        const loaded = stateRef.current.draws.find((draw) => draw.drawNo === targetNo)
        if (loaded) {
          isJumpingRef.current = true
          setCurrentDraw(loaded)
          setScrollTargetNo(targetNo)
          return true
        }

        // 목표 회차가 목록 가운데쯤 오도록 위쪽 여유를 두고 불러온다.
        const cursor = Math.min(latestDrawNo, targetNo + Math.floor(PAGE_SIZE / 2))

        isJumpingRef.current = true
        setIsLoadingOlder(true)

        const page = await fetchDrawPage(cursor, "older", PAGE_SIZE)

        setIsLoadingOlder(false)

        const target = page.find((draw) => draw.drawNo === targetNo)
        if (!target) {
          isJumpingRef.current = false
          return false
        }

        // 목록을 통째로 갈아끼우므로 이전 위치 보정은 의미가 없다.
        prependRef.current = null
        setDraws(page)
        setHasMoreNewer(cursor < latestDrawNo)
        setHasMoreOlder(page.at(-1)!.drawNo > 1)
        setCurrentDraw(target)
        setScrollTargetNo(targetNo)

        return true
      },
      [latestDrawNo],
  )

  // 위쪽에 항목이 붙은 직후 스크롤 위치를 보정한다.
  useLayoutEffect(() => {
    const snapshot = prependRef.current
    const container = listRef.current
    if (!snapshot || !container) return

    container.scrollTop = snapshot.top + (container.scrollHeight - snapshot.height)
    prependRef.current = null
  }, [draws])

  // 이동 대상 회차를 목록 중앙에 맞춘다.
  useLayoutEffect(() => {
    if (scrollTargetNo === null) return

    const container = listRef.current
    const element = itemRefs.current.get(scrollTargetNo)
    if (!container || !element) return

    // 부드러운 스크롤은 애니메이션이 끝나기 전에 자동 로딩이 끼어들어
    // 위치를 흔들 수 있으므로 곧바로 배치한다.
    container.scrollTop = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2
    setScrollTargetNo(null)

    // 배치가 화면에 반영된 뒤에 자동 로딩을 다시 연다.
    const frame = requestAnimationFrame(() => {
      isJumpingRef.current = false
    })

    return () => cancelAnimationFrame(frame)
  }, [draws, scrollTargetNo])

  // 목록 위아래 끝에 도달하면 다음 페이지를 불러온다. 옵저버는 한 번만 만든다.
  useEffect(() => {
    const container = listRef.current
    const topTrigger = topTriggerRef.current
    const bottomTrigger = bottomTriggerRef.current
    if (!container || !topTrigger || !bottomTrigger) return

    const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            if (entry.target === topTrigger) void loadNewer()
            if (entry.target === bottomTrigger) void loadOlder()
          }
        },
        { root: container, threshold: 0.1, rootMargin: TRIGGER_MARGIN },
    )

    observer.observe(topTrigger)
    observer.observe(bottomTrigger)

    return () => observer.disconnect()
  }, [loadNewer, loadOlder])

  return {
    draws,
    currentDraw,
    setCurrentDraw,
    latestDrawNo,
    isInitialLoading,
    isLoadingOlder,
    isLoadingNewer,
    hasMoreOlder,
    hasMoreNewer,
    jumpTo,
    listRef,
    topTriggerRef,
    bottomTriggerRef,
    registerItem,
  }
}

/** 이미 담긴 회차는 건너뛰고 앞/뒤에 이어 붙인다. */
const mergeUnique = (
    current: WinningLottoNumbers[],
    incoming: WinningLottoNumbers[],
    position: "append" | "prepend",
): WinningLottoNumbers[] => {
  const existing = new Set(current.map((draw) => draw.drawNo))
  const fresh = incoming.filter((draw) => !existing.has(draw.drawNo))

  return position === "append" ? [...current, ...fresh] : [...fresh, ...current]
}
