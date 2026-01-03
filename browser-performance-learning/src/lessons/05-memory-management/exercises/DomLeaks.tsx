import { useState, useCallback, useRef } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function DomLeaksDemo() {
  const [detachedNodes, setDetachedNodes] = useState<HTMLElement[]>([])
  const [properlyRemoved, setProperlyRemoved] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const badCode = `// 悪い例: Detached DOM への参照を保持
const elements = [];

function createAndRemove() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  elements.push(div);  // 配列に参照を保持

  // DOMからは削除されるが...
  document.body.removeChild(div);

  // elements配列に参照が残っているため
  // divはGCされない（Detached DOM）
}`

  const goodCode = `// 良い例: 参照を適切に管理
const elementMap = new WeakMap();

function createAndRemove() {
  const div = document.createElement('div');
  document.body.appendChild(div);

  // WeakMapは参照を弱く保持
  // DOMから削除されればGC対象になる
  elementMap.set(div, { metadata: 'some data' });

  // DOMから削除
  document.body.removeChild(div);
  // divへの参照がなくなれば自動的にGC
}

// または明示的に参照をクリア
function properCleanup() {
  elements.length = 0; // 配列をクリア
  // または
  elements = null;
}`

  const createDetachedNode = useCallback(() => {
    // Create a DOM node with some content
    const div = document.createElement('div')
    div.innerHTML = `
      <div style="padding: 10px; background: #ef4444; color: white; margin: 4px; border-radius: 4px;">
        Detached Node (10KB data)
        <ul>${Array(100).fill('<li>Item with data</li>').join('')}</ul>
      </div>
    `

    // Add to DOM briefly
    if (containerRef.current) {
      containerRef.current.appendChild(div)
    }

    // Remove from DOM but keep reference
    setTimeout(() => {
      if (div.parentNode) {
        div.parentNode.removeChild(div)
      }
      // Keep reference in state - this creates a memory leak
      setDetachedNodes(prev => [...prev, div])
    }, 500)
  }, [])

  const createProperNode = useCallback(() => {
    const div = document.createElement('div')
    div.innerHTML = `
      <div style="padding: 10px; background: #22c55e; color: white; margin: 4px; border-radius: 4px;">
        Properly Managed Node
      </div>
    `

    if (containerRef.current) {
      containerRef.current.appendChild(div)
    }

    // Remove and don't keep any reference
    setTimeout(() => {
      if (div.parentNode) {
        div.parentNode.removeChild(div)
      }
      setProperlyRemoved(prev => prev + 1)
      // div goes out of scope and can be GC'd
    }, 500)
  }, [])

  const cleanupDetached = useCallback(() => {
    setDetachedNodes([])
  }, [])

  return (
    <ExerciseWrapper
      title="Detached DOM Leaks"
      description="DOMから削除された要素への参照をJavaScriptで保持し続けると、その要素とすべての子要素がメモリに残り続けます。"
      difficulty="advanced"
      concepts={['Detached DOM', 'WeakMap', 'Reference Management', 'Heap Snapshot']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-danger"
          onClick={createDetachedNode}
        >
          Detached DOM を作成
        </button>
        <button
          className="btn btn-primary"
          onClick={createProperNode}
        >
          適切に削除
        </button>
        <button
          className="btn btn-secondary"
          onClick={cleanupDetached}
          disabled={detachedNodes.length === 0}
        >
          参照をクリア
        </button>
      </div>

      {/* Preview container */}
      <div
        ref={containerRef}
        style={{
          minHeight: '60px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '16px'
        }}
      >
        {detachedNodes.length === 0 && properlyRemoved === 0 && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '16px 0' }}>
            ボタンをクリックしてDOM要素を作成
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <ExerciseResult
          label="Detached DOM (メモリリーク)"
          value={detachedNodes.length}
          status={detachedNodes.length > 0 ? 'bad' : 'neutral'}
        />
        <ExerciseResult
          label="適切に削除"
          value={properlyRemoved}
          status="good"
        />
      </div>

      {detachedNodes.length > 0 && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: '0.875rem' }}>
            ⚠️ {detachedNodes.length}個のDetached DOM要素があります。
            DevToolsのMemory → Heap Snapshot → 「Detached」で検索すると確認できます。
          </p>
        </div>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Detection tips */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>DevToolsでの検出方法</h4>
        <ol style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li>Memory → Heap Snapshot を撮影</li>
          <li>フィルターに「Detached」と入力</li>
          <li>「Detached HTMLDivElement」などを探す</li>
          <li>Retainers タブで参照元を確認</li>
        </ol>
      </div>
    </ExerciseWrapper>
  )
}
