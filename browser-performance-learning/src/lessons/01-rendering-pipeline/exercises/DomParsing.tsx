import { useState, useRef, useCallback } from 'react'
import { ExerciseWrapper, ExerciseControls, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

interface Result {
  time: number
  type: 'bad' | 'good'
  nodeCount: number
}

export function DomParsingExercise() {
  const [results, setResults] = useState<Result[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const badCode = `// 悪い例: 個別にDOMノードを追加
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = 'Item ' + i;
  container.appendChild(div);  // 毎回DOMを更新
}`

  const goodCode = `// 良い例: DocumentFragmentを使用
const fragment = document.createDocumentFragment();

for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = 'Item ' + i;
  fragment.appendChild(div);  // メモリ上で構築
}

container.appendChild(fragment);  // 1回だけDOMを更新`

  const clearContainer = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
  }, [])

  const runBad = useCallback(() => {
    setIsRunning(true)
    clearContainer()

    const container = containerRef.current
    if (!container) return

    const nodeCount = 500

    const start = performance.now()

    // Bad: 個別にDOMノードを追加
    for (let i = 0; i < nodeCount; i++) {
      const div = document.createElement('div')
      div.textContent = `Item ${i}`
      div.style.padding = '2px 8px'
      div.style.fontSize = '12px'
      div.style.borderBottom = '1px solid var(--color-border)'
      container.appendChild(div) // 毎回DOMを更新
    }

    const end = performance.now()

    setResults(prev => [...prev, { time: end - start, type: 'bad', nodeCount }])
    setIsRunning(false)
  }, [clearContainer])

  const runGood = useCallback(() => {
    setIsRunning(true)
    clearContainer()

    const container = containerRef.current
    if (!container) return

    const nodeCount = 500

    const start = performance.now()

    // Good: DocumentFragmentを使用
    const fragment = document.createDocumentFragment()

    for (let i = 0; i < nodeCount; i++) {
      const div = document.createElement('div')
      div.textContent = `Item ${i}`
      div.style.padding = '2px 8px'
      div.style.fontSize = '12px'
      div.style.borderBottom = '1px solid var(--color-border)'
      fragment.appendChild(div) // メモリ上で構築
    }

    container.appendChild(fragment) // 1回だけDOMを更新

    const end = performance.now()

    setResults(prev => [...prev, { time: end - start, type: 'good', nodeCount }])
    setIsRunning(false)
  }, [clearContainer])

  const reset = useCallback(() => {
    setResults([])
    clearContainer()
  }, [clearContainer])

  const badResults = results.filter(r => r.type === 'bad')
  const goodResults = results.filter(r => r.type === 'good')
  const badAvg = badResults.reduce((a, b) => a + b.time, 0) / (badResults.length || 1)
  const goodAvg = goodResults.reduce((a, b) => a + b.time, 0) / (goodResults.length || 1)

  return (
    <ExerciseWrapper
      title="DOM Parsing & Construction"
      description="大量のDOM要素を追加する際の方法によって、パフォーマンスに大きな差が出ます。DocumentFragmentやinnerHTMLを活用することで最適化できます。"
      difficulty="beginner"
      concepts={['DocumentFragment', 'DOM操作', 'Batch DOM Updates']}
    >
      <ExerciseControls
        onRunBad={runBad}
        onRunGood={runGood}
        onReset={reset}
        isRunning={isRunning}
        badLabel="個別追加（500要素）"
        goodLabel="Fragment使用（500要素）"
      />

      {/* Results */}
      {results.length > 0 && (
        <div className="results-section">
          <h4>実行結果</h4>
          {results.slice(-6).map((result, i) => (
            <ExerciseResult
              key={i}
              label={`${result.type === 'bad' ? '個別追加' : 'Fragment'} (${result.nodeCount}nodes)`}
              value={result.time.toFixed(2)}
              unit="ms"
              status={result.type === 'bad' ? 'bad' : 'good'}
            />
          ))}

          {badResults.length > 0 && goodResults.length > 0 && (
            <div className="comparison-summary" style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
              <p style={{ margin: 0 }}>
                平均改善率:{' '}
                <strong style={{ color: 'var(--color-success)' }}>
                  {((1 - goodAvg / badAvg) * 100).toFixed(0)}% 高速化
                </strong>
                {' '}（{badAvg.toFixed(2)}ms → {goodAvg.toFixed(2)}ms）
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
          maxHeight: '150px',
          overflow: 'auto',
          background: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      />

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Explanation */}
      <div className="explanation" style={{ marginTop: '16px' }}>
        <h4>DocumentFragmentとは？</h4>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          DocumentFragmentは軽量な「仮想DOM」のようなもので、メモリ上でDOM操作を行い、
          最後に一度だけ実際のDOMに追加することで、レンダリングの回数を削減できます。
        </p>
        <h4 style={{ marginTop: '12px' }}>他の最適化方法</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>innerHTML</code> を使って一括で挿入（ただしXSSに注意）</li>
          <li><code>insertAdjacentHTML()</code> を使用</li>
          <li>仮想スクロール（Virtual Scrolling）で表示要素を制限</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
