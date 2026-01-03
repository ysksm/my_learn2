import { DevToolsGuide } from '../../components/Common/DevToolsGuide'
import { RenderBlockingDemo } from './exercises/RenderBlocking'
import { LazyLoadingDemo } from './exercises/LazyLoading'
import { CriticalPathDemo } from './exercises/CriticalPath'
import '../01-rendering-pipeline/Lesson.css'

export function NetworkPerformanceLesson() {
  return (
    <div className="lesson">
      <header className="lesson-header">
        <h1>Lesson 4: Network Performance</h1>
        <p>リソースの読み込み順序と優先度を最適化することで、ページの表示速度を大幅に改善できます。Critical Rendering Pathを理解し、効率的なリソース配信を学びます。</p>
      </header>

      {/* Concept overview */}
      <section className="concept-section">
        <h2>Critical Rendering Path</h2>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ marginBottom: '16px' }}>ブラウザがHTMLを受信してから最初の描画までの過程です：</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {[
              { label: 'HTML', color: '#3b82f6' },
              { label: '→' },
              { label: 'DOM構築', color: '#8b5cf6' },
              { label: '+' },
              { label: 'CSS', color: '#ec4899' },
              { label: '→' },
              { label: 'CSSOM', color: '#ec4899' },
              { label: '→' },
              { label: 'Render Tree', color: '#22c55e' },
              { label: '→' },
              { label: 'Paint', color: '#f59e0b' },
            ].map((item, i) => (
              item.color ? (
                <span key={i} style={{
                  background: item.color,
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {item.label}
                </span>
              ) : (
                <span key={i} style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
              )
            ))}
          </div>

          <h4 style={{ marginBottom: '12px' }}>レンダーブロッキングリソース</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
              <h5 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>ブロッキング</h5>
              <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, fontSize: '0.875rem' }}>
                <li>通常の <code>&lt;script&gt;</code> タグ</li>
                <li><code>&lt;link rel="stylesheet"&gt;</code></li>
                <li>大きなCSSファイル</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px' }}>
              <h5 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>非ブロッキング</h5>
              <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, fontSize: '0.875rem' }}>
                <li><code>async</code> / <code>defer</code> 付きスクリプト</li>
                <li><code>media</code> 属性付きCSS</li>
                <li>動的に追加されたスクリプト</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resource Hints */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px' }}>Resource Hints</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-tertiary)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Hint</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>用途</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>preload</code></td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>現在のページで必要なリソースを先読み</td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>&lt;link rel="preload" href="font.woff2" as="font"&gt;</code></td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>prefetch</code></td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>次のページで必要になりそうなリソース</td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>&lt;link rel="prefetch" href="next-page.js"&gt;</code></td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>preconnect</code></td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>外部ドメインへの接続を事前に確立</td>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>&lt;link rel="preconnect" href="https://cdn.example.com"&gt;</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Exercises */}
      <section className="exercises-section">
        <h2>演習</h2>
        <RenderBlockingDemo />
        <LazyLoadingDemo />
        <CriticalPathDemo />
      </section>

      {/* DevTools Guide */}
      <section className="devtools-section">
        <h2>DevToolsでの確認方法</h2>
        <DevToolsGuide
          title="Network パネルでリソース読み込みを分析"
          steps={[
            { instruction: 'Network タブを開く', detail: 'F12 → Network' },
            { instruction: 'ページを更新（Cmd+Shift+R）', detail: 'キャッシュを無効にして読み込み' },
            { instruction: 'Waterfall を確認', detail: 'リソースの読み込み順序と依存関係を可視化' },
            { instruction: 'Initiator 列を確認', detail: 'どこからリソースが要求されたか' },
            { instruction: 'Priority 列を確認', detail: 'ブラウザが割り当てた優先度' },
          ]}
          tips={[
            'Throttling で低速ネットワークをシミュレート',
            'Coverage タブで未使用のCSS/JSを検出',
            'Lighthouse の「Eliminate render-blocking resources」を確認',
          ]}
        />
      </section>

      {/* Key takeaways */}
      <section className="takeaways-section">
        <h2>Key Takeaways</h2>
        <ul className="takeaways-list">
          <li>
            <strong>Critical CSSをインライン化</strong>：ファーストビューに必要なCSSのみをインラインで配置
          </li>
          <li>
            <strong>async/defer を活用</strong>：スクリプトの読み込みと実行を最適化
          </li>
          <li>
            <strong>Resource Hints</strong>：preload, prefetch, preconnectで先読み
          </li>
          <li>
            <strong>遅延読み込み</strong>：ファーストビュー外のリソースは遅延読み込み
          </li>
        </ul>
      </section>
    </div>
  )
}
