import { useState, useEffect } from 'react'

export interface WebVitals {
  // Largest Contentful Paint
  lcp: number | null
  lcpElement: string | null

  // First Input Delay (legacy, replaced by INP)
  fid: number | null

  // Interaction to Next Paint
  inp: number | null

  // Cumulative Layout Shift
  cls: number

  // First Contentful Paint
  fcp: number | null

  // Time to First Byte
  ttfb: number | null
}

interface LCPEntry extends PerformanceEntry {
  element?: Element
  renderTime: number
  loadTime: number
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean
  value: number
}

const initialVitals: WebVitals = {
  lcp: null,
  lcpElement: null,
  fid: null,
  inp: null,
  cls: 0,
  fcp: null,
  ttfb: null,
}

export function useWebVitals(): WebVitals {
  const [vitals, setVitals] = useState<WebVitals>(initialVitals)

  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      return
    }

    const observers: PerformanceObserver[] = []

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as LCPEntry[]
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          const lcpTime = lastEntry.renderTime || lastEntry.loadTime
          const element = lastEntry.element
          const lcpElement = element
            ? `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ').join('.') : ''}`
            : null

          setVitals((prev) => ({ ...prev, lcp: lcpTime, lcpElement }))
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      observers.push(lcpObserver)
    } catch {
      // LCP not supported
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as FIDEntry[]
        const firstEntry = entries[0]
        if (firstEntry) {
          const fid = firstEntry.processingStart - firstEntry.startTime
          setVitals((prev) => ({ ...prev, fid }))
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      observers.push(fidObserver)
    } catch {
      // FID not supported
    }

    // CLS Observer
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as LayoutShiftEntry[]
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            setVitals((prev) => ({ ...prev, cls: clsValue }))
          }
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      observers.push(clsObserver)
    } catch {
      // CLS not supported
    }

    // FCP from paint entries
    try {
      const paintObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            setVitals((prev) => ({ ...prev, fcp: entry.startTime }))
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      observers.push(paintObserver)
    } catch {
      // Paint entries not supported
    }

    // TTFB from navigation timing
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        setVitals((prev) => ({ ...prev, ttfb: navEntry.responseStart }))
      }
    } catch {
      // Navigation timing not supported
    }

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  return vitals
}

export function getVitalStatus(
  metric: 'lcp' | 'fid' | 'inp' | 'cls' | 'fcp' | 'ttfb',
  value: number | null
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null) return 'unknown'

  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    inp: { good: 200, poor: 500 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  }

  const threshold = thresholds[metric]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}
