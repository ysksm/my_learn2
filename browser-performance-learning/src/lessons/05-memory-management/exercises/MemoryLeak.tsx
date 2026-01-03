import { useState, useCallback, useRef, useEffect } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function MemoryLeakDemo() {
  const [leakCount, setLeakCount] = useState(0)
  const [cleanCount, setCleanCount] = useState(0)
  const leakyListenersRef = useRef<Array<() => void>>([])
  const cleanListenersRef = useRef<Array<{ handler: () => void; element: HTMLElement }>>([])

  const badCode = `// 悪い例: イベントリスナーのリーク
function Component() {
  useEffect(() => {
    // リスナーを追加するが、クリーンアップしない
    window.addEventListener('resize', handleResize);
    // クリーンアップ関数がない！
  }, []);

  // または、新しい関数を毎回追加
  button.addEventListener('click', () => {
    doSomething(); // 古いリスナーは残ったまま
  });
}`

  const goodCode = `// 良い例: 適切なクリーンアップ
function Component() {
  useEffect(() => {
    const handleResize = () => { ... };
    window.addEventListener('resize', handleResize);

    // クリーンアップ関数で確実に削除
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}

// クラスの場合
class MyComponent {
  connectedCallback() {
    this.handleClick = this.handleClick.bind(this);
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }
}`

  const createLeakyListener = useCallback(() => {
    // Create a closure that holds a large array (simulating memory leak)
    const largeData = new Array(10000).fill('memory leak data')

    const handler = () => {
      console.log('Leaky handler', largeData.length)
    }

    window.addEventListener('mousemove', handler)
    leakyListenersRef.current.push(handler)
    setLeakCount(prev => prev + 1)
  }, [])

  const createCleanListener = useCallback(() => {
    const tempDiv = document.createElement('div')
    document.body.appendChild(tempDiv)

    const handler = () => {
      console.log('Clean handler')
    }

    tempDiv.addEventListener('click', handler)
    cleanListenersRef.current.push({ handler, element: tempDiv })
    setCleanCount(prev => prev + 1)

    // Immediately remove it (demonstrating proper cleanup)
    setTimeout(() => {
      tempDiv.removeEventListener('click', handler)
      document.body.removeChild(tempDiv)

      cleanListenersRef.current = cleanListenersRef.current.filter(
        item => item.element !== tempDiv
      )
    }, 100)
  }, [])

  const cleanupLeaks = useCallback(() => {
    leakyListenersRef.current.forEach(handler => {
      window.removeEventListener('mousemove', handler)
    })
    leakyListenersRef.current = []
    setLeakCount(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leakyListenersRef.current.forEach(handler => {
        window.removeEventListener('mousemove', handler)
      })
      cleanListenersRef.current.forEach(({ handler, element }) => {
        element.removeEventListener('click', handler)
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
    }
  }, [])

  return (
    <ExerciseWrapper
      title="Event Listener Memory Leak"
      description="イベントリスナーを追加したまま解除しないと、リスナーとそのクロージャが保持するデータがメモリに残り続けます。"
      difficulty="intermediate"
      concepts={['addEventListener', 'removeEventListener', 'useEffect cleanup', 'Closures']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-danger"
          onClick={createLeakyListener}
        >
          リークするリスナーを追加
        </button>
        <button
          className="btn btn-primary"
          onClick={createCleanListener}
        >
          適切に解除するリスナー
        </button>
        <button
          className="btn btn-secondary"
          onClick={cleanupLeaks}
          disabled={leakCount === 0}
        >
          リークを解消
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <ExerciseResult
          label="リークしたリスナー"
          value={leakCount}
          status={leakCount > 0 ? 'bad' : 'neutral'}
        />
        <ExerciseResult
          label="適切に解除されたリスナー"
          value={cleanCount}
          status="good"
        />
      </div>

      {leakCount > 0 && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: '0.875rem' }}>
            ⚠️ {leakCount}個のイベントリスナーがメモリをリークしています。
            DevToolsのMemoryタブでHeap Snapshotを撮ると、増加を確認できます。
          </p>
        </div>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* React specific tips */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>Reactでの注意点</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>useEffect</code> のクリーンアップ関数は必ず返す</li>
          <li>依存配列を正しく設定して不要な再登録を防ぐ</li>
          <li><code>useCallback</code> でハンドラーを安定させる</li>
          <li>Refでハンドラーの参照を保持して同じ関数を削除する</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
