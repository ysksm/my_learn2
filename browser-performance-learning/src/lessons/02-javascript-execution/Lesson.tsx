import { DevToolsGuide } from '../../components/Common/DevToolsGuide'
import { MainThreadBlockingExercise } from './exercises/MainThreadBlocking'
import { LongTasksExercise } from './exercises/LongTasks'
import { AsyncOptimizationExercise } from './exercises/AsyncOptimization'
import '../01-rendering-pipeline/Lesson.css'

export function JavaScriptExecutionLesson() {
  return (
    <div className="lesson">
      <header className="lesson-header">
        <h1>Lesson 2: JavaScript Execution</h1>
        <p>JavaScriptはシングルスレッドで実行されるため、重い処理がメインスレッドをブロックすると、UIの応答性が著しく低下します。この問題を理解し、解決する方法を学びます。</p>
      </header>

      {/* Concept overview */}
      <section className="concept-section">
        <h2>メインスレッドとは</h2>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ marginBottom: '16px' }}>ブラウザのメインスレッドは以下のすべてを担当しています：</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {[
              { icon: '📜', label: 'JavaScript実行' },
              { icon: '🎨', label: 'スタイル計算' },
              { icon: '📐', label: 'レイアウト' },
              { icon: '🖌️', label: 'ペイント' },
              { icon: '👆', label: 'ユーザー入力処理' },
              { icon: '🔄', label: 'イベント処理' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--color-bg-tertiary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{item.icon}</div>
                <div style={{ fontSize: '0.875rem' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="frame-budget-explanation">
          <h3>Long Task とは</h3>
          <p style={{ marginBottom: '16px' }}>
            <strong>50ms以上</strong>かかるタスクは「Long Task」として定義されます。
            Long Taskが実行されている間、ユーザーの入力は処理されず、UIがフリーズしたように見えます。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>&lt;50ms</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Good - 応答性維持</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>50-100ms</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Warning - 若干の遅延</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>&gt;100ms</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bad - 明確な遅延を体感</div>
            </div>
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section className="exercises-section">
        <h2>演習</h2>

        <MainThreadBlockingExercise />
        <LongTasksExercise />
        <AsyncOptimizationExercise />
      </section>

      {/* DevTools Guide */}
      <section className="devtools-section">
        <h2>DevToolsでの確認方法</h2>
        <DevToolsGuide
          title="Long Tasks の検出"
          steps={[
            {
              instruction: 'Performance タブを開く',
              detail: 'F12 → Performance',
            },
            {
              instruction: '録画を開始して問題の操作を実行',
              detail: '⏺ボタンをクリックし、演習を実行',
            },
            {
              instruction: 'Main スレッドを確認',
              detail: 'タイムラインで黄色いバーを探す',
            },
            {
              instruction: 'Long Task を探す',
              detail: '50ms以上のタスクには赤い三角マークが付く',
            },
            {
              instruction: 'Bottom-Up / Call Tree を確認',
              detail: 'タスクをクリックして詳細を分析',
            },
          ]}
          tips={[
            'CPU throttling で低スペック環境をシミュレートできます',
            'Performance Insights パネルでより詳しい分析が可能',
            'Profiler で関数ごとの実行時間を確認できます',
          ]}
        />
      </section>

      {/* Key takeaways */}
      <section className="takeaways-section">
        <h2>Key Takeaways</h2>
        <ul className="takeaways-list">
          <li>
            <strong>50ms以下を目指す</strong>：各タスクは50ms以下に収め、Long Taskを避ける
          </li>
          <li>
            <strong>タスク分割</strong>：setTimeout, requestIdleCallback, yieldを活用
          </li>
          <li>
            <strong>Web Worker活用</strong>：重い計算はWorkerにオフロード
          </li>
          <li>
            <strong>requestAnimationFrame</strong>：アニメーションはrAFで実行
          </li>
        </ul>
      </section>
    </div>
  )
}
