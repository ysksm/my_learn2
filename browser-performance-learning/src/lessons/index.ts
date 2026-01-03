export interface LessonInfo {
  id: string
  title: string
  icon: string
  description: string
}

export const lessons: LessonInfo[] = [
  {
    id: 'rendering-pipeline',
    title: 'Rendering Pipeline',
    icon: '🎨',
    description: 'DOM/CSSOM/Layout/Paint',
  },
  {
    id: 'javascript-execution',
    title: 'JavaScript Execution',
    icon: '⚡',
    description: 'Main Thread / Long Tasks',
  },
  {
    id: 'core-web-vitals',
    title: 'Core Web Vitals',
    icon: '📊',
    description: 'LCP / INP / CLS',
  },
  {
    id: 'network-performance',
    title: 'Network Performance',
    icon: '🌐',
    description: 'Critical Path / Caching',
  },
  {
    id: 'memory-management',
    title: 'Memory Management',
    icon: '💾',
    description: 'Heap / GC / Leaks',
  },
]

export { RenderingPipelineLesson } from './01-rendering-pipeline/Lesson'
export { JavaScriptExecutionLesson } from './02-javascript-execution/Lesson'
export { CoreWebVitalsLesson } from './03-core-web-vitals/Lesson'
export { NetworkPerformanceLesson } from './04-network-performance/Lesson'
export { MemoryManagementLesson } from './05-memory-management/Lesson'
