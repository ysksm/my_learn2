import { useState, useCallback, useRef } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

interface AnimationFrame {
  timestamp: number
  delta: number
}

export function AsyncOptimizationExercise() {
  const [isRunning, setIsRunning] = useState(false)
  const [method, setMethod] = useState<'setTimeout' | 'rAF' | 'rIC' | null>(null)
  const [frames, setFrames] = useState<AnimationFrame[]>([])
  const [progress, setProgress] = useState(0)
  const animationRef = useRef<number | undefined>(undefined)
  const lastFrameRef = useRef<number>(0)

  const setTimeoutCode = `// setTimeout - 次のイベントループで実行
function processChunk(data, index) {
  // チャンク処理
  processItem(data[index]);

  if (index < data.length - 1) {
    setTimeout(() => {
      processChunk(data, index + 1);
    }, 0);  // 最小遅延は約4ms
  }
}`

  const rAFCode = `// requestAnimationFrame - 次のフレームで実行
function animate(timestamp) {
  // 60fps = 16.67ms間隔で呼ばれる
  updateAnimation();

  if (!isComplete) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);`

  const rICCode = `// requestIdleCallback - ブラウザのアイドル時に実行
function processIdle(deadline) {
  // 残り時間がある間処理を続ける
  while (deadline.timeRemaining() > 0 && hasWork) {
    doWork();
  }

  if (hasWork) {
    requestIdleCallback(processIdle);
  }
}`

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      if (method === 'rIC') {
        cancelIdleCallback(animationRef.current)
      } else {
        cancelAnimationFrame(animationRef.current)
      }
    }
    setIsRunning(false)
    setMethod(null)
  }, [method])

  const runWithSetTimeout = useCallback(() => {
    stopAnimation()
    setIsRunning(true)
    setMethod('setTimeout')
    setFrames([])
    setProgress(0)
    lastFrameRef.current = performance.now()

    const totalIterations = 60
    let currentIteration = 0

    const tick = () => {
      const now = performance.now()
      const delta = now - lastFrameRef.current
      lastFrameRef.current = now

      setFrames(prev => [...prev.slice(-30), { timestamp: now, delta }])
      currentIteration++
      setProgress((currentIteration / totalIterations) * 100)

      // Simulate some work
      let sum = 0
      for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i)
      }
      void sum

      if (currentIteration < totalIterations) {
        animationRef.current = window.setTimeout(tick, 0) as unknown as number
      } else {
        setIsRunning(false)
      }
    }

    tick()
  }, [stopAnimation])

  const runWithRAF = useCallback(() => {
    stopAnimation()
    setIsRunning(true)
    setMethod('rAF')
    setFrames([])
    setProgress(0)
    lastFrameRef.current = performance.now()

    const totalIterations = 60
    let currentIteration = 0

    const tick = (timestamp: number) => {
      const delta = timestamp - lastFrameRef.current
      lastFrameRef.current = timestamp

      setFrames(prev => [...prev.slice(-30), { timestamp, delta }])
      currentIteration++
      setProgress((currentIteration / totalIterations) * 100)

      // Simulate some work
      let sum = 0
      for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i)
      }
      void sum

      if (currentIteration < totalIterations) {
        animationRef.current = requestAnimationFrame(tick)
      } else {
        setIsRunning(false)
      }
    }

    animationRef.current = requestAnimationFrame(tick)
  }, [stopAnimation])

  const runWithRIC = useCallback(() => {
    stopAnimation()
    setIsRunning(true)
    setMethod('rIC')
    setFrames([])
    setProgress(0)
    lastFrameRef.current = performance.now()

    const totalIterations = 60
    let currentIteration = 0

    const tick = (deadline: IdleDeadline) => {
      const now = performance.now()
      const delta = now - lastFrameRef.current
      lastFrameRef.current = now

      // Process while there's time remaining
      while (deadline.timeRemaining() > 0 && currentIteration < totalIterations) {
        setFrames(prev => [...prev.slice(-30), { timestamp: now, delta }])
        currentIteration++
        setProgress((currentIteration / totalIterations) * 100)

        // Simulate some work
        let sum = 0
        for (let i = 0; i < 100000; i++) {
          sum += Math.sqrt(i)
        }
        void sum
      }

      if (currentIteration < totalIterations) {
        animationRef.current = requestIdleCallback(tick)
      } else {
        setIsRunning(false)
      }
    }

    animationRef.current = requestIdleCallback(tick)
  }, [stopAnimation])

  const avgDelta = frames.length > 0
    ? frames.reduce((sum, f) => sum + f.delta, 0) / frames.length
    : 0

  const getMethodDescription = () => {
    switch (method) {
      case 'setTimeout':
        return 'setTimeout(fn, 0) - 最小遅延は約4ms、タイマーキューで実行'
      case 'rAF':
        return 'requestAnimationFrame - ディスプレイのリフレッシュレートに同期'
      case 'rIC':
        return 'requestIdleCallback - ブラウザがアイドル状態の時に実行'
      default:
        return ''
    }
  }

  return (
    <ExerciseWrapper
      title="非同期処理の最適化"
      description="タスクのスケジューリング方法によって、実行タイミングとパフォーマンスが大きく変わります。それぞれの特性を理解しましょう。"
      difficulty="advanced"
      concepts={['setTimeout', 'requestAnimationFrame', 'requestIdleCallback', 'Task Queue']}
    >
      {/* Method selection buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={runWithSetTimeout}
          disabled={isRunning}
          style={{ flex: 1, minWidth: '150px' }}
        >
          setTimeout
        </button>
        <button
          className="btn btn-primary"
          onClick={runWithRAF}
          disabled={isRunning}
          style={{ flex: 1, minWidth: '150px' }}
        >
          requestAnimationFrame
        </button>
        <button
          className="btn btn-secondary"
          onClick={runWithRIC}
          disabled={isRunning}
          style={{ flex: 1, minWidth: '150px' }}
        >
          requestIdleCallback
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          height: '8px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: method === 'rAF' ? 'var(--color-success)' : 'var(--color-primary)',
            transition: 'width 16ms linear'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)'
        }}>
          <span>{method ? getMethodDescription() : '方法を選択してください'}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats */}
      {frames.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <ExerciseResult
            label="平均フレーム間隔"
            value={avgDelta.toFixed(1)}
            unit="ms"
            status={avgDelta < 20 ? 'good' : avgDelta < 50 ? 'neutral' : 'bad'}
          />
          <ExerciseResult
            label="理想的な間隔（60FPS）"
            value="16.67"
            unit="ms"
            status="good"
          />
        </div>
      )}

      {/* Code examples */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>各メソッドの使い方</h4>
        <CodeComparison
          before={{ code: setTimeoutCode, title: 'setTimeout' }}
          after={{ code: rAFCode, title: 'requestAnimationFrame' }}
        />
        <div style={{ marginTop: '16px' }}>
          <CodeComparison
            before={{ code: rICCode, title: 'requestIdleCallback' }}
            after={{ code: `// 用途に応じて使い分け
// アニメーション → rAF
// バックグラウンド処理 → rIC
// 最小遅延が必要 → setTimeout

// scheduler.yield() (新API)
await scheduler.yield();`, title: '使い分けガイド' }}
          />
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>比較表</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-tertiary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>メソッド</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>実行タイミング</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>適したユースケース</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>setTimeout</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>最小4ms後</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>遅延実行、ポーリング</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>rAF</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>次のフレーム（~16ms）</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>アニメーション、視覚更新</td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>rIC</td>
                <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>アイドル時</td>
                <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>分析、プリフェッチ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ExerciseWrapper>
  )
}
