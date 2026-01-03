import { useState, useRef, useCallback } from 'react'
import { ExerciseWrapper, ExerciseControls, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

interface Result {
  time: number
  type: 'bad' | 'good'
}

export function LayoutThrashingExercise() {
  const [results, setResults] = useState<Result[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const badCode = `// Layout Thrashing - 読み書きを交互に実行
for (let i = 0; i < boxes.length; i++) {
  // 読み取り: レイアウト計算が発生
  const width = boxes[i].offsetWidth;

  // 書き込み: スタイル変更 → 次の読み取り時に再計算
  boxes[i].style.width = (width + 10) + 'px';
}`

  const goodCode = `// 最適化: 読み取りと書き込みをバッチ処理
// Step 1: すべて読み取り
const widths = boxes.map(box => box.offsetWidth);

// Step 2: すべて書き込み（1回のレイアウト計算）
boxes.forEach((box, i) => {
  box.style.width = (widths[i] + 10) + 'px';
});`

  const createBoxes = useCallback((count: number) => {
    if (!containerRef.current) return []
    containerRef.current.innerHTML = ''
    const boxes: HTMLDivElement[] = []

    for (let i = 0; i < count; i++) {
      const box = document.createElement('div')
      box.className = 'demo-box'
      box.style.width = '50px'
      box.style.height = '20px'
      box.style.backgroundColor = '#6366f1'
      box.style.margin = '2px'
      box.style.display = 'inline-block'
      containerRef.current.appendChild(box)
      boxes.push(box)
    }

    return boxes
  }, [])

  const runBad = useCallback(() => {
    setIsRunning(true)
    const boxes = createBoxes(200)

    // Force layout
    void containerRef.current?.offsetHeight

    const start = performance.now()

    // Layout Thrashing: 読み取りと書き込みを交互に実行
    for (let i = 0; i < boxes.length; i++) {
      const width = boxes[i].offsetWidth // 読み取り
      boxes[i].style.width = (width + 1) + 'px' // 書き込み
    }

    const end = performance.now()

    setResults(prev => [...prev, { time: end - start, type: 'bad' }])
    setIsRunning(false)
  }, [createBoxes])

  const runGood = useCallback(() => {
    setIsRunning(true)
    const boxes = createBoxes(200)

    // Force layout
    void containerRef.current?.offsetHeight

    const start = performance.now()

    // 最適化: 読み取りと書き込みをバッチ処理
    const widths = boxes.map(box => box.offsetWidth) // すべて読み取り
    boxes.forEach((box, i) => {
      box.style.width = (widths[i] + 1) + 'px' // すべて書き込み
    })

    const end = performance.now()

    setResults(prev => [...prev, { time: end - start, type: 'good' }])
    setIsRunning(false)
  }, [createBoxes])

  const reset = useCallback(() => {
    setResults([])
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
  }, [])

  const badAvg = results.filter(r => r.type === 'bad').reduce((a, b) => a + b.time, 0) /
    (results.filter(r => r.type === 'bad').length || 1)
  const goodAvg = results.filter(r => r.type === 'good').reduce((a, b) => a + b.time, 0) /
    (results.filter(r => r.type === 'good').length || 1)

  return (
    <ExerciseWrapper
      title="Layout Thrashing"
      description="DOM要素のサイズ読み取りとスタイル変更を交互に行うと、ブラウザは毎回レイアウトを再計算する必要があり、パフォーマンスが大幅に低下します。"
      difficulty="intermediate"
      concepts={['Forced Synchronous Layout', 'Batch Processing', 'offsetWidth/offsetHeight']}
    >
      <ExerciseControls
        onRunBad={runBad}
        onRunGood={runGood}
        onReset={reset}
        isRunning={isRunning}
        badLabel="Layout Thrashing"
        goodLabel="Batched Updates"
      />

      {/* Results */}
      {results.length > 0 && (
        <div className="results-section">
          <h4>実行結果</h4>
          {results.slice(-6).map((result, i) => (
            <ExerciseResult
              key={i}
              label={result.type === 'bad' ? 'Layout Thrashing' : 'Batched Updates'}
              value={result.time.toFixed(2)}
              unit="ms"
              status={result.type === 'bad' ? 'bad' : 'good'}
            />
          ))}

          {results.filter(r => r.type === 'bad').length > 0 &&
            results.filter(r => r.type === 'good').length > 0 && (
              <div className="comparison-summary">
                <p>
                  平均改善率:{' '}
                  <strong style={{ color: 'var(--color-success)' }}>
                    {((1 - goodAvg / badAvg) * 100).toFixed(0)}% 高速化
                  </strong>
                </p>
              </div>
            )}
        </div>
      )}

      {/* Demo container */}
      <div
        ref={containerRef}
        className="demo-container"
        style={{
          minHeight: '60px',
          padding: '8px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      />

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Explanation */}
      <div className="explanation" style={{ marginTop: '16px' }}>
        <h4>なぜ遅くなるのか？</h4>
        <ol style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>offsetWidth</code> を読み取ると、ブラウザは最新のレイアウト情報が必要</li>
          <li>直前に <code>style.width</code> を変更していると、レイアウト再計算が発生</li>
          <li>ループ内でこれを繰り返すと、毎回レイアウト計算が走る = Layout Thrashing</li>
        </ol>
      </div>
    </ExerciseWrapper>
  )
}
