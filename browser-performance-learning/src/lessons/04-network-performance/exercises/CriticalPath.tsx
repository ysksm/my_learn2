import { ExerciseWrapper } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function CriticalPathDemo() {
  const badCode = `<!-- 悪い例: 長いCritical Path -->
<head>
  <!-- 1. HTMLパース -->
  <!-- 2. CSS読み込み開始 -->
  <link rel="stylesheet" href="bootstrap.css"> <!-- 150KB -->
  <link rel="stylesheet" href="app.css">  <!-- 50KB -->

  <!-- 3. 外部JSも読み込み -->
  <script src="jquery.js"></script> <!-- 90KB -->

  <!-- 4. Webフォント -->
  <link href="fonts.googleapis.com/css?family=..." rel="stylesheet">
</head>
<!-- 5. すべて完了後にやっとレンダリング開始 -->`

  const goodCode = `<head>
  <!-- Critical CSSをインライン（Above the fold のみ）-->
  <style>
    /* 最小限のCSS: ~14KB以下が理想 */
    .header, .hero, .nav { ... }
  </style>

  <!-- 重要なリソースを先読み -->
  <link rel="preload" href="hero.webp" as="image">
  <link rel="preconnect" href="https://fonts.gstatic.com">

  <!-- 非Critical CSSは非同期で -->
  <link rel="stylesheet" href="app.css" media="print"
        onload="this.media='all'">

  <!-- JSはdefer -->
  <script defer src="app.js"></script>
</head>`

  return (
    <ExerciseWrapper
      title="Critical Rendering Path の最適化"
      description="ブラウザが最初のピクセルを描画するまでに必要なリソースを最小化し、できるだけ早く意味のあるコンテンツを表示します。"
      difficulty="advanced"
      concepts={['Critical CSS', 'Above the Fold', 'PRPL Pattern', 'Server Push']}
    >
      {/* Critical Path Visualization */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>Critical Rendering Path の比較</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Unoptimized */}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px' }}>
            <h5 style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>最適化前</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'HTML', width: '20%', color: '#3b82f6' },
                { label: 'CSS (200KB)', width: '40%', color: '#ec4899' },
                { label: 'JS (90KB)', width: '25%', color: '#f59e0b' },
                { label: 'Fonts', width: '30%', color: '#8b5cf6' },
                { label: 'First Paint', width: '100%', color: '#22c55e', isMarker: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.625rem', width: '70px', color: 'var(--color-text-secondary)' }}>
                    {item.label}
                  </span>
                  {item.isMarker ? (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: item.color,
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        right: 0,
                        top: '-8px',
                        fontSize: '0.625rem',
                        color: item.color
                      }}>
                        ~3秒
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      width: item.width,
                      height: '16px',
                      background: item.color,
                      borderRadius: '2px'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optimized */}
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '16px', borderRadius: '8px' }}>
            <h5 style={{ color: 'var(--color-success)', marginBottom: '12px' }}>最適化後</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'HTML+CSS', width: '15%', color: '#3b82f6' },
                { label: 'First Paint', width: '15%', color: '#22c55e', isMarker: true },
                { label: 'JS (defer)', width: '20%', color: '#f59e0b', offset: '15%' },
                { label: 'Rest CSS', width: '20%', color: '#ec4899', offset: '15%' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.625rem', width: '70px', color: 'var(--color-text-secondary)' }}>
                    {item.label}
                  </span>
                  {item.isMarker ? (
                    <div style={{
                      width: item.width,
                      height: '2px',
                      background: item.color,
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        right: '-30px',
                        top: '-8px',
                        fontSize: '0.625rem',
                        color: item.color
                      }}>
                        ~0.5秒
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      marginLeft: item.offset || 0,
                      width: item.width,
                      height: '16px',
                      background: item.color,
                      borderRadius: '2px'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* PRPL Pattern */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>PRPL パターン</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { letter: 'P', title: 'Push', desc: '初期ルートのCriticalリソースをプッシュ' },
            { letter: 'R', title: 'Render', desc: '初期ルートをできるだけ早くレンダー' },
            { letter: 'P', title: 'Pre-cache', desc: '残りのルートをService Workerでキャッシュ' },
            { letter: 'L', title: 'Lazy-load', desc: '残りのルートをオンデマンドで読み込み' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--color-bg-tertiary)',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'var(--color-primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {item.letter}
              </div>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization checklist */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>最適化チェックリスト</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li>Critical CSS（14KB以下）をインライン化しているか</li>
          <li>すべてのスクリプトにasync/deferが付いているか</li>
          <li>LCPリソースにpreloadを使用しているか</li>
          <li>外部ドメインにpreconnectを使用しているか</li>
          <li>不要なサードパーティスクリプトを削除したか</li>
          <li>画像を最適なフォーマット（WebP/AVIF）で配信しているか</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
