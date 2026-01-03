import { useState, useCallback, useEffect, useRef } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { useLongTaskObserver } from '../../../hooks'

export function LongTasksExercise() {
  const { longTasks, totalBlockingTime, clearTasks } = useLongTaskObserver()
  const [isRunning, setIsRunning] = useState(false)
  const [taskDuration, setTaskDuration] = useState(100)
  const lastTaskCountRef = useRef(0)

  // Track new long tasks
  useEffect(() => {
    if (longTasks.length > lastTaskCountRef.current) {
      lastTaskCountRef.current = longTasks.length
    }
  }, [longTasks])

  const createLongTask = useCallback((duration: number) => {
    const start = performance.now()
    // Busy wait to simulate CPU-intensive task
    while (performance.now() - start < duration) {
      Math.random()
    }
  }, [])

  const runTask = useCallback((duration: number) => {
    setIsRunning(true)
    // Allow the UI to update before blocking
    requestAnimationFrame(() => {
      createLongTask(duration)
      setIsRunning(false)
    })
  }, [createLongTask])

  const reset = useCallback(() => {
    clearTasks()
    lastTaskCountRef.current = 0
  }, [clearTasks])

  const getTaskStatus = (duration: number): 'good' | 'bad' | 'neutral' => {
    if (duration > 100) return 'bad'
    if (duration > 50) return 'neutral'
    return 'good'
  }

  return (
    <ExerciseWrapper
      title="Long Tasks の可視化"
      description="PerformanceObserver APIを使ってLong Task（50ms以上のタスク）をリアルタイムで検出します。どのくらいの処理時間でLong Taskとして検出されるか確認してみましょう。"
      difficulty="intermediate"
      concepts={['Long Task', 'PerformanceObserver', 'Total Blocking Time (TBT)']}
    >
      {/* Task duration selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          タスク実行時間を選択:
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[20, 50, 100, 200, 500].map((duration) => (
            <button
              key={duration}
              className={`btn ${taskDuration === duration ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTaskDuration(duration)}
              disabled={isRunning}
              style={{ minWidth: '80px' }}
            >
              {duration}ms
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={() => runTask(taskDuration)}
          disabled={isRunning}
          style={{ flex: 1 }}
        >
          {isRunning ? '実行中...' : `${taskDuration}ms タスクを実行`}
        </button>
        <button
          className="btn btn-secondary"
          onClick={reset}
          disabled={isRunning}
        >
          リセット
        </button>
      </div>

      {/* TBT and task count */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            Total Blocking Time
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            fontFamily: 'SF Mono, monospace',
            color: totalBlockingTime > 300 ? 'var(--color-danger)' : totalBlockingTime > 100 ? 'var(--color-warning)' : 'var(--color-success)'
          }}>
            {totalBlockingTime.toFixed(0)}ms
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            Long Tasks Detected
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            fontFamily: 'SF Mono, monospace',
            color: longTasks.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'
          }}>
            {longTasks.length}
          </div>
        </div>
      </div>

      {/* Long tasks list */}
      {longTasks.length > 0 && (
        <div className="results-section">
          <h4 style={{ marginBottom: '12px' }}>検出されたLong Tasks</h4>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {longTasks.slice(-10).reverse().map((task) => (
              <ExerciseResult
                key={task.id}
                label={`Long Task (blocking: ${Math.max(0, task.duration - 50).toFixed(0)}ms)`}
                value={task.duration.toFixed(1)}
                unit="ms"
                status={getTaskStatus(task.duration)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="explanation" style={{ marginTop: '16px' }}>
        <h4>Total Blocking Time (TBT) とは</h4>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          TBTは、Long Taskの<strong>50msを超えた分の合計時間</strong>です。
          例えば、70msのタスクがあれば、TBTには20ms加算されます。
        </p>

        <div style={{
          background: 'var(--color-bg-tertiary)',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'SF Mono, monospace',
          fontSize: '0.875rem'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Task: </span>
            <span>70ms → TBT contribution: </span>
            <span style={{ color: 'var(--color-warning)' }}>20ms</span>
            <span style={{ color: 'var(--color-text-muted)' }}> (70 - 50)</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Task: </span>
            <span>200ms → TBT contribution: </span>
            <span style={{ color: 'var(--color-danger)' }}>150ms</span>
            <span style={{ color: 'var(--color-text-muted)' }}> (200 - 50)</span>
          </div>
        </div>

        <h4 style={{ marginTop: '16px' }}>TBTの目安</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><span style={{ color: 'var(--color-success)' }}>Good:</span> 200ms以下</li>
          <li><span style={{ color: 'var(--color-warning)' }}>Needs Improvement:</span> 200-600ms</li>
          <li><span style={{ color: 'var(--color-danger)' }}>Poor:</span> 600ms以上</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
