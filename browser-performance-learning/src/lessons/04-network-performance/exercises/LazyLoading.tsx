import { useState, useCallback, useRef, useEffect } from 'react'
import { ExerciseWrapper, ExerciseResult } from '../../../components/Exercises/ExerciseWrapper'
import { CodeComparison } from '../../../components/Common/CodeBlock'

interface ImageData {
  id: number
  loaded: boolean
  loadTime?: number
}

export function LazyLoadingDemo() {
  const [mode, setMode] = useState<'eager' | 'lazy' | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [totalLoadTime, setTotalLoadTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const badCode = `<!-- 悪い例: すべての画像を即座に読み込み -->
<img src="image1.jpg" />
<img src="image2.jpg" />
<img src="image3.jpg" />
<!-- 100枚の画像... -->

<!-- JavaScript での即時読み込み -->
images.forEach(url => {
  const img = new Image();
  img.src = url;  // すべて同時にリクエスト
});`

  const goodCode = `<!-- 良い例: ネイティブ遅延読み込み -->
<img src="above-fold.jpg" loading="eager" />
<img src="below-fold.jpg" loading="lazy" />

<!-- Intersection Observer での遅延読み込み -->
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});`

  const simulateEagerLoading = useCallback(() => {
    setMode('eager')
    setImages([])
    setTotalLoadTime(0)

    const start = performance.now()
    const imageCount = 20
    const newImages: ImageData[] = Array.from({ length: imageCount }, (_, i) => ({
      id: i,
      loaded: false
    }))

    setImages(newImages)

    // Simulate loading all images at once
    newImages.forEach((img, index) => {
      const delay = 100 + Math.random() * 300 // Random delay 100-400ms each
      setTimeout(() => {
        setImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, loaded: true, loadTime: performance.now() - start } : i
        ))
      }, delay * (index % 5 + 1)) // Stagger slightly but still "concurrent"
    })

    // Calculate total time
    setTimeout(() => {
      setTotalLoadTime(performance.now() - start)
    }, 2000)
  }, [])

  const simulateLazyLoading = useCallback(() => {
    setMode('lazy')
    setImages([])
    setTotalLoadTime(0)

    const start = performance.now()
    const imageCount = 20
    const newImages: ImageData[] = Array.from({ length: imageCount }, (_, i) => ({
      id: i,
      loaded: false
    }))

    setImages(newImages)

    // Simulate lazy loading - only first 4 visible
    const visibleCount = 4
    newImages.slice(0, visibleCount).forEach((img, index) => {
      setTimeout(() => {
        setImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, loaded: true, loadTime: performance.now() - start } : i
        ))
      }, 100 * (index + 1))
    })

    setTimeout(() => {
      setTotalLoadTime(performance.now() - start)
    }, 500)
  }, [])

  // Simulate scroll-triggered lazy loading
  useEffect(() => {
    if (mode !== 'lazy') return

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerBottom = containerRect.bottom

      setImages(prev => prev.map(img => {
        if (img.loaded) return img

        // Check if image would be visible
        const shouldLoad = img.id < Math.floor((container.scrollTop + containerBottom) / 40)

        if (shouldLoad) {
          return {
            ...img,
            loaded: true,
            loadTime: performance.now()
          }
        }
        return img
      }))
    }

    const container = containerRef.current
    container?.addEventListener('scroll', handleScroll)

    return () => {
      container?.removeEventListener('scroll', handleScroll)
    }
  }, [mode])

  const loadedCount = images.filter(i => i.loaded).length

  return (
    <ExerciseWrapper
      title="Lazy Loading"
      description="ファーストビュー外のリソース（画像、iframe、スクリプト）は遅延読み込みすることで、初期表示を高速化し、不要な通信を削減できます。"
      difficulty="beginner"
      concepts={['loading="lazy"', 'Intersection Observer', 'Dynamic Import', 'Code Splitting']}
    >
      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="btn btn-danger"
          onClick={simulateEagerLoading}
        >
          Eager Loading（20枚同時）
        </button>
        <button
          className="btn btn-primary"
          onClick={simulateLazyLoading}
        >
          Lazy Loading（4枚ずつ）
        </button>
      </div>

      {/* Stats */}
      {mode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <ExerciseResult
            label="読み込み済み"
            value={`${loadedCount}/${images.length}`}
            status={mode === 'lazy' ? 'good' : 'neutral'}
          />
          <ExerciseResult
            label="初期読み込み"
            value={mode === 'lazy' ? '4' : '20'}
            unit="枚"
            status={mode === 'lazy' ? 'good' : 'bad'}
          />
          <ExerciseResult
            label="初期ロード時間"
            value={totalLoadTime > 0 ? totalLoadTime.toFixed(0) : '-'}
            unit="ms"
            status={totalLoadTime < 600 ? 'good' : 'bad'}
          />
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflow: 'auto',
            padding: '8px',
            background: 'var(--color-bg-tertiary)',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                aspectRatio: '1',
                background: img.loaded
                  ? (mode === 'lazy' ? 'var(--color-success)' : 'var(--color-warning)')
                  : 'var(--color-bg)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: img.loaded ? 'white' : 'var(--color-text-muted)',
                transition: 'background 0.3s ease'
              }}
            >
              {img.loaded ? '✓' : img.id + 1}
            </div>
          ))}
        </div>
      )}

      {mode === 'lazy' && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          ↑ スクロールすると追加の画像が読み込まれます
        </p>
      )}

      {/* Code comparison */}
      <CodeComparison before={{ code: badCode }} after={{ code: goodCode }} />

      {/* Additional techniques */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>その他の遅延読み込みテクニック</h4>
        <ul style={{ color: 'var(--color-text-secondary)', paddingLeft: '20px' }}>
          <li><code>import()</code> - JavaScriptモジュールの動的インポート</li>
          <li><code>React.lazy()</code> - Reactコンポーネントの遅延読み込み</li>
          <li><code>&lt;iframe loading="lazy"&gt;</code> - iframeの遅延読み込み</li>
          <li>ルートベースのCode Splitting - ページごとにバンドルを分割</li>
        </ul>
      </div>
    </ExerciseWrapper>
  )
}
