import { useState, useRef, useCallback, useEffect } from 'react'
import { ExerciseWrapper, ExerciseControls, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function PaintOptimizationExercise() {
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'bad' | 'good' | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | undefined>(undefined)
  const frameCountRef = useRef(0)

  const badCode = `// 悪い例: left/top でアニメーション
function animate() {
  box.style.left = x + 'px';  // Layout発生
  box.style.top = y + 'px';   // Layout発生
  requestAnimationFrame(animate);
}`

  const goodCode = `// 良い例: transform でアニメーション
function animate() {
  // translateはLayout/Paintをスキップ
  box.style.transform = \`translate(\${x}px, \${y}px)\`;
  requestAnimationFrame(animate);
}`

  const stopAnimation = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = undefined
    }
    setIsRunning(false)
    setMode(null)
    setFrameCount(frameCountRef.current)
    frameCountRef.current = 0

    // Reset box position
    if (boxRef.current) {
      boxRef.current.style.left = '0'
      boxRef.current.style.top = '0'
      boxRef.current.style.transform = ''
    }
  }, [])

  const runBad = useCallback(() => {
    stopAnimation()
    setIsRunning(true)
    setMode('bad')
    frameCountRef.current = 0

    const box = boxRef.current
    if (!box) return

    const startTime = performance.now()
    const duration = 3000 // 3 seconds
    const containerWidth = box.parentElement?.clientWidth || 300
    const boxWidth = 60

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = (elapsed % duration) / duration
      const x = Math.sin(progress * Math.PI * 2) * (containerWidth / 2 - boxWidth / 2) + (containerWidth / 2 - boxWidth / 2)
      const y = Math.cos(progress * Math.PI * 2) * 30 + 30

      // Bad: left/top を使用（Layout発生）
      box.style.left = x + 'px'
      box.style.top = y + 'px'

      frameCountRef.current++

      if (elapsed < duration) {
        rafIdRef.current = requestAnimationFrame(animate)
      } else {
        stopAnimation()
      }
    }

    rafIdRef.current = requestAnimationFrame(animate)
  }, [stopAnimation])

  const runGood = useCallback(() => {
    stopAnimation()
    setIsRunning(true)
    setMode('good')
    frameCountRef.current = 0

    const box = boxRef.current
    if (!box) return

    const startTime = performance.now()
    const duration = 3000 // 3 seconds
    const containerWidth = box.parentElement?.clientWidth || 300
    const boxWidth = 60

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = (elapsed % duration) / duration
      const x = Math.sin(progress * Math.PI * 2) * (containerWidth / 2 - boxWidth / 2)
      const y = Math.cos(progress * Math.PI * 2) * 30

      // Good: transform を使用（Layout/Paintをスキップ）
      box.style.transform = `translate(${x}px, ${y}px)`

      frameCountRef.current++

      if (elapsed < duration) {
        rafIdRef.current = requestAnimationFrame(animate)
      } else {
        stopAnimation()
      }
    }

    // will-change を設定してレイヤー化
    box.style.willChange = 'transform'
    rafIdRef.current = requestAnimationFrame(animate)
  }, [stopAnimation])

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return (
    <ExerciseWrapper
      title="Paint Optimization"
      description="アニメーションで使用するCSSプロパティによって、レンダリングパイプラインのどのフェーズが実行されるかが変わります。transformやopacityはCompositeのみで処理できます。"
      difficulty="intermediate"
      concepts={['transform', 'will-change', 'Compositor Thread', 'GPU Acceleration']}
    >
      <ExerciseControls
        onRunBad={runBad}
        onRunGood={runGood}
        onReset={stopAnimation}
        isRunning={isRunning}
        badLabel="left/top（3秒間）"
        goodLabel="transform（3秒間）"
      />

      {/* Status */}
      {mode && (
        <ExerciseResult
          label={mode === 'bad' ? 'left/top Animation' : 'transform Animation'}
          value={isRunning ? 'Running...' : `${frameCount} frames`}
          status={mode === 'bad' ? 'bad' : 'good'}
        />
      )}

      {/* Animation container */}
      <div
        style={{
          position: 'relative',
          height: '100px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          ref={boxRef}
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            background: mode === 'bad' ? 'var(--color-danger)' : mode === 'good' ? 'var(--color-success)' : 'var(--color-primary)',
            borderRadius: '8px',
            left: 'calc(50% - 30px)',
            top: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {mode === 'bad' ? 'L/T' : mode === 'good' ? 'TX' : 'BOX'}
        </div>
      </div>

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Pipeline comparison */}
      <div className="pipeline-comparison" style={{ marginTop: '16px' }}>
        <h4>レンダリングパイプラインの違い</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '8px' }}>
              left/top
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              JS → Style → <strong>Layout</strong> → <strong>Paint</strong> → Composite
            </div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--color-success)', fontWeight: 'bold', marginBottom: '8px' }}>
              transform
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              JS → Style → <span style={{ textDecoration: 'line-through' }}>Layout</span> → <span style={{ textDecoration: 'line-through' }}>Paint</span> → <strong>Composite</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="explanation" style={{ marginTop: '16px' }}>
        <h4>Compositorのみで処理できるプロパティ</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>transform</code> - 移動、回転、拡大縮小</li>
          <li><code>opacity</code> - 透明度</li>
        </ul>
        <h4 style={{ marginTop: '12px' }}>will-change の使い方</h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          <code>will-change: transform</code> を指定すると、ブラウザは要素を独自のレイヤーに昇格させ、
          GPUで処理するため高速になります。ただし、過度な使用はメモリ消費の原因になります。
        </p>
      </div>
    </ExerciseWrapper>
  )
}
