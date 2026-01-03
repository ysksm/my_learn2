import type { ReactNode } from 'react'
import './MetricsDisplay.css'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  status?: 'good' | 'warning' | 'bad' | 'neutral'
  description?: string
}

export function MetricCard({ label, value, unit, status = 'neutral', description }: MetricCardProps) {
  return (
    <div className={`metric-card ${status}`}>
      <div className="metric-card-value">
        <span className="value">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="metric-card-label">{label}</div>
      {description && <div className="metric-card-desc">{description}</div>}
    </div>
  )
}

interface MetricsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function MetricsGrid({ children, columns = 3 }: MetricsGridProps) {
  return (
    <div className={`metrics-display-grid columns-${columns}`}>
      {children}
    </div>
  )
}

interface ComparisonProps {
  before: {
    value: string | number
    unit?: string
    label?: string
  }
  after: {
    value: string | number
    unit?: string
    label?: string
  }
  improvement?: string
}

export function Comparison({ before, after, improvement }: ComparisonProps) {
  return (
    <div className="comparison-display">
      <div className="comparison-item before">
        <div className="comparison-badge">Before</div>
        <div className="comparison-value">
          <span className="value">{before.value}</span>
          {before.unit && <span className="unit">{before.unit}</span>}
        </div>
        {before.label && <div className="comparison-label">{before.label}</div>}
      </div>
      <div className="comparison-arrow">→</div>
      <div className="comparison-item after">
        <div className="comparison-badge">After</div>
        <div className="comparison-value">
          <span className="value">{after.value}</span>
          {after.unit && <span className="unit">{after.unit}</span>}
        </div>
        {after.label && <div className="comparison-label">{after.label}</div>}
      </div>
      {improvement && (
        <div className="comparison-improvement">
          {improvement}
        </div>
      )}
    </div>
  )
}
