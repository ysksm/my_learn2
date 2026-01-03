import { useState } from 'react'
import type { ReactNode } from 'react'
import './ExerciseWrapper.css'

interface ExerciseWrapperProps {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  concepts: string[]
  children: ReactNode
}

export function ExerciseWrapper({
  title,
  description,
  difficulty,
  concepts,
  children,
}: ExerciseWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const difficultyColors = {
    beginner: 'var(--color-success)',
    intermediate: 'var(--color-warning)',
    advanced: 'var(--color-danger)',
  }

  const difficultyLabels = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級',
  }

  return (
    <article className="exercise-wrapper">
      <header className="exercise-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="exercise-title-row">
          <h3 className="exercise-title">{title}</h3>
          <span
            className="exercise-difficulty"
            style={{ backgroundColor: difficultyColors[difficulty] }}
          >
            {difficultyLabels[difficulty]}
          </span>
        </div>
        <p className="exercise-description">{description}</p>
        <div className="exercise-concepts">
          {concepts.map((concept) => (
            <span key={concept} className="concept-tag">
              {concept}
            </span>
          ))}
        </div>
        <button className="expand-toggle" aria-label={isExpanded ? '折りたたむ' : '展開する'}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </header>

      {isExpanded && (
        <div className="exercise-content">
          {children}
        </div>
      )}
    </article>
  )
}

interface ExerciseControlsProps {
  onRunBad: () => void
  onRunGood: () => void
  onReset: () => void
  isRunning?: boolean
  badLabel?: string
  goodLabel?: string
}

export function ExerciseControls({
  onRunBad,
  onRunGood,
  onReset,
  isRunning = false,
  badLabel = '問題のあるコードを実行',
  goodLabel = '最適化されたコードを実行',
}: ExerciseControlsProps) {
  return (
    <div className="exercise-controls">
      <button
        className="btn btn-danger"
        onClick={onRunBad}
        disabled={isRunning}
      >
        {badLabel}
      </button>
      <button
        className="btn btn-primary"
        onClick={onRunGood}
        disabled={isRunning}
      >
        {goodLabel}
      </button>
      <button
        className="btn btn-secondary"
        onClick={onReset}
        disabled={isRunning}
      >
        リセット
      </button>
    </div>
  )
}

interface ExerciseResultProps {
  label: string
  value: string | number
  unit?: string
  status?: 'good' | 'bad' | 'neutral'
}

export function ExerciseResult({ label, value, unit, status = 'neutral' }: ExerciseResultProps) {
  return (
    <div className={`exercise-result ${status}`}>
      <span className="result-label">{label}</span>
      <span className="result-value">
        {value}
        {unit && <span className="result-unit">{unit}</span>}
      </span>
    </div>
  )
}
