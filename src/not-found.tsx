import { useEffect, useRef } from 'react'
import css from './not-found.module.css'

const COPY = 'ERROR 404 · PAGE NOT FOUND · ERROR 404 · PAGE NOT FOUND · ERROR 404 · PAGE NOT FOUND · '
const TAU = Math.PI * 2
const GRAVITY = 0.00042
const SIDE_RESTITUTION = 0.9
const FLOOR_RESTITUTION = 0.86

type Glyph = {
  char: string
  theta: number
}

type Sample = {
  x: number
  y: number
  at: number
}

type Ring = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  angularVelocity: number
  radius: number
  fontSize: number
  glyphs: Glyph[]
  dragging: boolean
  pointerId: number | null
  grabX: number
  grabY: number
  pointerX: number
  pointerY: number
  samples: Sample[]
  lastCollisionAt: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value))

class CollisionAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null

  unlock() {
    if (!this.context) {
      const Context =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Context) return

      const context = new Context({ latencyHint: 'interactive' })
      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -20
      compressor.knee.value = 16
      compressor.ratio.value = 4
      compressor.attack.value = 0.004
      compressor.release.value = 0.11

      const master = context.createGain()
      master.gain.value = 0.46
      master.connect(compressor)
      compressor.connect(context.destination)

      this.context = context
      this.master = master
    }

    if (this.context.state === 'suspended') void this.context.resume()
  }

  collision(impact: number) {
    if (!this.context || !this.master) return
    const amount = clamp(impact, 0, 1)
    const now = this.context.currentTime
    const duration = 0.045 + amount * 0.04
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(198 + amount * 122, now)
    oscillator.frequency.exponentialRampToValueAtTime(72 + amount * 22, now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.018 + amount * 0.034, now + 0.007)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  close() {
    this.master?.disconnect()
    if (this.context) void this.context.close()
    this.context = null
    this.master = null
  }
}

