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

    // Initialize particles if empty or when availableBalls changes
    if (particlesRef.current.length === 0 || particlesRef.current.length !== availableBalls.length) {
      particlesRef.current = availableBalls.map((number) => {
        // Increased radius for larger balls
        const radius = canvas.width < 400 ? 15 : 20
        return {
          x: Math.random() * (canvas.width - radius * 2) + radius,
          y: Math.random() * (canvas.height - radius * 2) + radius,
          radius,
          number,
          // Increased velocity for faster movement
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
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

          // Reflect velocity
          const normalX = Math.cos(angle)
          const normalY = Math.sin(angle)
          const dot = particle.vx * normalX + particle.vy * normalY
          particle.vx = particle.vx - 2 * dot * normalX
          particle.vy = particle.vy - 2 * dot * normalY

          // Add more randomness to prevent balls from getting stuck in patterns
          // and to make movement more dynamic
          particle.vx += (Math.random() - 0.5) * 0.8
          particle.vy += (Math.random() - 0.5) * 0.8
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
        // Larger font size for the numbers
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
