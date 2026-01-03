import { useState, useEffect, useCallback } from 'react'

export interface PerformanceMetrics {
  // DOM metrics
  domNodes: number
  domDepth: number

  // Memory metrics (if available)
  usedJSHeapSize: number | null
  totalJSHeapSize: number | null
  jsHeapSizeLimit: number | null

  // Layout metrics
  layoutCount: number
  layoutDuration: number

  // Paint metrics
  paintCount: number

  // Script metrics
  scriptDuration: number
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

declare global {
  interface Performance {
    memory?: PerformanceMemory
  }
}

const initialMetrics: PerformanceMetrics = {
  domNodes: 0,
  domDepth: 0,
  usedJSHeapSize: null,
  totalJSHeapSize: null,
  jsHeapSizeLimit: null,
  layoutCount: 0,
  layoutDuration: 0,
  paintCount: 0,
  scriptDuration: 0,
}

function countDOMNodes(): number {
  return document.querySelectorAll('*').length
}

function measureDOMDepth(element: Element = document.documentElement, depth = 0): number {
  let maxDepth = depth
  for (const child of element.children) {
    maxDepth = Math.max(maxDepth, measureDOMDepth(child, depth + 1))
  }
  return maxDepth
}

export function usePerformanceMetrics(updateInterval = 1000): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics)

  const updateMetrics = useCallback(() => {
    // DOM metrics
    const domNodes = countDOMNodes()
    const domDepth = measureDOMDepth()

    // Memory metrics (Chrome only)
    const memory = performance.memory
    const usedJSHeapSize = memory?.usedJSHeapSize ?? null
    const totalJSHeapSize = memory?.totalJSHeapSize ?? null
    const jsHeapSizeLimit = memory?.jsHeapSizeLimit ?? null

    // Performance entries
    const entries = performance.getEntriesByType('measure')
    let layoutDuration = 0
    let layoutCount = 0
    let scriptDuration = 0

    for (const entry of entries) {
      if (entry.name.includes('layout')) {
        layoutCount++
        layoutDuration += entry.duration
      }
      if (entry.name.includes('script')) {
        scriptDuration += entry.duration
      }
    }

    // Paint entries
    const paintEntries = performance.getEntriesByType('paint')
    const paintCount = paintEntries.length

    setMetrics({
      domNodes,
      domDepth,
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      layoutCount,
      layoutDuration,
      paintCount,
      scriptDuration,
    })
  }, [])

  useEffect(() => {
    updateMetrics()
    const interval = setInterval(updateMetrics, updateInterval)
    return () => clearInterval(interval)
  }, [updateMetrics, updateInterval])

  return metrics
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'N/A'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let value = bytes
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}
