import { useFPS, getFPSStatus, usePerformanceMetrics, formatBytes, useLongTaskObserver } from '../../hooks'
import './Sidebar.css'

interface Lesson {
  id: string
  title: string
  icon: string
  description: string
}

interface SidebarProps {
  lessons: Lesson[]
  activeLesson: string
  onSelectLesson: (id: string) => void
}

export function Sidebar({ lessons, activeLesson, onSelectLesson }: SidebarProps) {
  const { fps, frameTime } = useFPS()
  const metrics = usePerformanceMetrics()
  const { totalBlockingTime, longTasks } = useLongTaskObserver()
  const fpsStatus = getFPSStatus(fps)

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Browser Performance</h1>
        <p>Learning Lab</p>
      </header>

      {/* Real-time FPS & Frame Budget */}
      <section className="sidebar-section fps-section">
        <h2 className="sidebar-section-title">Frame Budget</h2>
        <div className="fps-display">
          <div className={`fps-main ${fpsStatus}`}>
            <span className="fps-value">{fps}</span>
            <span className="fps-label">FPS</span>
          </div>
          <div className="frame-budget">
            <div className="budget-bar">
              <div
                className={`budget-fill ${fpsStatus}`}
                style={{ width: `${Math.min(100, (frameTime / 16.67) * 100)}%` }}
              />
              <span className="budget-target">16.67ms</span>
            </div>
            <span className="budget-current">{frameTime.toFixed(2)}ms/frame</span>
          </div>
        </div>

        {/* Frame budget breakdown concept */}
        <div className="budget-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">JS</span>
            <div className="breakdown-bar js" style={{ width: '30%' }} />
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Style</span>
            <div className="breakdown-bar style" style={{ width: '10%' }} />
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Layout</span>
            <div className="breakdown-bar layout" style={{ width: '20%' }} />
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Paint</span>
            <div className="breakdown-bar paint" style={{ width: '15%' }} />
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Composite</span>
            <div className="breakdown-bar composite" style={{ width: '5%' }} />
          </div>
        </div>
      </section>

      {/* Quick Metrics */}
      <section className="sidebar-section metrics-section">
        <h2 className="sidebar-section-title">Quick Metrics</h2>
        <div className="quick-metrics">
          <div className="quick-metric">
            <span className="metric-value">{metrics.domNodes.toLocaleString()}</span>
            <span className="metric-label">DOM Nodes</span>
          </div>
          <div className="quick-metric">
            <span className="metric-value">{metrics.domDepth}</span>
            <span className="metric-label">DOM Depth</span>
          </div>
          <div className="quick-metric">
            <span className="metric-value">{formatBytes(metrics.usedJSHeapSize)}</span>
            <span className="metric-label">Heap Used</span>
          </div>
          <div className="quick-metric">
            <span className="metric-value">{totalBlockingTime.toFixed(0)}ms</span>
            <span className="metric-label">TBT</span>
          </div>
          <div className="quick-metric">
            <span className="metric-value">{longTasks.length}</span>
            <span className="metric-label">Long Tasks</span>
          </div>
        </div>
      </section>

      {/* Lessons navigation */}
      <section className="sidebar-section lessons-section">
        <h2 className="sidebar-section-title">Lessons</h2>
        <nav className="lessons-nav">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`lesson-item ${activeLesson === lesson.id ? 'active' : ''}`}
              onClick={() => onSelectLesson(lesson.id)}
            >
              <span className="lesson-icon">{lesson.icon}</span>
              <div className="lesson-info">
                <span className="lesson-title">{lesson.title}</span>
                <span className="lesson-desc">{lesson.description}</span>
              </div>
            </button>
          ))}
        </nav>
      </section>

      <footer className="sidebar-footer">
        <div className="devtools-hint">
          <kbd>F12</kbd> to open DevTools
        </div>
      </footer>
    </aside>
  )
}
