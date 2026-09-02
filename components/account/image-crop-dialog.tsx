"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Loader2, ZoomIn } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** 원본을 얼마나 확대할 수 있는지 */
const MAX_ZOOM = 3

interface ImageCropDialogProps {
  /** 자를 원본. null 이면 닫힌 상태다. */
  file: File | null
  title: string
  /** 자를 영역의 가로 ÷ 세로 */
  aspect: number
  /** 저장할 가로 픽셀. 세로는 aspect 로 정해진다. */
  outputWidth: number
  /** 아바타처럼 동그란 영역으로 보여 줄지 */
  round?: boolean
  isSaving?: boolean
  onCancel: () => void
  onConfirm: (image: Blob) => void
}

/**
 * 올리기 전에 쓸 영역을 고른다.
 *
 * 원본을 통째로 올리면 화면에서 잘리는 부분을 사용자가 정할 수 없다. 여기서
 * 끌어 위치를 잡고 확대해 정한 영역만 잘라 보내므로, 저장된 그림과 화면에
 * 보이는 그림이 같아진다.
 */
export default function ImageCropDialog({
                                          file,
                                          title,
                                          aspect,
                                          outputWidth,
                                          round = false,
                                          isSaving = false,
                                          onCancel,
                                          onConfirm,
                                        }: ImageCropDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null)

  const [source, setSource] = useState<{ image: HTMLImageElement; url: string } | null>(null)
  const [frameWidth, setFrameWidth] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // 원본을 읽어 둔다. 자르기는 화면에서 끝나므로 서버를 거치지 않는다.
  useEffect(() => {
    if (!file) {
      setSource(null)
      return
    }

    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      setSource({ image, url })
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    image.src = url

    return () => URL.revokeObjectURL(url)
  }, [file])

  // 틀 크기는 화면 폭에 따라 달라지므로 재서 쓴다.
  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setFrameWidth(entry.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [source])

  const frameHeight = frameWidth / aspect
  const metrics = measure(source?.image, frameWidth, frameHeight, zoom)

  const moveTo = (next: { x: number; y: number }) => setOffset(clamp(next, metrics))

  const changeZoom = (value: number) => {
    setZoom(value)
    setOffset((previous) => clamp(previous, measure(source?.image, frameWidth, frameHeight, value)))
  }

  const confirm = () => {
    if (!source || !metrics || !file) return

    const outputHeight = Math.round(outputWidth / aspect)
    const canvas = document.createElement("canvas")
    canvas.width = outputWidth
    canvas.height = outputHeight

    const context = canvas.getContext("2d")
    if (!context) return

    // 투명한 원본은 형식을 지켜 그대로 두고, 그 밖에는 JPEG 로 줄인다.
    const type = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg"
    if (type === "image/jpeg") {
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, outputWidth, outputHeight)
    }

    // 틀에서 보이던 그대로를 저장 크기로 확대해 옮긴다.
    const ratio = outputWidth / frameWidth
    const width = metrics.width * ratio
    const height = metrics.height * ratio

    context.drawImage(
        source.image,
        outputWidth / 2 - width / 2 + offset.x * ratio,
        outputHeight / 2 - height / 2 + offset.y * ratio,
        width,
        height,
    )

    canvas.toBlob((blob) => blob && onConfirm(blob), type, 0.92)
  }

  return (
      <DialogPrimitive.Root open={Boolean(file)} onOpenChange={(open) => !open && onCancel()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />

          <DialogPrimitive.Content className="bg-panel border-line fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5 shadow-lg">
            <DialogPrimitive.Title className="text-ink text-lg font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-ink-muted mt-1 text-sm">
              끌어서 위치를 잡고, 아래에서 크기를 맞춥니다.
            </DialogPrimitive.Description>

            <div
                ref={frameRef}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  dragRef.current = {
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    offsetX: offset.x,
                    offsetY: offset.y,
                  }
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current
                  if (!drag) return

                  moveTo({
                    x: drag.offsetX + event.clientX - drag.pointerX,
                    y: drag.offsetY + event.clientY - drag.pointerY,
                  })
                }}
                onPointerUp={() => {
                  dragRef.current = null
                }}
                className="relative mt-4 w-full cursor-grab touch-none overflow-hidden rounded-lg bg-black active:cursor-grabbing"
                style={{ height: frameHeight || undefined, aspectRatio: frameHeight ? undefined : aspect }}
            >
              {source && metrics && (
                  <img
                      src={source.url}
                      alt=""
                      draggable={false}
                      // 기본 스타일의 img{max-width:100%} 가 걸리면 틀 너비로 눌려 비율이 틀어진다.
                      className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                      style={{
                        width: metrics.width,
                        height: metrics.height,
                        transform: `translate(${-metrics.width / 2 + offset.x}px, ${-metrics.height / 2 + offset.y}px)`,
                      }}
                  />
              )}

              {/* 바깥을 덮어 어디가 저장될 영역인지 드러낸다. */}
              <div
                  className={cn(
                      "pointer-events-none absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]",
                      round && "rounded-full",
                  )}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <ZoomIn className="text-ink-muted h-4 w-4 shrink-0" />
              <input
                  type="range"
                  min={1}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => changeZoom(Number(event.target.value))}
                  aria-label="확대"
                  className="h-1 w-full accent-blue-600"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSaving} className="bg-surface border-line">
                취소
              </Button>
              <Button onClick={confirm} disabled={isSaving || !source} className="bg-blue-600 text-white hover:bg-blue-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                적용
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
  )
}

interface Metrics {
  width: number
  height: number
  /** 중심에서 밀 수 있는 최대 거리. 넘기면 틀에 빈 곳이 생긴다. */
  maxX: number
  maxY: number
}

/** 틀을 항상 덮는 크기를 구한다. */
const measure = (
    image: HTMLImageElement | undefined,
    frameWidth: number,
    frameHeight: number,
    zoom: number,
): Metrics | null => {
  if (!image || frameWidth <= 0 || frameHeight <= 0) return null

  const cover = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight)
  const width = image.naturalWidth * cover * zoom
  const height = image.naturalHeight * cover * zoom

  return {
    width,
    height,
    maxX: Math.max(0, (width - frameWidth) / 2),
    maxY: Math.max(0, (height - frameHeight) / 2),
  }
}

const clamp = (offset: { x: number; y: number }, metrics: Metrics | null) => {
  if (!metrics) return offset

  return {
    x: Math.min(metrics.maxX, Math.max(-metrics.maxX, offset.x)),
    y: Math.min(metrics.maxY, Math.max(-metrics.maxY, offset.y)),
  }
}
