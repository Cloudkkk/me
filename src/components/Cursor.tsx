import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0
    let mouseY = 0
    let ringX = 0
    let ringY = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      ring.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`
      requestAnimationFrame(animate)
    }

    const onMouseEnterInteractive = () => {
      ring.style.width = '48px'
      ring.style.height = '48px'
      ring.style.borderColor = '#fff'
    }

    const onMouseLeaveInteractive = () => {
      ring.style.width = '32px'
      ring.style.height = '32px'
      ring.style.borderColor = 'rgba(255,255,255,0.4)'
    }

    window.addEventListener('mousemove', onMouseMove)
    animate()

    const interactives = document.querySelectorAll('a, button, [data-hover]')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onMouseEnterInteractive)
      el.addEventListener('mouseleave', onMouseLeaveInteractive)
    })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnterInteractive)
        el.removeEventListener('mouseleave', onMouseLeaveInteractive)
      })
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 6, height: 6,
        background: '#fff', borderRadius: '50%', pointerEvents: 'none',
        zIndex: 9999, mixBlendMode: 'difference',
      }} />
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, width: 32, height: 32,
        border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9998,
        transition: 'width 0.3s, height 0.3s, border-color 0.3s',
        mixBlendMode: 'difference',
      }} />
    </>
  )
}
