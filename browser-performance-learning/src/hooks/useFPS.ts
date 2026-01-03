import { useState, useEffect, useRef, useCallback } from 'react'

interface FPSData {
  fps: number
  frameTime: number
  history: number[]
}

interface UseFPSOptions {
  historyLength?: number
  updateInterval?: number
}

export function useFPS(options: UseFPSOptions = {}): FPSData {
  const { historyLength = 60, updateInterval = 500 } = options

  const [data, setData] = useState<FPSData>({
    fps: 60,
    frameTime: 16.67,
    history: [],
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafIdRef = useRef<number | undefined>(undefined)
  const historyRef = useRef<number[]>([])

  const measureFrame = useCallback((timestamp: number) => {
    frameCountRef.current++

    const elapsed = timestamp - lastTimeRef.current

    if (elapsed >= updateInterval) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed)
      const frameTime = elapsed / frameCountRef.current

      historyRef.current = [...historyRef.current, fps].slice(-historyLength)

      setData({
        fps,
        frameTime,
        history: historyRef.current,
      })

      frameCountRef.current = 0
      lastTimeRef.current = timestamp
    }

    rafIdRef.current = requestAnimationFrame(measureFrame)
  }, [updateInterval, historyLength])

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(measureFrame)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [measureFrame])

  return data
}

export function getFPSStatus(fps: number): 'good' | 'ok' | 'bad' {
  if (fps >= 55) return 'good'
  if (fps >= 30) return 'ok'
  return 'bad'
}
