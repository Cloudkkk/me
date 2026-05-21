import { useEffect, useRef } from 'react'
import ChatBox from '../components/ChatBox'
import './Home.css'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  galaxyAngle: number
  galaxyRadius: number
  galaxySpeed: number
  vx: number
  vy: number
  size: number
  alpha: number
  isText: boolean
}

const TEXT = 'Hi, I\'m C1oud'
const PARTICLE_SIZE = 1.8
const TEXT_PARTICLE_DENSITY = 4
const BG_PARTICLE_COUNT = 80
const MOUSE_RADIUS = 40
const RETURN_SPEED = 0.02
const SCATTER_FORCE = 2
const FRICTION = 0.95
const CONNECTION_LIMIT = 60

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const animFrameRef = useRef<number>(0)
  const isChatFocusedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sampleCanvas = document.createElement('canvas')
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!sampleCtx) return

    let dpr = 1

    const buildParticles = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      sampleCanvas.width = w
      sampleCanvas.height = h

      const fontSize = Math.min(w * 0.12, 140)
      sampleCtx.clearRect(0, 0, w, h)
      sampleCtx.fillStyle = '#ffffff'
      sampleCtx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
      sampleCtx.textAlign = 'center'
      sampleCtx.textBaseline = 'middle'
      sampleCtx.fillText(TEXT, w / 2, h / 2)

      const imageData = sampleCtx.getImageData(0, 0, w, h)
      const textParticles: Particle[] = []

      const assignGalaxyProps = (p: any) => {
        const arms = 4
        const armOffset = (Math.PI * 2) / arms
        const randomArm = Math.floor(Math.random() * arms)
        const distance = Math.pow(Math.random(), 1.5) * Math.min(w, h) * 0.4
        const angle = randomArm * armOffset + distance * 0.008 + (Math.random() - 0.5) * 0.8
        p.galaxyAngle = angle
        p.galaxyRadius = distance
        p.galaxySpeed = 0.001 + (Math.random() * 0.002)
      }

      for (let y = 0; y < h; y += TEXT_PARTICLE_DENSITY) {
        for (let x = 0; x < w; x += TEXT_PARTICLE_DENSITY) {
          if (imageData.data[(y * w + x) * 4 + 3] > 128) {
            const p: any = {
              x,
              y,
              baseX: x,
              baseY: y,
              vx: 0,
              vy: 0,
              size: PARTICLE_SIZE + Math.random() * 0.6,
              alpha: 0.6 + Math.random() * 0.4,
              isText: true,
            }
            assignGalaxyProps(p)
            textParticles.push(p)
          }
        }
      }

      const bgParticles: Particle[] = Array.from({ length: BG_PARTICLE_COUNT }, () => {
        const bx = Math.random() * w
        const by = Math.random() * h
        const p: any = {
          x: bx, y: by, baseX: bx, baseY: by,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.25 + 0.05,
          isText: false,
        }
        assignGalaxyProps(p)
        return p
      })

      particlesRef.current = [...textParticles, ...bgParticles]
    }

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      buildParticles()
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const onMouseLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const particles = particlesRef.current
      const mouseRadiusSq = MOUSE_RADIUS * MOUSE_RADIUS
      const bgMouseRadius = MOUSE_RADIUS * 1.3
      const bgMouseRadiusSq = bgMouseRadius * bgMouseRadius
      const isFocused = isChatFocusedRef.current

      let nearCount = 0
      const nearBuf: Particle[] = []

      for (let i = 0, len = particles.length; i < len; i++) {
        const p = particles[i]
        const dx = mx - p.x
        const dy = my - p.y
        const distSq = dx * dx + dy * dy

        if (isFocused) {
          p.galaxyAngle += p.galaxySpeed
          const targetX = w / 2 + Math.cos(p.galaxyAngle) * p.galaxyRadius
          const targetY = h / 2 + Math.sin(p.galaxyAngle) * p.galaxyRadius

          if (distSq < mouseRadiusSq) {
            const dist = Math.sqrt(distSq)
            const angle = Math.atan2(dy, dx)
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * SCATTER_FORCE
            p.vx -= Math.cos(angle) * force
            p.vy -= Math.sin(angle) * force
            if (nearCount < CONNECTION_LIMIT) nearBuf[nearCount++] = p
          }

          p.vx += (targetX - p.x) * RETURN_SPEED
          p.vy += (targetY - p.y) * RETURN_SPEED
          p.vx *= FRICTION
          p.vy *= FRICTION
          p.x += p.vx
          p.y += p.vy
        } else {
          if (p.isText) {
            if (distSq < mouseRadiusSq) {
              const dist = Math.sqrt(distSq)
              const angle = Math.atan2(dy, dx)
              const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * SCATTER_FORCE
              p.vx -= Math.cos(angle) * force
              p.vy -= Math.sin(angle) * force
              if (nearCount < CONNECTION_LIMIT) nearBuf[nearCount++] = p
            }

            p.vx += (p.baseX - p.x) * RETURN_SPEED
            p.vy += (p.baseY - p.y) * RETURN_SPEED
            p.vx *= FRICTION
            p.vy *= FRICTION
            p.x += p.vx
            p.y += p.vy
          } else {
            const speedSq = p.vx * p.vx + p.vy * p.vy
            if (speedSq > 0.05) {
              p.vx *= 0.98
              p.vy *= 0.98
            }

            p.x += p.vx
            p.y += p.vy

            if (distSq < bgMouseRadiusSq) {
              const dist = Math.sqrt(distSq)
              const angle = Math.atan2(dy, dx)
              const force = (bgMouseRadius - dist) / bgMouseRadius * 0.25
              p.x -= Math.cos(angle) * force
              p.y -= Math.sin(angle) * force
              if (nearCount < CONNECTION_LIMIT) nearBuf[nearCount++] = p
            }

            if (p.x < 0 || p.x > w) p.vx *= -1
            if (p.y < 0 || p.y > h) p.vy *= -1
          }
        }

        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
      }

      if (nearCount > 1) {
        const connDist = 70
        const connDistSq = connDist * connDist
        ctx.lineWidth = 0.5
        for (let i = 0; i < nearCount; i++) {
          for (let j = i + 1; j < nearCount; j++) {
            const dx = nearBuf[i].x - nearBuf[j].x
            const dy = nearBuf[i].y - nearBuf[j].y
            const dSq = dx * dx + dy * dy
            if (dSq < connDistSq) {
              ctx.globalAlpha = (1 - dSq / connDistSq) * 0.08
              ctx.beginPath()
              ctx.moveTo(nearBuf[i].x, nearBuf[i].y)
              ctx.lineTo(nearBuf[j].x, nearBuf[j].y)
              ctx.strokeStyle = '#fff'
              ctx.stroke()
            }
          }
        }
      }

      ctx.globalAlpha = 1

      animFrameRef.current = requestAnimationFrame(animate)
    }

    resize()
    animate()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <section className="home">
      <canvas ref={canvasRef} className="particle-canvas" />

      <div className="home-overlay">
        <div className="home-subtitle">
          <span className="subtitle-text">developer / builder / dreamer</span>
        </div>

      </div>

      <div className="home-chat">
        <ChatBox onFocusChange={(focused) => {
          isChatFocusedRef.current = focused
        }} />
      </div>

      <div className="home-grid-overlay" />
    </section>
  )
}
