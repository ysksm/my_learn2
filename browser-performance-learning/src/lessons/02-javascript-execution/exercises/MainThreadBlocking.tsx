import { useState, useCallback, useRef } from 'react'
import { ExerciseWrapper, ExerciseControls, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function MainThreadBlockingExercise() {
  const [results, setResults] = useState<{ time: number; type: 'bad' | 'good' }[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [counter, setCounter] = useState(0)
  const counterRef = useRef(0)

  const badCode = `// 悪い例: 同期的な重い処理
function heavyCalculation() {
  let result = 0;
  for (let i = 0; i < 50000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

// UIがフリーズする
button.onclick = () => heavyCalculation();`

  const goodCode = `// 良い例: 処理を分割してyield
async function heavyCalculationAsync() {
  let result = 0;
  const chunkSize = 1000000;

  for (let i = 0; i < 50000000; i++) {
    result += Math.sqrt(i);

    // 定期的にUIに制御を戻す
    if (i % chunkSize === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }
  return result;
}`

  // Counter animation to show UI responsiveness
  const startCounter = useCallback(() => {
    counterRef.current = 0
    const animate = () => {
      counterRef.current++
      setCounter(counterRef.current)
      if (counterRef.current < 100) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [])

  const runBad = useCallback(() => {
    setIsRunning(true)
    startCounter()

    // Force browser to process the counter update first
    requestAnimationFrame(() => {
      const start = performance.now()

      // Synchronous heavy calculation - blocks main thread
      let result = 0
      for (let i = 0; i < 30000000; i++) {
        result += Math.sqrt(i)
      }

      const end = performance.now()
      setResults(prev => [...prev, { time: end - start, type: 'bad' }])
      setIsRunning(false)

      // Log to prevent optimization
      console.log('Calculation result:', result)
    })
  }, [startCounter])

  const runGood = useCallback(async () => {
    setIsRunning(true)
    startCounter()

    await new Promise(r => setTimeout(r, 0))

    const start = performance.now()

    // Async calculation with yielding
    let result = 0
    const chunkSize = 500000
    const total = 30000000

    for (let i = 0; i < total; i++) {
      result += Math.sqrt(i)

      // Yield to main thread periodically
      if (i % chunkSize === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0))
      }
    }

    const end = performance.now()
    setResults(prev => [...prev, { time: end - start, type: 'good' }])
    setIsRunning(false)

    console.log('Calculation result:', result)
  }, [startCounter])

  const reset = useCallback(() => {
    setResults([])
    setCounter(0)
  }, [])

  return (
    <ExerciseWrapper
      title="Main Thread Blocking"
      description="重い同期処理がメインスレッドをブロックすると、UIの更新やユーザー入力が処理されなくなります。カウンターのアニメーションがスムーズに動くか観察してください。"
      difficulty="beginner"
      concepts={['Main Thread', 'UI Blocking', 'Synchronous Execution']}
    >
      <ExerciseControls
        onRunBad={runBad}
        onRunGood={runGood}
        onReset={reset}
        isRunning={isRunning}
        badLabel="同期処理（ブロック）"
        goodLabel="非同期処理（yield）"
      />

      {/* Counter to show UI responsiveness */}
      <div style={{
        background: 'var(--color-bg-tertiary)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          UI応答性テスト（カウンターが動いていればUIは応答中）
        </div>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          fontFamily: 'SF Mono, monospace',
          color: isRunning ? 'var(--color-primary)' : 'var(--color-text)'
        }}>
          {counter}
        </div>
        <div style={{
          marginTop: '8px',
          height: '4px',
          background: 'var(--color-bg)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${counter}%`,
            background: 'var(--color-primary)',
            transition: 'width 16ms linear'
          }} />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="results-section" style={{ marginBottom: '16px' }}>
          <h4>実行結果</h4>
          {results.slice(-4).map((result, i) => (
            <ExerciseResult
              key={i}
              label={result.type === 'bad' ? '同期処理' : '非同期処理'}
              value={result.time.toFixed(0)}
              unit="ms"
              status={result.type === 'bad' ? 'bad' : 'good'}
            />
          ))}
        </div>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Explanation */}
      <div className="explanation" style={{ marginTop: '16px' }}>
        <h4>なぜUIがフリーズするのか？</h4>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          JavaScriptはシングルスレッドで実行されます。重い計算が実行されている間：
        </p>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li>画面の更新（requestAnimationFrame）が処理されない</li>
          <li>ユーザーのクリックやスクロールが反応しない</li>
          <li>アニメーションが止まる</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>解決策</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>setTimeout(fn, 0)</code> でブラウザに制御を戻す</li>
          <li><code>requestIdleCallback</code> でアイドル時に実行</li>
          <li><code>Web Worker</code> で別スレッドで実行</li>
          <li>Reactの場合は <code>startTransition</code> も有効</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
