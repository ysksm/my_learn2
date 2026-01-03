import { useState, useCallback, useRef } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

export function CLSDemo() {
  const [scenario, setScenario] = useState<'none' | 'bad' | 'good'>('none')
  const [shifts, setShifts] = useState<number[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  const badCode = `<!-- 悪い例: サイズ未指定 -->
<img src="dynamic-ad.jpg" />

<!-- 動的にコンテンツを挿入 -->
<div id="banner"></div>
<script>
  // ページ読み込み後にバナーを挿入
  setTimeout(() => {
    banner.innerHTML = '<div style="height:100px">広告</div>';
  }, 1000);
</script>

<!-- Webフォント読み込みでシフト -->
<link href="custom-font.woff2" rel="stylesheet">`

  const goodCode = `<!-- 良い例: サイズを事前に指定 -->
<img
  src="dynamic-ad.jpg"
  width="300"
  height="250"
  style="aspect-ratio: 300/250"
/>

<!-- スペースを事前に確保 -->
<div id="banner" style="min-height: 100px;">
  <div class="placeholder">読み込み中...</div>
</div>

<!-- フォントの最適化 -->
<link rel="preload" href="font.woff2" as="font">
<style>
  @font-face {
    font-family: 'Custom';
    src: url('font.woff2');
    font-display: swap;
    size-adjust: 100%;
  }
</style>`

  const simulateBadCLS = useCallback(() => {
    setScenario('bad')
    setShifts([])

    const container = contentRef.current
    if (!container) return

    // Clear previous content
    container.innerHTML = `
      <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0;">これは通常のコンテンツです。下のボタンをクリックして記事を読んでください。</p>
      </div>
      <button id="readMore" style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
        続きを読む
      </button>
    `

    // Simulate late-loading content that causes shifts
    const delays = [500, 1500, 2500]
    delays.forEach((delay, index) => {
      setTimeout(() => {
        const ad = document.createElement('div')
        ad.style.cssText = `
          padding: 20px;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 16px;
          font-weight: bold;
        `
        ad.textContent = `広告 ${index + 1} - 突然表示されました！`

        // Insert at the beginning, pushing other content down
        container.insertBefore(ad, container.firstChild)

        // Record the shift
        setShifts(prev => [...prev, delay])
      }, delay)
    })
  }, [])

  const simulateGoodCLS = useCallback(() => {
    setScenario('good')
    setShifts([])

    const container = contentRef.current
    if (!container) return

    // Pre-allocate space for dynamic content
    container.innerHTML = `
      <div id="ad-slot-1" style="min-height: 60px; padding: 20px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
        広告スロット（読み込み中...）
      </div>
      <div id="ad-slot-2" style="min-height: 60px; padding: 20px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
        広告スロット（読み込み中...）
      </div>
      <div id="ad-slot-3" style="min-height: 60px; padding: 20px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
        広告スロット（読み込み中...）
      </div>
      <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0;">これは通常のコンテンツです。下のボタンをクリックして記事を読んでください。</p>
      </div>
      <button id="readMore" style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
        続きを読む
      </button>
    `

    // Replace placeholders without causing layout shift
    const delays = [500, 1500, 2500]
    delays.forEach((delay, index) => {
      setTimeout(() => {
        const slot = container.querySelector(`#ad-slot-${index + 1}`)
        if (slot) {
          slot.innerHTML = `広告 ${index + 1} - スムーズに表示`
          ;(slot as HTMLElement).style.background = 'linear-gradient(135deg, #22c55e, #16a34a)'
          ;(slot as HTMLElement).style.color = 'white'
          ;(slot as HTMLElement).style.fontWeight = 'bold'
        }
      }, delay)
    })
  }, [])

  const reset = useCallback(() => {
    setScenario('none')
    setShifts([])
    if (contentRef.current) {
      contentRef.current.innerHTML = ''
    }
  }, [])

  return (
    <ExerciseWrapper
      title="CLS (Cumulative Layout Shift)"
      description="ページ読み込み中にコンテンツが予期せず移動する量を測定します。広告やフォント、画像の遅延読み込みによって発生し、ユーザー体験を損ないます。"
      difficulty="beginner"
      concepts={['Layout Shift', 'Reserve Space', 'aspect-ratio', 'font-display']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="btn btn-danger"
          onClick={simulateBadCLS}
        >
          悪いCLS（シフトあり）
        </button>
        <button
          className="btn btn-primary"
          onClick={simulateGoodCLS}
        >
          良いCLS（シフトなし）
        </button>
        <button
          className="btn btn-secondary"
          onClick={reset}
        >
          リセット
        </button>
      </div>

      {/* Demo container */}
      <div
        ref={contentRef}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          minHeight: '200px',
          border: '2px dashed var(--color-border)'
        }}
      >
        {scenario === 'none' && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
            ボタンをクリックしてCLSのデモを開始
          </p>
        )}
      </div>

      {/* Shift indicators */}
      {shifts.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <ExerciseResult
            label="レイアウトシフト発生"
            value={shifts.length}
            unit="回"
            status="bad"
          />
          <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)', marginTop: '8px' }}>
            コンテンツが{shifts.length}回移動しました。「続きを読む」ボタンを誤クリックする可能性があります！
          </p>
        </div>
      )}

      {scenario === 'good' && shifts.length === 0 && (
        <ExerciseResult
          label="レイアウトシフト"
          value="0"
          unit="回"
          status="good"
        />
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* CLS causes and solutions */}
      <div style={{ marginTop: '16px' }}>
        <h4>CLSの主な原因と対策</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
            <h5 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>原因</h5>
            <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, fontSize: '0.875rem' }}>
              <li>サイズ未指定の画像</li>
              <li>動的に挿入される広告</li>
              <li>Webフォントのレンダリング</li>
              <li>非同期で読み込むコンテンツ</li>
            </ul>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px' }}>
            <h5 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>対策</h5>
            <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, fontSize: '0.875rem' }}>
              <li>width/height属性を指定</li>
              <li>広告スロットにmin-heightを設定</li>
              <li>font-display: swapを使用</li>
              <li>スケルトンスクリーン</li>
            </ul>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  )
}
