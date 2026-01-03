import { useState, useEffect, useCallback, useRef } from 'react'

export interface LongTask {
  id: string
  duration: number
  startTime: number
  name: string
  attribution: string[]
}

interface LongTaskPerformanceEntry extends PerformanceEntry {
  attribution?: Array<{
    name: string
    entryType: string
    startTime: number
    duration: number
    containerType?: string
    containerSrc?: string
    containerId?: string
    containerName?: string
  }>
}

export interface UseLongTaskResult {
  longTasks: LongTask[]
  totalBlockingTime: number
  clearTasks: () => void
}

export function useLongTaskObserver(maxTasks = 100): UseLongTaskResult {
  const [longTasks, setLongTasks] = useState<LongTask[]>([])
  const taskIdRef = useRef(0)

  const clearTasks = useCallback(() => {
    setLongTasks([])
  }, [])

  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver is not supported in this browser')
      return
    }

    let observer: PerformanceObserver | null = null

    try {
      observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as LongTaskPerformanceEntry[]

        for (const entry of entries) {
          const attribution = entry.attribution?.map((attr) => {
            if (attr.containerSrc) return attr.containerSrc
            if (attr.containerName) return attr.containerName
            return attr.name || 'unknown'
          }) || ['self']

          const task: LongTask = {
            id: `task-${taskIdRef.current++}`,
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
            attribution,
          }

          setLongTasks((prev) => [...prev.slice(-maxTasks + 1), task])
        }
      })

      observer.observe({ entryTypes: ['longtask'] })
    } catch {
      console.warn('Long Task observation is not supported')
    }

    return () => {
      observer?.disconnect()
    }
  }, [maxTasks])

  // Calculate total blocking time (time > 50ms threshold)
  const totalBlockingTime = longTasks.reduce((total, task) => {
    // Only count time beyond 50ms threshold
    return total + Math.max(0, task.duration - 50)
  }, 0)

  return { longTasks, totalBlockingTime, clearTasks }
}
