"use client"

import { useEffect, useRef } from "react"
import { getBallColor } from "@/lib/lotto/colors"
import { ALL_NUMBERS } from "@/lib/lotto/constants"

/** 공이 유지해야 할 속도 범위 (px/frame) */
const MIN_SPEED = 3
const MAX_SPEED = 6

/** 벽에 부딪힐 때 방향을 흔드는 최대 각도(라디안) */
const BOUNCE_JITTER = 0.5

/** 캔버스 지름 대비 공 반지름 비율 */
const BALL_RADIUS_RATIO = 1 / 20

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  number: number
  color: string
}

interface MachineCanvasProps {
  /** 아직 뽑히지 않은 번호들. 뽑힌 공은 화면에서 사라진다. */
  remainingBalls: readonly number[]
  isAnimating: boolean
}

/**
 * 추첨통 안에서 공이 돌아가는 캔버스 애니메이션.
 *
 * 공이 하나 뽑힐 때마다 애니메이션 전체가 재시작되지 않도록,
 * 매 프레임 바뀌는 값은 ref로 넘기고 이펙트는 마운트/재생 여부에만 반응한다.
 */
export default function MachineCanvas({ remainingBalls, isAnimating }: MachineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const remainingRef = useRef<Set<number>>(new Set(remainingBalls))

  remainingRef.current = new Set(remainingBalls)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isAnimating) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    resize()
    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)

    particlesRef.current = createParticles(canvas.width, canvas.height)

    let frameId = 0
    const render = () => {
      drawFrame(ctx, canvas, particlesRef.current, remainingRef.current)
      frameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [isAnimating])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}

const createParticles = (width: number, height: number): Particle[] => {
  const radius = Math.min(width, height) * BALL_RADIUS_RATIO

  return ALL_NUMBERS.map((number) => {
    const angle = Math.random() * Math.PI * 2
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)

    return {
      x: Math.random() * (width - radius * 2) + radius,
      y: Math.random() * (height - radius * 2) + radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      number,
      color: getBallColor(number),
    }
  })
}

const drawFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    particles: Particle[],
    remaining: ReadonlySet<number>,
) => {
  const { width, height } = canvas
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * BALL_RADIUS_RATIO

  ctx.clearRect(0, 0, width, height)

  // 추첨통 외곽선
  ctx.beginPath()
  ctx.arc(centerX, centerY, width / 2 - 5, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
  ctx.lineWidth = 2
  ctx.stroke()

  for (const particle of particles) {
    if (!remaining.has(particle.number)) continue

    particle.radius = radius
    particle.x += particle.vx
    particle.y += particle.vy

    bounceOffWall(particle, centerX, centerY, width / 2 - radius - 5)
    clampSpeed(particle)
    paintBall(ctx, particle)
  }
}

/** 원형 벽에 닿으면 법선 방향으로 반사시키고 진행 방향을 살짝 흔든다. */
const bounceOffWall = (particle: Particle, centerX: number, centerY: number, maxDistance: number) => {
  const dx = particle.x - centerX
  const dy = particle.y - centerY
  if (Math.hypot(dx, dy) <= maxDistance) return

  const angle = Math.atan2(dy, dx)
  particle.x = centerX + Math.cos(angle) * maxDistance
  particle.y = centerY + Math.sin(angle) * maxDistance

  const normalX = Math.cos(angle)
  const normalY = Math.sin(angle)
  const dot = particle.vx * normalX + particle.vy * normalY
  const reflectedX = particle.vx - 2 * dot * normalX
  const reflectedY = particle.vy - 2 * dot * normalY

  // 같은 궤도만 반복하지 않도록 속도 크기는 두고 방향만 비튼다.
  const jitter = (Math.random() - 0.5) * BOUNCE_JITTER
  particle.vx = reflectedX * Math.cos(jitter) - reflectedY * Math.sin(jitter)
  particle.vy = reflectedX * Math.sin(jitter) + reflectedY * Math.cos(jitter)
}

/** 공이 멈추거나 너무 빨라지지 않도록 속도 크기를 범위 안으로 되돌린다. */
const clampSpeed = (particle: Particle) => {
  const speed = Math.hypot(particle.vx, particle.vy)
  if (speed >= MIN_SPEED && speed <= MAX_SPEED) return

  if (speed === 0) {
    const angle = Math.random() * Math.PI * 2
    particle.vx = Math.cos(angle) * MIN_SPEED
    particle.vy = Math.sin(angle) * MIN_SPEED
    return
  }

  const target = speed < MIN_SPEED ? MIN_SPEED + Math.random() : MAX_SPEED
  const scale = target / speed
  particle.vx *= scale
  particle.vy *= scale
}

const paintBall = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  ctx.beginPath()
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
  ctx.fillStyle = particle.color
  ctx.fill()
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = "#000"
  ctx.font = `bold ${particle.radius * 0.7}px Arial`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(String(particle.number), particle.x, particle.y)
}