export function NotFound() {
  const pageRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const page = pageRef.current
    const canvas = canvasRef.current
    const hit = hitRef.current
    if (!page || !canvas || !hit) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    const audio = new CollisionAudio()
    let viewportWidth = window.innerWidth
    let viewportHeight = window.innerHeight
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    let ink = getComputedStyle(page).color
    let frame = 0
    let lastFrame = performance.now()
    let disposed = false

    const baseRadius = () => clamp(Math.min(viewportWidth * 0.31, viewportHeight * 0.285), 112, 248)
    const ring: Ring = {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
      vx: reduceMotion.matches ? 0 : 0.32,
      vy: reduceMotion.matches ? 0 : 0.03,
      angle: 0,
      angularVelocity: reduceMotion.matches ? 0 : 0.00024,
      radius: baseRadius(),
      fontSize: 0,
      glyphs: [],
      dragging: false,
      pointerId: null,
      grabX: 0,
      grabY: 0,
      pointerX: 0,
      pointerY: 0,
      samples: [],
      lastCollisionAt: 0,
    }

    const fontFor = () => `500 ${ring.fontSize}px InterVariable, Inter, sans-serif`

    const bounds = () => {
      const inset = ring.radius + 2
      const minimumX = Math.min(inset, viewportWidth / 2)
      const minimumY = Math.min(inset, viewportHeight / 2)
      return {
        minimumX,
        maximumX: Math.max(minimumX, viewportWidth - inset),
        minimumY,
        maximumY: Math.max(minimumY, viewportHeight - inset),
      }
    }

    const layoutGlyphs = () => {
      ring.fontSize = clamp(ring.radius * 0.112, 14, 26)
      context.font = fontFor()
      const chars = Array.from(COPY)
      const widths = chars.map((char) => context.measureText(char).width)
      const textRadius = ring.radius - ring.fontSize * 0.62
      const circumference = TAU * textRadius
      const widthTotal = widths.reduce((total, width) => total + width, 0)
      const tracking = clamp((circumference - widthTotal) / chars.length, -0.75, 7)
      const advanceTotal = widths.reduce((total, width) => total + width + tracking, 0)
      let cursor = 0

      ring.glyphs = chars.map((char, index) => {
        const width = widths[index]
        const theta = -Math.PI / 2 + ((cursor + width / 2) / advanceTotal) * TAU
        cursor += width + tracking
        return { char, theta }
      })
    }

    const updateHit = () => {
      hit.style.width = `${ring.radius * 2}px`
      hit.style.height = `${ring.radius * 2}px`
      hit.style.transform = `translate3d(${ring.x - ring.radius}px, ${ring.y - ring.radius}px, 0)`
    }

    const draw = () => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, viewportWidth, viewportHeight)
      context.save()
      context.fillStyle = ink
      context.globalAlpha = 0.92
      context.font = fontFor()
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      const textRadius = ring.radius - ring.fontSize * 0.62
      for (const glyph of ring.glyphs) {
        const theta = glyph.theta + ring.angle
        context.save()
        context.translate(
          ring.x + Math.cos(theta) * textRadius,
          ring.y + Math.sin(theta) * textRadius,
        )
        context.rotate(theta + Math.PI / 2)
        context.fillText(glyph.char, 0, 0)
        context.restore()
      }
      context.restore()
    }

    const playCollision = (impact: number, now: number) => {
      if (impact <= 0.035 || now - ring.lastCollisionAt <= 48) return
      ring.lastCollisionAt = now
      audio.collision(clamp(impact / 0.9, 0, 1))
      page.dataset.lastSound = 'collision'
    }

    const collideWithViewport = (now: number) => {
      const limit = bounds()

      if (ring.x < limit.minimumX) {
        ring.x = limit.minimumX
        if (ring.vx < 0) {
          const impact = -ring.vx
          ring.vx = impact * SIDE_RESTITUTION
          playCollision(impact, now)
        }
      } else if (ring.x > limit.maximumX) {
        ring.x = limit.maximumX
        if (ring.vx > 0) {
          const impact = ring.vx
          ring.vx = -impact * SIDE_RESTITUTION
          playCollision(impact, now)
        }
      }

      if (ring.y < limit.minimumY) {
        ring.y = limit.minimumY
        if (ring.vy < 0) {
          const impact = -ring.vy
          ring.vy = impact * SIDE_RESTITUTION
          playCollision(impact, now)
        }
      } else if (ring.y > limit.maximumY) {
        ring.y = limit.maximumY
        if (ring.vy > 0) {
          const impact = ring.vy
          ring.vy = impact > 0.075 ? -impact * FLOOR_RESTITUTION : 0
          ring.vx *= 0.96
          ring.angularVelocity *= 0.94
          playCollision(impact, now)
        }
      }
    }

    const step = (dt: number, now: number) => {
      if (ring.dragging || reduceMotion.matches) return false
      const ratio = dt / 16.67
      ring.vy += GRAVITY * dt
      ring.vx *= Math.pow(0.998, ratio)
      ring.vy *= Math.pow(0.999, ratio)
      ring.x += ring.vx * dt
      ring.y += ring.vy * dt
      ring.angle += ring.angularVelocity * dt
      ring.angularVelocity *= Math.pow(0.997, ratio)
      collideWithViewport(now)

      const limit = bounds()
      if (ring.y >= limit.maximumY - 0.25 && Math.abs(ring.vy) < 0.025) {
        ring.y = limit.maximumY
        ring.vy = 0
        ring.vx *= Math.pow(0.92, ratio)
        ring.angularVelocity *= Math.pow(0.93, ratio)
      }
      if (Math.abs(ring.vx) < 0.0006) ring.vx = 0
      if (Math.abs(ring.vy) < 0.0006) ring.vy = 0
      if (Math.abs(ring.angularVelocity) < 0.000002) ring.angularVelocity = 0

      return ring.vx !== 0 || ring.vy !== 0 || ring.angularVelocity !== 0
    }

    function tick(now: number) {
      frame = 0
      if (disposed) return
      const dt = clamp(now - lastFrame, 1, 32)
      lastFrame = now
      const active = step(dt, now)
      updateHit()
      draw()
      if (active) frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (disposed || frame || document.hidden) return
      lastFrame = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.preventDefault()
      audio.unlock()
      ring.dragging = true
      ring.pointerId = event.pointerId
      ring.grabX = event.clientX - ring.x
      ring.grabY = event.clientY - ring.y
      ring.pointerX = event.clientX
      ring.pointerY = event.clientY
      ring.samples = [{ x: ring.x, y: ring.y, at: performance.now() }]
      ring.vx = 0
      ring.vy = 0
      ring.angularVelocity = 0
      hit.dataset.dragging = ''
      hit.setPointerCapture(event.pointerId)
      wake()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!ring.dragging || ring.pointerId !== event.pointerId) return
      event.preventDefault()
      const now = performance.now()
      const limit = bounds()
      const nextX = clamp(event.clientX - ring.grabX, limit.minimumX, limit.maximumX)
      const nextY = clamp(event.clientY - ring.grabY, limit.minimumY, limit.maximumY)
      const movementX = nextX - ring.x
      const movementY = nextY - ring.y

      ring.angle += ((-ring.grabY * movementX + ring.grabX * movementY) / (ring.radius * ring.radius)) * 0.74
      ring.x = nextX
      ring.y = nextY
      ring.pointerX = event.clientX
      ring.pointerY = event.clientY
      ring.samples.push({ x: ring.x, y: ring.y, at: now })
      ring.samples = ring.samples.filter((sample) => now - sample.at <= 110)
      updateHit()
      draw()
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (!ring.dragging || ring.pointerId !== event.pointerId) return
      const now = performance.now()
      const sample = ring.samples[0]
      const elapsed = sample ? Math.max(16, now - sample.at) : 16

      if (!reduceMotion.matches && sample) {
        ring.vx = clamp((ring.x - sample.x) / elapsed, -1.65, 1.65)
        ring.vy = clamp((ring.y - sample.y) / elapsed, -1.65, 1.65)
        const tangential =
          (-ring.grabY * ring.vx + ring.grabX * ring.vy) / Math.max(1, ring.radius * ring.radius)
        ring.angularVelocity = clamp(tangential * 1.8, -0.007, 0.007)
      }

      ring.dragging = false
      ring.pointerId = null
      ring.samples = []
      hit.removeAttribute('data-dragging')
      try {
        hit.releasePointerCapture(event.pointerId)
      } catch {
        // Pointer capture can already be gone after a system gesture.
      }

      const limit = bounds()
      if (ring.x <= limit.minimumX && ring.vx < 0) {
        const impact = -ring.vx
        ring.vx = impact * SIDE_RESTITUTION
        playCollision(impact, now)
      } else if (ring.x >= limit.maximumX && ring.vx > 0) {
        const impact = ring.vx
        ring.vx = -impact * SIDE_RESTITUTION
        playCollision(impact, now)
      }
      if (ring.y <= limit.minimumY && ring.vy < 0) {
        const impact = -ring.vy
        ring.vy = impact * SIDE_RESTITUTION
        playCollision(impact, now)
      } else if (ring.y >= limit.maximumY && ring.vy > 0) {
        const impact = ring.vy
        ring.vy = -impact * FLOOR_RESTITUTION
        playCollision(impact, now)
      }

      updateHit()
      draw()
      wake()
    }

    const onResize = () => {
      viewportWidth = window.innerWidth
      viewportHeight = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(viewportWidth * pixelRatio)
      canvas.height = Math.round(viewportHeight * pixelRatio)
      ring.radius = baseRadius()
      layoutGlyphs()
      const limit = bounds()
      ring.x = clamp(ring.x, limit.minimumX, limit.maximumX)
      ring.y = clamp(ring.y, limit.minimumY, limit.maximumY)
      updateHit()
      draw()
      wake()
    }

    const onMotionPreference = () => {
      if (reduceMotion.matches) {
        ring.vx = 0
        ring.vy = 0
        ring.angularVelocity = 0
        draw()
      } else {
        ring.vx = 0.32
        ring.vy = 0.03
        ring.angularVelocity = 0.00024
        wake()
      }
    }

    const onColorScheme = () => {
      ink = getComputedStyle(page).color
      draw()
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
      } else {
        wake()
      }
    }

    hit.addEventListener('pointerdown', onPointerDown)
    hit.addEventListener('pointermove', onPointerMove)
    hit.addEventListener('pointerup', onPointerEnd)
    hit.addEventListener('pointercancel', onPointerEnd)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    reduceMotion.addEventListener('change', onMotionPreference)
    colorScheme.addEventListener('change', onColorScheme)

    onResize()
    document.fonts.ready.then(() => {
      if (disposed) return
      layoutGlyphs()
      draw()
      wake()
    })
    wake()

    return () => {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
      hit.removeEventListener('pointerdown', onPointerDown)
      hit.removeEventListener('pointermove', onPointerMove)
      hit.removeEventListener('pointerup', onPointerEnd)
      hit.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      reduceMotion.removeEventListener('change', onMotionPreference)
      colorScheme.removeEventListener('change', onColorScheme)
      audio.close()
      delete page.dataset.lastSound
    }
  }, [])

  return (
    <main className={css.page} ref={pageRef}>
      <canvas className={css.canvas} ref={canvasRef} aria-hidden="true" />
      <div className={css.hit} ref={hitRef} aria-hidden="true" />
      <h1 className={css.srOnly}>Error 404. Page not found.</h1>
    </main>
  )
}
