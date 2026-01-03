import { useState, useCallback, useRef, useEffect } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function GCPressureDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'bad' | 'good' | null>(null)
  const [allocations, setAllocations] = useState(0)
  const [fps, setFps] = useState(60)
  const rafRef = useRef<number | undefined>(undefined)
  const objectPoolRef = useRef<object[]>([])

  const badCode = `// 悪い例: 毎フレーム新しいオブジェクトを生成
function update() {
  // 毎フレーム新しい配列とオブジェクトを作成
  const particles = [];
  for (let i = 0; i < 1000; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      velocity: { x: 0, y: 0 }  // ネストしたオブジェクトも
    });
  }
  render(particles);
  requestAnimationFrame(update);
}`

  const goodCode = `// 良い例: オブジェクトプールで再利用
const particlePool = [];
const POOL_SIZE = 1000;

// 初期化時にプールを作成
for (let i = 0; i < POOL_SIZE; i++) {
  particlePool.push({
    x: 0, y: 0,
    velocity: { x: 0, y: 0 },
    active: false
  });
}

function update() {
  // プールからオブジェクトを取得して再利用
  for (let i = 0; i < particlePool.length; i++) {
    const p = particlePool[i];
    p.x = Math.random() * 100;
    p.y = Math.random() * 100;
  }
  render(particlePool);
  requestAnimationFrame(update);
}`

  const runBadPattern = useCallback(() => {
    setMode('bad')
    setIsRunning(true)
    setAllocations(0)

    let frameCount = 0
    let lastTime = performance.now()
    let allocCount = 0

    const update = () => {
      const now = performance.now()
      frameCount++

      // Bad pattern: create new objects every frame
      const particles = []
      for (let i = 0; i < 500; i++) {
        particles.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          velocity: { x: Math.random(), y: Math.random() },
          color: `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`,
          data: new Array(10).fill(Math.random())
        })
      }
      allocCount += particles.length

      // Calculate FPS
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)))
        setAllocations(allocCount)
        frameCount = 0
        lastTime = now
        allocCount = 0
      }

      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    // Auto stop after 5 seconds
    setTimeout(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      setIsRunning(false)
    }, 5000)
  }, [])

  const runGoodPattern = useCallback(() => {
    setMode('good')
    setIsRunning(true)
    setAllocations(0)

    // Initialize pool once
    if (objectPoolRef.current.length === 0) {
      for (let i = 0; i < 500; i++) {
        objectPoolRef.current.push({
          x: 0, y: 0,
          velocity: { x: 0, y: 0 },
          color: '',
          data: new Array(10).fill(0)
        })
      }
    }

    let frameCount = 0
    let lastTime = performance.now()

    const update = () => {
      const now = performance.now()
      frameCount++

      // Good pattern: reuse objects from pool
      for (let i = 0; i < objectPoolRef.current.length; i++) {
        const p = objectPoolRef.current[i] as { x: number; y: number; velocity: { x: number; y: number }; color: string; data: number[] }
        p.x = Math.random() * 100
        p.y = Math.random() * 100
        p.velocity.x = Math.random()
        p.velocity.y = Math.random()
        p.color = `rgb(${Math.random() * 255 | 0},${Math.random() * 255 | 0},${Math.random() * 255 | 0})`
        for (let j = 0; j < p.data.length; j++) {
          p.data[j] = Math.random()
        }
      }

      // Calculate FPS
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)))
        setAllocations(0) // No new allocations
        frameCount = 0
        lastTime = now
      }

      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    // Auto stop after 5 seconds
    setTimeout(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      setIsRunning(false)
    }, 5000)
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setIsRunning(false)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <ExerciseWrapper
      title="GC Pressure"
      description="毎フレーム大量のオブジェクトを生成すると、ガベージコレクションが頻繁に発生し、フレームレートが低下します。オブジェクトプールで再利用することで改善できます。"
      difficulty="advanced"
      concepts={['Object Pool', 'Garbage Collection', 'Memory Allocation', 'Frame Rate']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-danger"
          onClick={runBadPattern}
          disabled={isRunning}
        >
          毎フレーム新規生成（5秒）
        </button>
        <button
          className="btn btn-primary"
          onClick={runGoodPattern}
          disabled={isRunning}
        >
          オブジェクトプール（5秒）
        </button>
        <button
          className="btn btn-secondary"
          onClick={stop}
          disabled={!isRunning}
        >
          停止
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <ExerciseResult
          label="FPS"
          value={fps}
          status={fps >= 55 ? 'good' : fps >= 30 ? 'neutral' : 'bad'}
        />
        <ExerciseResult
          label="新規オブジェクト/秒"
          value={allocations.toLocaleString()}
          status={allocations === 0 ? 'good' : allocations < 10000 ? 'neutral' : 'bad'}
        />
        <ExerciseResult
          label="モード"
          value={mode === 'bad' ? 'GC高負荷' : mode === 'good' ? 'プール使用' : '-'}
          status={mode === 'good' ? 'good' : mode === 'bad' ? 'bad' : 'neutral'}
        />
      </div>

      {isRunning && (
        <div style={{
          padding: '12px',
          background: mode === 'bad' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          border: `1px solid ${mode === 'bad' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0, color: mode === 'bad' ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '0.875rem' }}>
            {mode === 'bad'
              ? '⚠️ 毎フレーム500オブジェクトを生成中... GCによるジャンクが発生する可能性があります'
              : '✓ オブジェクトプールを再利用中... GCの発生を抑制しています'}
          </p>
        </div>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Additional techniques */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>GCプレッシャーを減らすテクニック</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><strong>オブジェクトプール</strong>: 頻繁に生成・破棄するオブジェクトを再利用</li>
          <li><strong>TypedArray</strong>: 数値データにはFloat32Arrayなどを使用</li>
          <li><strong>文字列の連結を避ける</strong>: 配列のjoinを使用</li>
          <li><strong>クロージャの生成を減らす</strong>: ループ内で関数を作成しない</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
