import type { AllMetrics } from '../types';

interface Props {
  metrics: AllMetrics | null;
  onReloadPage: (ignoreCache: boolean) => void;
}

interface VitalConfig {
  name: string;
  fullName: string;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
}

const vitalsConfig: Record<string, VitalConfig> = {
  lcp: {
    name: 'LCP',
    fullName: 'Largest Contentful Paint',
    unit: 'ms',
    thresholds: { good: 2500, needsImprovement: 4000 },
    description: '最大のコンテンツ要素が表示されるまでの時間',
  },
  fcp: {
    name: 'FCP',
    fullName: 'First Contentful Paint',
    unit: 'ms',
    thresholds: { good: 1800, needsImprovement: 3000 },
    description: '最初のコンテンツが描画されるまでの時間',
  },
  ttfb: {
    name: 'TTFB',
    fullName: 'Time to First Byte',
    unit: 'ms',
    thresholds: { good: 800, needsImprovement: 1800 },
    description: 'サーバーから最初のバイトを受信するまでの時間',
  },
  cls: {
    name: 'CLS',
    fullName: 'Cumulative Layout Shift',
    unit: '',
    thresholds: { good: 0.1, needsImprovement: 0.25 },
    description: 'レイアウトシフトの累積スコア',
  },
  fid: {
    name: 'FID',
    fullName: 'First Input Delay',
    unit: 'ms',
    thresholds: { good: 100, needsImprovement: 300 },
    description: '最初のユーザー入力への応答遅延',
  },
};

export function VitalsPanel({ metrics, onReloadPage }: Props) {
  const vitals = metrics?.vitals;

  const getStatus = (value: number | undefined, config: VitalConfig): 'good' | 'needs-improvement' | 'poor' | 'unknown' => {
    if (value === undefined) return 'unknown';
    if (value <= config.thresholds.good) return 'good';
    if (value <= config.thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good': return 'Good';
      case 'needs-improvement': return 'Needs Improvement';
      case 'poor': return 'Poor';
      default: return 'N/A';
    }
  };

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return '-';
    if (unit === 'ms') return `${value.toFixed(0)} ms`;
    return value.toFixed(3);
  };

  return (
    <div className="panel vitals-panel">
      <h2>Core Web Vitals</h2>

      {/* 学習ポイント */}
      <div className="learning-note">
        <h4>学習ポイント</h4>
        <p>
          Core Web Vitals は Google が定義したユーザー体験の指標で、
          SEO ランキングにも影響します。
        </p>
        <ul>
          <li><strong>LCP</strong>: 読み込みパフォーマンス（2.5秒以内が良好）</li>
          <li><strong>FID</strong>: インタラクティブ性（100ms以内が良好）</li>
          <li><strong>CLS</strong>: 視覚的安定性（0.1以下が良好）</li>
        </ul>
        <p>
          <strong>改善のヒント:</strong>
          <br />- LCP: 画像の最適化、プリロード
          <br />- FID: JavaScript の最適化、コード分割
          <br />- CLS: 画像・広告のサイズ指定
        </p>
      </div>

      {/* 操作ボタン */}
      <div className="vitals-controls">
        <button onClick={() => onReloadPage(false)} className="btn btn-primary">
          Reload Page
        </button>
        <button onClick={() => onReloadPage(true)} className="btn btn-secondary">
          Hard Reload (No Cache)
        </button>
      </div>

      {/* Vitals カード */}
      <div className="vitals-grid">
        {Object.entries(vitalsConfig).map(([key, config]) => {
          const value = vitals?.[key as keyof typeof vitals] as number | undefined;
          const status = getStatus(value, config);

          return (
            <div key={key} className={`vital-card ${status}`}>
              <div className="vital-header">
                <span className="vital-name">{config.name}</span>
                <span className="vital-full-name">{config.fullName}</span>
              </div>
              <div className="vital-value">
                {formatValue(value, config.unit)}
              </div>
              <div className="vital-status">
                {getStatusLabel(status)}
              </div>
              <div className="vital-description">
                {config.description}
              </div>
              <div className="vital-thresholds">
                <span className="threshold good">Good: ≤{config.thresholds.good}{config.unit}</span>
                <span className="threshold poor">Poor: {'>'}{config.thresholds.needsImprovement}{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 注意書き */}
      <div className="vitals-note">
        <p>
          ※ FID と CLS は CDP では直接測定が困難なため、
          より正確な値は Chrome DevTools または web-vitals ライブラリを使用してください。
        </p>
      </div>
    </div>
  );
}
