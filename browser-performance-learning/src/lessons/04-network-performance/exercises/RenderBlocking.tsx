import { ExerciseWrapper } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function RenderBlockingDemo() {
  const badCode = `<!DOCTYPE html>
<html>
<head>
  <!-- CSSがダウンロードされるまでレンダリングがブロック -->
  <link rel="stylesheet" href="large-styles.css">
  <link rel="stylesheet" href="theme.css">
  <link rel="stylesheet" href="components.css">

  <!-- 同期スクリプトがパースをブロック -->
  <script src="analytics.js"></script>
  <script src="vendor.js"></script>
</head>
<body>
  <!-- 上記がすべて完了するまで何も表示されない -->
  <h1>Hello World</h1>
</body>
</html>`

  const goodCode = `<!DOCTYPE html>
<html>
<head>
  <!-- Critical CSSのみインライン -->
  <style>
    .hero { ... }
    .nav { ... }
  </style>

  <!-- 非Critical CSSは非同期で -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">

  <!-- スクリプトはdefer（DOM構築後に実行） -->
  <script defer src="vendor.js"></script>
  <script defer src="app.js"></script>

  <!-- 分析はasync（読み込み次第実行） -->
  <script async src="analytics.js"></script>
</head>`

  return (
    <ExerciseWrapper
      title="Render-Blocking Resources"
      description="CSSとJavaScriptの読み込み方法によって、ページの初期表示が大きく遅延する可能性があります。async、defer、preloadを使って最適化します。"
      difficulty="intermediate"
      concepts={['async', 'defer', 'preload', 'Critical CSS', 'Render Blocking']}
    >
      {/* Diagram: Script loading comparison */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px' }}>Script読み込みの違い</h4>
        <div style={{ background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
          {/* Normal */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '0.75rem' }}>&lt;script src="..."&gt;</code>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>（通常）</span>
            </div>
            <div style={{ display: 'flex', height: '24px', gap: '2px' }}>
              <div style={{ width: '30%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>HTML Parse</div>
              <div style={{ width: '20%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>Download</div>
              <div style={{ width: '15%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>Execute</div>
              <div style={{ width: '35%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>HTML Parse</div>
            </div>
          </div>

          {/* Async */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '0.75rem' }}>&lt;script async src="..."&gt;</code>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>（非同期ダウンロード）</span>
            </div>
            <div style={{ display: 'flex', height: '24px', gap: '2px', position: 'relative' }}>
              <div style={{ width: '60%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>HTML Parse</div>
              <div style={{ width: '15%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>Exec</div>
              <div style={{ width: '25%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>Parse</div>
              <div style={{ position: 'absolute', top: '-20px', left: '30%', width: '30%', height: '16px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white', borderRadius: '2px' }}>Download (並列)</div>
            </div>
          </div>

          {/* Defer */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '0.75rem' }}>&lt;script defer src="..."&gt;</code>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>（DOM構築後に実行）</span>
            </div>
            <div style={{ display: 'flex', height: '24px', gap: '2px', position: 'relative' }}>
              <div style={{ width: '70%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>HTML Parse (ブロックなし)</div>
              <div style={{ width: '30%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white' }}>Execute (順序保証)</div>
              <div style={{ position: 'absolute', top: '-20px', left: '20%', width: '40%', height: '16px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'white', borderRadius: '2px' }}>Download (並列)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* async vs defer comparison */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>async vs defer の使い分け</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-tertiary)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>属性</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>実行タイミング</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>順序保証</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>適したケース</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>async</code></td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>ダウンロード完了後すぐ</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>なし</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Analytics, 広告</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}><code>defer</code></td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>DOMContentLoaded前</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-success)' }}>あり</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>メインアプリ, ライブラリ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ExerciseWrapper>
  )
}
