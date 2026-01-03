import { DevToolsGuide } from '../../components/Common/DevToolsGuide'
import { LayoutThrashingExercise } from './exercises/LayoutThrashing'
import { DomParsingExercise } from './exercises/DomParsing'
import { PaintOptimizationExercise } from './exercises/PaintOptimization'
import './Lesson.css'

export function RenderingPipelineLesson() {
  return (
    <div className="lesson">
      <header className="lesson-header">
        <h1>Lesson 1: Rendering Pipeline</h1>
        <p>ブラウザがHTMLを画面に描画するまでの過程を理解し、各フェーズのボトルネックを特定・改善する方法を学びます。</p>
      </header>

      {/* Concept overview */}
      <section className="concept-section">
        <h2>レンダリングパイプラインとは</h2>
        <div className="pipeline-diagram">
          <div className="pipeline-stage">
            <div className="stage-icon">📄</div>
            <div className="stage-name">Parse HTML</div>
            <div className="stage-desc">HTML → DOM</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-icon">🎨</div>
            <div className="stage-name">Parse CSS</div>
            <div className="stage-desc">CSS → CSSOM</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-icon">🌳</div>
            <div className="stage-name">Render Tree</div>
            <div className="stage-desc">DOM + CSSOM</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-icon">📐</div>
            <div className="stage-name">Layout</div>
            <div className="stage-desc">位置・サイズ計算</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-icon">🖌️</div>
            <div className="stage-name">Paint</div>
            <div className="stage-desc">ピクセル描画</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <div className="stage-icon">🖼️</div>
            <div className="stage-name">Composite</div>
            <div className="stage-desc">レイヤー合成</div>
          </div>
        </div>

        <div className="frame-budget-explanation">
          <h3>フレームバジェット（Frame Budget）</h3>
          <p>
            60FPSを維持するには、1フレームあたり<strong>16.67ms</strong>以内にすべての処理を完了する必要があります。
            これを「フレームバジェット」と呼びます。
          </p>
          <div className="budget-breakdown-detail">
            <div className="budget-item">
              <span className="budget-phase">JavaScript</span>
              <span className="budget-time">~10ms</span>
              <span className="budget-note">イベント処理、DOM操作</span>
            </div>
            <div className="budget-item">
              <span className="budget-phase">Style</span>
              <span className="budget-time">~1ms</span>
              <span className="budget-note">スタイル再計算</span>
            </div>
            <div className="budget-item">
              <span className="budget-phase">Layout</span>
              <span className="budget-time">~2ms</span>
              <span className="budget-note">レイアウト計算</span>
            </div>
            <div className="budget-item">
              <span className="budget-phase">Paint</span>
              <span className="budget-time">~2ms</span>
              <span className="budget-note">描画コマンド生成</span>
            </div>
            <div className="budget-item">
              <span className="budget-phase">Composite</span>
              <span className="budget-time">~1ms</span>
              <span className="budget-note">レイヤー合成（GPU）</span>
            </div>
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section className="exercises-section">
        <h2>演習</h2>

        <DomParsingExercise />
        <LayoutThrashingExercise />
        <PaintOptimizationExercise />
      </section>

      {/* DevTools Guide */}
      <section className="devtools-section">
        <h2>DevToolsでの確認方法</h2>
        <DevToolsGuide
          title="Performance パネルでレンダリングを分析"
          steps={[
            {
              instruction: 'DevToolsを開く (F12)',
              detail: 'または右クリック → 検証',
            },
            {
              instruction: 'Performance タブを選択',
              detail: '上部のタブから「Performance」をクリック',
            },
            {
              instruction: '⏺ 録画ボタンをクリック',
              detail: '記録を開始します',
            },
            {
              instruction: '問題のある操作を実行',
              detail: '上の演習でボタンをクリック',
            },
            {
              instruction: '⏹ 停止ボタンで録画終了',
              detail: 'タイムラインが表示されます',
            },
            {
              instruction: 'Main スレッドを確認',
              detail: '紫: Layout、緑: Paint、黄: Script を探す',
            },
          ]}
          tips={[
            'Long Tasks（50ms以上）は赤い三角マークで表示されます',
            'Layout Shift は赤いバーで表示されます',
            'ズームして詳細を確認できます（マウスホイール）',
          ]}
        />
      </section>

      {/* Key takeaways */}
      <section className="takeaways-section">
        <h2>Key Takeaways</h2>
        <ul className="takeaways-list">
          <li>
            <strong>Layout Thrashing を避ける</strong>：読み取りと書き込みをバッチ処理する
          </li>
          <li>
            <strong>DOM操作を最小化</strong>：DocumentFragment や innerHTML を活用
          </li>
          <li>
            <strong>transform/opacity を活用</strong>：Layout/Paint をスキップできる
          </li>
          <li>
            <strong>will-change を適切に使用</strong>：事前にレイヤー化を指示
          </li>
        </ul>
      </section>
    </div>
  )
}
