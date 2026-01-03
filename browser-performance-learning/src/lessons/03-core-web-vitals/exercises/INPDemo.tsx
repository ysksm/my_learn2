import { useState, useCallback, useRef } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

interface InteractionResult {
  type: 'slow' | 'fast'
  processingTime: number
  visualUpdateTime: number
}

export function INPDemo() {
  const [results, setResults] = useState<InteractionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const badCode = `// 悪い例: 重い同期処理
button.onclick = () => {
  // 200ms以上かかる処理
  heavyCalculation();
  updateUI();
};`

  const goodCode = `// 良い例: 処理を分割
button.onclick = async () => {
  // 即座に視覚フィードバック
  button.disabled = true;
  button.textContent = '処理中...';

  // 重い処理は非同期で
  await scheduler.yield();
  await heavyCalculationAsync();
  updateUI();
};`

  const handleSlowClick = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)

    const interactionStart = performance.now()

    // Simulate heavy synchronous processing
    let sum = 0
    for (let i = 0; i < 50000000; i++) {
      sum += Math.sqrt(i)
    }
    void sum

    const processingEnd = performance.now()

    // Visual update
    requestAnimationFrame(() => {
      const visualUpdateEnd = performance.now()

      setResults(prev => [...prev, {
        type: 'slow',
        processingTime: processingEnd - interactionStart,
        visualUpdateTime: visualUpdateEnd - interactionStart
      }])
      setIsProcessing(false)
    })
  }, [isProcessing])

  const handleFastClick = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)

    const interactionStart = performance.now()

    // Immediate visual feedback
    if (buttonRef.current) {
      buttonRef.current.textContent = '処理中...'
    }

    // Yield to allow visual update
    await new Promise(r => setTimeout(r, 0))

    const processingStart = performance.now()

    // Process in chunks
    let sum = 0
    const chunkSize = 5000000
    for (let i = 0; i < 50000000; i++) {
      sum += Math.sqrt(i)
      if (i % chunkSize === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0))
      }
    }
    void sum

    const processingEnd = performance.now()

    // Visual update
    requestAnimationFrame(() => {
      if (buttonRef.current) {
        buttonRef.current.textContent = '最適化されたクリック'
      }

      setResults(prev => [...prev, {
        type: 'fast',
        processingTime: processingEnd - processingStart,
        visualUpdateTime: processingStart - interactionStart // Time to first visual feedback
      }])
      setIsProcessing(false)
    })
  }, [isProcessing])

  const reset = useCallback(() => {
    setResults([])
  }, [])

  const slowResults = results.filter(r => r.type === 'slow')
  const fastResults = results.filter(r => r.type === 'fast')

  return (
    <ExerciseWrapper
      title="INP (Interaction to Next Paint)"
      description="ユーザーのインタラクション（クリック、タップ、キー入力）から次の画面更新までの時間です。FIDの後継指標で、ページ全体の応答性を測定します。"
      difficulty="intermediate"
      concepts={['Event Processing', 'Input Delay', 'Visual Feedback', 'scheduler.yield()']}
    >
      {/* Interaction buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="btn btn-danger"
          onClick={handleSlowClick}
          disabled={isProcessing}
          style={{ flex: 1 }}
        >
          遅いクリック処理
        </button>
        <button
          ref={buttonRef}
          className="btn btn-primary"
          onClick={handleFastClick}
          disabled={isProcessing}
          style={{ flex: 1 }}
        >
          最適化されたクリック
        </button>
        <button
          className="btn btn-secondary"
          onClick={reset}
          disabled={isProcessing}
        >
          リセット
        </button>
      </div>

      {/* Status indicator */}
      {isProcessing && (
        <div style={{
          padding: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
          color: 'var(--color-warning)'
        }}>
          処理中... UIの応答性を観察してください
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>インタラクション結果</h4>
          {results.slice(-4).map((result, i) => (
            <ExerciseResult
              key={i}
              label={result.type === 'slow' ?
                `遅い処理 (応答まで: ${result.visualUpdateTime.toFixed(0)}ms)` :
                `最適化 (初期応答: ${result.visualUpdateTime.toFixed(0)}ms)`
              }
              value={result.type === 'slow' ? result.visualUpdateTime.toFixed(0) : result.visualUpdateTime.toFixed(0)}
              unit="ms"
              status={result.visualUpdateTime < 200 ? 'good' : result.visualUpdateTime < 500 ? 'neutral' : 'bad'}
            />
          ))}

          {slowResults.length > 0 && fastResults.length > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'var(--color-bg-tertiary)',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                <strong>比較:</strong>{' '}
                遅い処理の平均応答時間: <span style={{ color: 'var(--color-danger)' }}>
                  {(slowResults.reduce((a, b) => a + b.visualUpdateTime, 0) / slowResults.length).toFixed(0)}ms
                </span>{' '}
                vs 最適化: <span style={{ color: 'var(--color-success)' }}>
                  {(fastResults.reduce((a, b) => a + b.visualUpdateTime, 0) / fastResults.length).toFixed(0)}ms
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* INP optimization tips */}
      <div style={{ marginTop: '16px' }}>
        <h4>INPを改善する方法</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px', marginTop: '8px' }}>
          <li><strong>即時フィードバック</strong>: ボタンの状態変更、ローディング表示を最優先</li>
          <li><strong>処理の分割</strong>: Long Taskを避け、50ms以下のチャンクに分割</li>
          <li><strong>scheduler.yield()</strong>: 新しいAPIでUIに制御を戻す</li>
          <li><strong>Web Worker</strong>: 重い計算はメインスレッド外で実行</li>
          <li><strong>イベント委譲</strong>: イベントリスナーの数を削減</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
