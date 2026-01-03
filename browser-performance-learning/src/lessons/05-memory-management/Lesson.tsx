import { usePerformanceMetrics, formatBytes } from '../../hooks'
import { DevToolsGuide } from '../../components/Common/DevToolsGuide'
import { MetricCard, MetricsGrid } from '../../components/Common/MetricsDisplay'
import { MemoryLeakDemo } from './exercises/MemoryLeak'
import { DomLeaksDemo } from './exercises/DomLeaks'
import { GCPressureDemo } from './exercises/GCPressure'
import '../01-rendering-pipeline/Lesson.css'

export function MemoryManagementLesson() {
  const metrics = usePerformanceMetrics()

  return (
    <div className="lesson">
      <header className="lesson-header">
        <h1>Lesson 5: Memory Management</h1>
        <p>JavaScriptのメモリ管理とガベージコレクションの仕組みを理解し、メモリリークを検出・修正する方法を学びます。</p>
      </header>

      {/* Current memory stats */}
      <section className="concept-section">
        <h2>現在のメモリ使用状況</h2>
        <MetricsGrid columns={3}>
          <MetricCard
            label="使用中のヒープ"
            value={formatBytes(metrics.usedJSHeapSize)}
            description="現在使用中のJSメモリ"
          />
          <MetricCard
            label="割り当て済みヒープ"
            value={formatBytes(metrics.totalJSHeapSize)}
            description="OSから割り当てられたメモリ"
          />
          <MetricCard
            label="ヒープサイズ上限"
            value={formatBytes(metrics.jsHeapSizeLimit)}
            description="使用可能な最大メモリ"
          />
        </MetricsGrid>

        {metrics.usedJSHeapSize === null && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--color-warning)' }}>
            ⚠️ メモリ情報はChrome DevToolsでのみ利用可能です（Chromeで--enable-precise-memory-infoフラグが必要な場合があります）
          </div>
        )}

        {/* Memory lifecycle */}
        <div style={{ marginTop: '24px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px' }}>JavaScriptのメモリライフサイクル</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: '📦', label: 'Allocate', desc: 'オブジェクト生成時にメモリ割り当て' },
              { icon: '🔧', label: 'Use', desc: '変数への参照を通じて使用' },
              { icon: '🗑️', label: 'Release', desc: '参照がなくなると解放対象に' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '16px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '8px',
                minWidth: '150px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Common memory leak patterns */}
        <div style={{ marginTop: '24px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px' }}>よくあるメモリリークのパターン</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { icon: '🎧', title: 'イベントリスナー', desc: '削除されないイベントリスナー' },
              { icon: '⏰', title: 'タイマー', desc: 'クリアされないsetInterval' },
              { icon: '🌐', title: 'グローバル変数', desc: 'windowオブジェクトへの参照' },
              { icon: '🔗', title: 'クロージャ', desc: '不要な外部スコープの参照' },
              { icon: '📄', title: 'Detached DOM', desc: '切り離されたDOM要素への参照' },
              { icon: '🔄', title: '循環参照', desc: 'オブジェクト間の相互参照' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '12px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span>{item.icon}</span>
                  <span style={{ fontWeight: '500' }}>{item.title}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section className="exercises-section">
        <h2>演習</h2>
        <MemoryLeakDemo />
        <DomLeaksDemo />
        <GCPressureDemo />
      </section>

      {/* DevTools Guide */}
      <section className="devtools-section">
        <h2>DevToolsでの確認方法</h2>
        <DevToolsGuide
          title="Memory パネルでメモリリークを検出"
          steps={[
            { instruction: 'Memory タブを開く', detail: 'F12 → Memory' },
            { instruction: 'Heap Snapshot を選択', detail: '現在のメモリ状態を撮影' },
            { instruction: 'Take snapshot をクリック', detail: '最初のスナップショット' },
            { instruction: '問題の操作を実行', detail: 'リークが疑われる操作を繰り返す' },
            { instruction: '2回目のスナップショットを撮影', detail: '比較用' },
            { instruction: 'Comparison ビューで差分を確認', detail: '増加したオブジェクトを特定' },
          ]}
          tips={[
            'スナップショット前にGC（ゴミ箱アイコン）を実行すると正確な結果に',
            'Detached DOM tree でDOM関連のリークを検出',
            'Allocation instrumentationで継続的なメモリ変化を監視',
          ]}
        />
      </section>

      {/* Key takeaways */}
      <section className="takeaways-section">
        <h2>Key Takeaways</h2>
        <ul className="takeaways-list">
          <li>
            <strong>イベントリスナーは必ず解除</strong>：addEventListenerしたらremoveEventListenerも忘れずに
          </li>
          <li>
            <strong>タイマーをクリア</strong>：setIntervalはclearIntervalで確実に停止
          </li>
          <li>
            <strong>WeakMapを活用</strong>：DOM要素への参照はWeakMapで管理
          </li>
          <li>
            <strong>定期的にプロファイリング</strong>：メモリ使用量の増加傾向を監視
          </li>
        </ul>
      </section>
    </div>
  )
}
