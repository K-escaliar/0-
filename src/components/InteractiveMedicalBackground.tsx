'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo interativo em canvas: uma rede de "células" (nós) ligadas por linhas,
 * com algumas cruzes médicas. Os nós reagem ao mouse — se afastam do cursor e
 * se conectam a ele. Leve (requestAnimationFrame + canvas 2D), discreto e atrás
 * do conteúdo (pointer-events: none).
 */
export default function InteractiveMedicalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    type Node = {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      cross: boolean
    }
    let nodes: Node[] = []

    const mouse = { x: -9999, y: -9999 }

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // densidade proporcional à área (limitada para não pesar)
      const count = Math.min(90, Math.floor((width * height) / 16000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 2 + Math.random() * 2,
        cross: Math.random() < 0.18,
      }))
    }

    const ACCENT = '37, 99, 235' // azul da marca (rgb)
    const LINK_DIST = 130
    const MOUSE_DIST = 170

    function drawCross(x: number, y: number, s: number, alpha: number) {
      ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(x - s, y)
      ctx.lineTo(x + s, y)
      ctx.moveTo(x, y - s)
      ctx.lineTo(x, y + s)
      ctx.stroke()
    }

    function step() {
      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        // repulsão suave do mouse
        const dxm = n.x - mouse.x
        const dym = n.y - mouse.y
        const dm = Math.hypot(dxm, dym)
        if (dm < MOUSE_DIST && dm > 0) {
          const force = (MOUSE_DIST - dm) / MOUSE_DIST
          n.vx += (dxm / dm) * force * 0.6
          n.vy += (dym / dm) * force * 0.6
        }

        n.x += n.vx
        n.y += n.vy

        // atrito + leve aceleração base para manter o movimento vivo
        n.vx *= 0.96
        n.vy *= 0.96
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.04
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.04

        // bordas (wrap)
        if (n.x < -20) n.x = width + 20
        if (n.x > width + 20) n.x = -20
        if (n.y < -20) n.y = height + 20
        if (n.y > height + 20) n.y = -20
      }

      // ligações entre nós
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.18
            ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }

        // ligação ao cursor
        const dcx = a.x - mouse.x
        const dcy = a.y - mouse.y
        const dc = Math.hypot(dcx, dcy)
        if (dc < MOUSE_DIST) {
          const alpha = (1 - dc / MOUSE_DIST) * 0.35
          ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
      }

      // nós
      for (const n of nodes) {
        if (n.cross) {
          drawCross(n.x, n.y, n.size + 1.5, 0.5)
        } else {
          ctx.fillStyle = `rgba(${ACCENT}, 0.5)`
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(step)
    }

    let raf = 0
    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    function onLeave() {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    window.addEventListener('resize', resize)
    // o canvas tem pointer-events:none, então ouvimos no window
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    if (reduce) {
      step()
      cancelAnimationFrame(raf) // desenha um quadro estático
    } else {
      raf = requestAnimationFrame(step)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}
