import { useCallback, useEffect, useState } from 'react'

export interface WidthLimits {
  min: number
  max: number
  initial: number
  /** Width the rest of the layout needs (e.g. left panel + a usable map). */
  reserve: number
}

/** Insights pane: never narrower than its content allows, never squeezing the map below a usable width. */
export const INSIGHTS_WIDTH: WidthLimits = { min: 300, max: 560, initial: 380, reserve: 280 + 420 }

/** Clamp to [min, max], and lower max further on small windows so the map keeps `reserve` px. */
export function clampWidth(width: number, { min, max, reserve }: WidthLimits, viewport: number) {
  const ceiling = Math.max(min, Math.min(max, viewport - reserve))
  return Math.round(Math.min(Math.max(width, min), ceiling))
}

const read = (key: string): number | null => {
  try {
    const v = Number(localStorage.getItem(key))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}
const write = (key: string, v: number) => {
  try {
    localStorage.setItem(key, String(v))
  } catch {
    /* storage unavailable (private mode): width just isn't remembered */
  }
}

/** A user-resizable panel width, clamped to limits and remembered in this browser. */
export function usePanelWidth(key: string, limits: WidthLimits) {
  const viewport = () => (typeof window === 'undefined' ? 1440 : window.innerWidth)
  const [width, setWidthRaw] = useState(() => clampWidth(read(key) ?? limits.initial, limits, viewport()))

  const setWidth = useCallback(
    (w: number) => {
      const next = clampWidth(w, limits, viewport())
      setWidthRaw(next)
      write(key, next)
    },
    [key, limits],
  )

  // Re-clamp when the window shrinks so the map never disappears.
  useEffect(() => {
    const onResize = () => setWidthRaw((w) => clampWidth(w, limits, viewport()))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [limits])

  const ceiling = clampWidth(Infinity, limits, viewport())
  return { width, setWidth, reset: () => setWidth(limits.initial), min: limits.min, max: ceiling }
}
