import { useState } from 'react'
import { KeyboardInput } from './components/inputs'
import type { KeyboardMode } from './types/keyboard'
import './App.css'

function App() {
  // モード切り替え
  const [mode, setMode] = useState<KeyboardMode>('realtime');

  // 各入力フィールドの値を管理
  const [numericValue, setNumericValue] = useState('');
  const [hiraganaValue, setHiraganaValue] = useState('');
  const [katakanaValue, setKatakanaValue] = useState('');
  const [alphabetValue, setAlphabetValue] = useState('');

  const handleReset = () => {
    setNumericValue('');
    setHiraganaValue('');
    setKatakanaValue('');
    setAlphabetValue('');
  };

  return (
    <div className="app">
      <h1>キーボードコンポーネント</h1>

      <section className="mode-selector">
        <h2>入力モード</h2>
        <div className="mode-buttons">
          <button
            className={`mode-button ${mode === 'realtime' ? 'active' : ''}`}
            onClick={() => setMode('realtime')}
          >
            リアルタイム
          </button>
          <button
            className={`mode-button ${mode === 'confirm' ? 'active' : ''}`}
            onClick={() => setMode('confirm')}
          >
            確定モード
          </button>
        </div>
        <p className="mode-description">
          {mode === 'realtime'
            ? 'キー入力が即座に反映されます'
            : 'プレビュー確認後、確定ボタンで反映されます'}
        </p>
      </section>

      <section className="demo-section">
        <h2>入力フィールド</h2>

        <KeyboardInput
          type="numeric"
          mode={mode}
          value={numericValue}
          onChange={setNumericValue}
          label="数値"
          placeholder="数字を入力"
        />

        <KeyboardInput
          type="hiragana"
          mode={mode}
          value={hiraganaValue}
          onChange={setHiraganaValue}
          label="ひらがな"
          placeholder="ひらがなを入力"
        />

        <KeyboardInput
          type="katakana"
          mode={mode}
          value={katakanaValue}
          onChange={setKatakanaValue}
          label="カタカナ"
          placeholder="カタカナを入力"
        />

        <KeyboardInput
          type="alphabet"
          mode={mode}
          value={alphabetValue}
          onChange={setAlphabetValue}
          label="アルファベット"
          placeholder="アルファベットを入力"
        />
      </section>

      <section className="demo-section">
        <h2>入力値の確認</h2>
        <div className="values-display">
          <p><strong>数値:</strong> {numericValue || '(未入力)'}</p>
          <p><strong>ひらがな:</strong> {hiraganaValue || '(未入力)'}</p>
          <p><strong>カタカナ:</strong> {katakanaValue || '(未入力)'}</p>
          <p><strong>アルファベット:</strong> {alphabetValue || '(未入力)'}</p>
        </div>
        <button className="reset-button" onClick={handleReset}>
          すべてクリア
        </button>
      </section>
    </div>
  )
}

export default App
