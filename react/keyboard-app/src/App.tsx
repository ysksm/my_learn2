import { useState } from 'react'
import { KeyboardInput } from './components/inputs'
import './App.css'

function App() {
  // 各入力フィールドの値を管理
  const [numericValue, setNumericValue] = useState('');
  const [hiraganaValue, setHiraganaValue] = useState('');
  const [katakanaValue, setKatakanaValue] = useState('');
  const [alphabetValue, setAlphabetValue] = useState('');

  return (
    <div className="app">
      <h1>Phase 3: KeyboardInput</h1>

      <section className="demo-section">
        <h2>リアルタイムモード</h2>
        <p>キー入力が即座に反映されます</p>

        <KeyboardInput
          type="numeric"
          mode="realtime"
          value={numericValue}
          onChange={setNumericValue}
          label="数値入力"
          placeholder="タップして数字を入力"
        />

        <KeyboardInput
          type="katakana"
          mode="realtime"
          value={katakanaValue}
          onChange={setKatakanaValue}
          label="カタカナ入力"
          placeholder="タップしてカタカナを入力"
        />
      </section>

      <section className="demo-section">
        <h2>確定モード</h2>
        <p>プレビュー確認後、確定ボタンで反映</p>

        <KeyboardInput
          type="hiragana"
          mode="confirm"
          value={hiraganaValue}
          onChange={setHiraganaValue}
          label="ひらがな入力"
          placeholder="タップしてひらがなを入力"
        />

        <KeyboardInput
          type="alphabet"
          mode="confirm"
          value={alphabetValue}
          onChange={setAlphabetValue}
          label="アルファベット入力"
          placeholder="タップしてアルファベットを入力"
        />
      </section>

      <section className="demo-section">
        <h2>入力値の確認</h2>
        <div className="values-display">
          <p><strong>数値:</strong> {numericValue || '(未入力)'}</p>
          <p><strong>カタカナ:</strong> {katakanaValue || '(未入力)'}</p>
          <p><strong>ひらがな:</strong> {hiraganaValue || '(未入力)'}</p>
          <p><strong>アルファベット:</strong> {alphabetValue || '(未入力)'}</p>
        </div>
      </section>
    </div>
  )
}

export default App
