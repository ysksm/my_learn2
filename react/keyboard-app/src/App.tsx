import { useKeyboard } from './hooks/useKeyboard'
import { KeyboardBase } from './components/keyboards/KeyboardBase'
import './App.css'

// Phase 1 デモ用: 数値キーボードのキー配列
const NUMERIC_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
];

function App() {
  // リアルタイムモードのテスト
  const realtimeKeyboard = useKeyboard({
    mode: 'realtime',
    initialValue: '',
  });

  // 確定モードのテスト
  const confirmKeyboard = useKeyboard({
    mode: 'confirm',
    initialValue: '',
  });

  return (
    <div className="app">
      <h1>Phase 1: 基盤構築デモ</h1>

      <section className="demo-section">
        <h2>リアルタイムモード</h2>
        <p>キー入力が即座に反映されます</p>
        <div className="input-group">
          <input
            type="text"
            value={realtimeKeyboard.inputValue}
            readOnly
            placeholder="タップして入力"
            onFocus={realtimeKeyboard.open}
          />
        </div>
        {realtimeKeyboard.isOpen && (
          <KeyboardBase
            keys={NUMERIC_KEYS}
            onKeyPress={realtimeKeyboard.handleKeyPress}
            onBackspace={realtimeKeyboard.handleBackspace}
            onClose={realtimeKeyboard.close}
            mode="realtime"
          />
        )}
      </section>

      <section className="demo-section">
        <h2>確定モード</h2>
        <p>プレビュー表示後、確定ボタンで反映</p>
        <div className="input-group">
          <input
            type="text"
            value={confirmKeyboard.inputValue}
            readOnly
            placeholder="タップして入力"
            onFocus={confirmKeyboard.open}
          />
        </div>
        {confirmKeyboard.isOpen && (
          <KeyboardBase
            keys={NUMERIC_KEYS}
            onKeyPress={confirmKeyboard.handleKeyPress}
            onBackspace={confirmKeyboard.handleBackspace}
            onClose={confirmKeyboard.close}
            mode="confirm"
            previewValue={confirmKeyboard.previewValue}
            onConfirm={confirmKeyboard.handleConfirm}
          />
        )}
      </section>
    </div>
  )
}

export default App
