import { useState, useCallback } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function LCPDemo() {
  const [scenario, setScenario] = useState<'optimized' | 'unoptimized' | null>(null)
  const [loadTime, setLoadTime] = useState<number | null>(null)

  const badCode = `<!-- 悪い例: 画像の遅延読み込み -->
<img src="hero.jpg" loading="lazy" />

<!-- CSSで背景画像として設定 -->
<div style="background-image: url(hero.jpg)"></div>

<!-- JavaScriptで動的に追加 -->
<script>
  fetch('/api/hero')
    .then(res => res.json())
    .then(data => {
      img.src = data.imageUrl;
    });
</script>`

  const goodCode = `<!-- 良い例: LCPリソースを優先 -->
<link rel="preload" as="image" href="hero.jpg" />

<img
  src="hero.jpg"
  fetchpriority="high"
  loading="eager"
  width="800"
  height="400"
/>

<!-- 重要なCSSをインライン化 -->
<style>
  .hero { ... }
</style>`

  const simulateLoad = useCallback((isOptimized: boolean) => {
    setScenario(isOptimized ? 'optimized' : 'unoptimized')
    setLoadTime(null)

    const start = performance.now()
    const delay = isOptimized ? 300 : 1500

    setTimeout(() => {
      setLoadTime(performance.now() - start)
    }, delay)
  }, [])

  return (
    <ExerciseWrapper
      title="LCP (Largest Contentful Paint)"
      description="ページの最大コンテンツ（通常はヒーロー画像やヘッドライン）が表示されるまでの時間です。ユーザーが「ページが読み込まれた」と感じる重要な指標です。"
      difficulty="intermediate"
      concepts={['Preload', 'fetchpriority', 'Critical Resources', 'Image Optimization']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="btn btn-danger"
          onClick={() => simulateLoad(false)}
        >
          遅いLCPをシミュレート
        </button>
        <button
          className="btn btn-primary"
          onClick={() => simulateLoad(true)}
        >
          最適化されたLCP
        </button>
      </div>

      {/* Simulation area */}
      <div style={{
        background: 'var(--color-bg-tertiary)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {scenario === null && (
          <p style={{ color: 'var(--color-text-muted)' }}>
            ボタンをクリックしてLCPのシミュレーションを開始
          </p>
        )}

        {scenario !== null && loadTime === null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {scenario === 'unoptimized' ? 'リソースを読み込み中...' : 'プリロードされたリソースを表示中...'}
            </p>
          </div>
        )}

        {scenario !== null && loadTime !== null && (
          <div style={{
            width: '100%',
            height: '150px',
            background: scenario === 'optimized'
              ? 'linear-gradient(135deg, var(--color-success), #16a34a)'
              : 'linear-gradient(135deg, var(--color-danger), #dc2626)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Hero Image (LCP Element)
          </div>
        )}
      </div>

      {/* Result */}
      {loadTime !== null && (
        <ExerciseResult
          label="LCP時間"
          value={loadTime.toFixed(0)}
          unit="ms"
          status={loadTime < 500 ? 'good' : loadTime < 1500 ? 'neutral' : 'bad'}
        />
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* LCP optimization tips */}
      <div style={{ marginTop: '16px' }}>
        <h4>LCPを改善する方法</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px', marginTop: '8px' }}>
          <li><strong>プリロード</strong>: <code>&lt;link rel="preload"&gt;</code> でLCPリソースを早期取得</li>
          <li><strong>優先度指定</strong>: <code>fetchpriority="high"</code> で優先度を上げる</li>
          <li><strong>画像最適化</strong>: WebP/AVIF形式、適切なサイズ、CDN活用</li>
          <li><strong>サーバー応答時間</strong>: TTFB（Time to First Byte）の短縮</li>
          <li><strong>レンダーブロッキング除去</strong>: Critical CSSのインライン化</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ExerciseWrapper>
  )
}
