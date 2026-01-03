import { useWebVitals, getVitalStatus } from '../../hooks'
import { DevToolsGuide } from '../../components/Common/DevToolsGuide'
import { MetricCard, MetricsGrid } from '../../components/Common/MetricsDisplay'
import { LCPDemo } from './exercises/LCPDemo'
import { INPDemo } from './exercises/INPDemo'
import { CLSDemo } from './exercises/CLSDemo'
import '../01-rendering-pipeline/Lesson.css'

export function CoreWebVitalsLesson() {
  const vitals = useWebVitals()

  return (
    <div className="lesson">
      <header className="lesson-header">
        <h1>Lesson 3: Core Web Vitals</h1>
        <p>GoogleがWebページのユーザー体験を測定するために定義した指標です。SEOランキングにも影響するため、これらの指標を理解し最適化することは重要です。</p>
      </header>

      {/* Current vitals */}
      <section className="concept-section">
        <h2>このページのCore Web Vitals</h2>
        <MetricsGrid columns={3}>
          <MetricCard
            label="LCP (Largest Contentful Paint)"
            value={vitals.lcp ? (vitals.lcp / 1000).toFixed(2) : '-'}
            unit="s"
            status={getVitalStatus('lcp', vitals.lcp) === 'good' ? 'good' : getVitalStatus('lcp', vitals.lcp) === 'poor' ? 'bad' : 'warning'}
            description="最大コンテンツの表示時間"
          />
          <MetricCard
            label="INP (Interaction to Next Paint)"
            value={vitals.inp ?? vitals.fid ?? '-'}
            unit="ms"
            status={getVitalStatus('inp', vitals.inp ?? vitals.fid) === 'good' ? 'good' : getVitalStatus('inp', vitals.inp ?? vitals.fid) === 'poor' ? 'bad' : 'warning'}
            description="インタラクションの応答性"
          />
          <MetricCard
            label="CLS (Cumulative Layout Shift)"
            value={vitals.cls.toFixed(3)}
            status={getVitalStatus('cls', vitals.cls) === 'good' ? 'good' : getVitalStatus('cls', vitals.cls) === 'poor' ? 'bad' : 'warning'}
            description="視覚的な安定性"
          />
        </MetricsGrid>

        {/* Thresholds */}
        <div style={{ marginTop: '24px', background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px' }}>評価基準</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-tertiary)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>指標</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--color-success)' }}>Good</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--color-warning)' }}>Needs Improvement</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--color-danger)' }}>Poor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>LCP</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 2.5s</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 4.0s</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>&gt; 4.0s</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>INP</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 200ms</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 500ms</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>&gt; 500ms</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>CLS</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 0.1</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>≤ 0.25</td>
                <td style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>&gt; 0.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Exercises */}
      <section className="exercises-section">
        <h2>演習</h2>
        <LCPDemo />
        <INPDemo />
        <CLSDemo />
      </section>

      {/* DevTools Guide */}
      <section className="devtools-section">
        <h2>DevToolsでの確認方法</h2>
        <DevToolsGuide
          title="Lighthouse でCore Web Vitalsを計測"
          steps={[
            { instruction: 'DevToolsを開く (F12)', detail: 'Performance Insights または Lighthouse タブを選択' },
            { instruction: 'Lighthouse タブで「Analyze page load」', detail: 'Mobile または Desktop を選択' },
            { instruction: 'レポートを確認', detail: 'Metrics セクションにLCP, CLS, TBTが表示される' },
            { instruction: 'Performance タブでも確認可能', detail: 'Timings セクションにLCP, FCP等が表示' },
          ]}
          tips={[
            'シークレットモードで拡張機能の影響を排除して計測',
            'Network throttling で3G環境をシミュレート',
            'web.dev/measure で本番環境の計測も可能',
          ]}
        />
      </section>

      {/* Key takeaways */}
      <section className="takeaways-section">
        <h2>Key Takeaways</h2>
        <ul className="takeaways-list">
          <li>
            <strong>LCPの改善</strong>：画像の最適化、プリロード、サーバー応答時間の短縮
          </li>
          <li>
            <strong>INPの改善</strong>：イベントハンドラの最適化、Long Taskの分割
          </li>
          <li>
            <strong>CLSの改善</strong>：サイズ指定、フォントの最適化、動的コンテンツの制御
          </li>
        </ul>
      </section>
    </div>
  )
}
