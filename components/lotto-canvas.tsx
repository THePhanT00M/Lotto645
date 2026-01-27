"use client"

import { useEffect, useRef } from "react"
import { getBallColor } from "@/utils/lotto-utils"

interface LottoCanvasProps {
  availableBalls: number[]
  isAnimating: boolean
}

export default function LottoCanvas({ availableBalls, isAnimating }: LottoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<
      Array<{
        x: number
        y: number
        radius: number
        number: number
        vx: number
        vy: number
        color: string
      }>
  >([])

  // Animation loop for balls in the machine
  useEffect(() => {
    if (!canvasRef.current || !isAnimating) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const MIN_SPEED = 3
    const MAX_SPEED = 6

    // Initialize particles if empty or when availableBalls changes
    if (particlesRef.current.length === 0 || particlesRef.current.length !== availableBalls.length) {
      particlesRef.current = availableBalls.map((number) => {
        const radius = canvas.width < 400 ? 15 : 20

        // [수정됨] 초기 속도 설정: 랜덤한 방향을 가지되, 최소 속도는 보장
        const angle = Math.random() * Math.PI * 2
        // MIN과 MAX 사이의 랜덤한 속도 크기 결정
        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)

        return {
          x: Math.random() * (canvas.width - radius * 2) + radius,
          y: Math.random() * (canvas.height - radius * 2) + radius,
          radius,
          number,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: getBallColor(number),
        }
      })
    }

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 캔버스 크기에 따라 공 크기 동적 조정
      const dynamicRadius = Math.min(canvas.width, canvas.height) / 20

      // 공 크기 업데이트
      particlesRef.current.forEach((particle) => {
        particle.radius = dynamicRadius
      })

      // Draw circular container
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Skip drawing balls that have been drawn
        if (!availableBalls.includes(particle.number)) return

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Boundary collision detection (circular boundary)
        const distanceFromCenter = Math.sqrt(
            Math.pow(particle.x - canvas.width / 2, 2) + Math.pow(particle.y - canvas.height / 2, 2),
        )
        const maxDistance = canvas.width / 2 - particle.radius - 5

        if (distanceFromCenter > maxDistance) {
          // Calculate new direction by reflecting off the circular boundary
          const angle = Math.atan2(particle.y - canvas.height / 2, particle.x - canvas.width / 2)
          const newX = canvas.width / 2 + Math.cos(angle) * maxDistance
          const newY = canvas.height / 2 + Math.sin(angle) * maxDistance

          // Update position to be on the boundary
          particle.x = newX
          particle.y = newY

          // Reflect velocity (기본 반사)
          const normalX = Math.cos(angle)
          const normalY = Math.sin(angle)
          const dot = particle.vx * normalX + particle.vy * normalY
          particle.vx = particle.vx - 2 * dot * normalX
          particle.vy = particle.vy - 2 * dot * normalY

          // [수정됨] 무작위 속도 증가 대신, "바람 효과"를 위해 방향만 살짝 비틂 (속도 크기 유지)
          // -0.2 ~ 0.2 라디안 정도의 랜덤한 각도 변화를 줌
          const randomAngleParams = (Math.random() - 0.5) * 0.5
          const currentVx = particle.vx
          const currentVy = particle.vy

          // 회전 변환 행렬 적용 (방향만 변경)
          particle.vx = currentVx * Math.cos(randomAngleParams) - currentVy * Math.sin(randomAngleParams)
          particle.vy = currentVx * Math.sin(randomAngleParams) + currentVy * Math.cos(randomAngleParams)
        }

        // [수정됨] 속도 보정 로직 (매 프레임 확인)
        // 공이 너무 느리거나 너무 빨라지지 않도록 속도 벡터의 크기(Magnitude)를 조정
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)

        if (currentSpeed < MIN_SPEED || currentSpeed > MAX_SPEED) {
          // 목표 속도 설정 (범위 밖이면 경계값으로, 아니면 그대로)
          let targetSpeed = currentSpeed
          if (currentSpeed < MIN_SPEED) targetSpeed = MIN_SPEED + Math.random() // 너무 느리면 최소 속도보다 살짝 빠르게
          if (currentSpeed > MAX_SPEED) targetSpeed = MAX_SPEED

          // 0으로 나누기 방지
          if (currentSpeed === 0) {
            particle.vx = (Math.random() - 0.5) * targetSpeed
            particle.vy = (Math.random() - 0.5) * targetSpeed
          } else {
            // 현재 방향은 유지하면서 속도 크기(스칼라)만 조절
            const scale = targetSpeed / currentSpeed
            particle.vx *= scale
            particle.vy *= scale
          }
        }

        // Draw ball
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw number
        ctx.fillStyle = "#000"
        const fontSize = particle.radius * 0.7
        ctx.font = `bold ${fontSize}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(particle.number.toString(), particle.x, particle.y)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [isAnimating, availableBalls, availableBalls.length])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}