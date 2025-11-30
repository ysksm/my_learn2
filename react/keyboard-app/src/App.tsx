import { useKeyboard } from './hooks/useKeyboard'
import {
  NumericKeyboard,
  HiraganaKeyboard,
  KatakanaKeyboard,
  AlphabetKeyboard,
} from './components/keyboards'
import './App.css'

function App() {
  // 数値キーボード（リアルタイム）
  const numericKeyboard = useKeyboard({
    mode: 'realtime',
    initialValue: '',
  });

  // ひらがなキーボード（確定モード）
  const hiraganaKeyboard = useKeyboard({
    mode: 'confirm',
    initialValue: '',
  });

  // カタカナキーボード（リアルタイム）
  const katakanaKeyboard = useKeyboard({
    mode: 'realtime',
    initialValue: '',
  });

  // アルファベットキーボード（確定モード）
  const alphabetKeyboard = useKeyboard({
    mode: 'confirm',
    initialValue: '',
  });

  return (
    <div className="app">
      <h1>Phase 2: キーボードコンポーネント</h1>

      <section className="demo-section">
        <h2>数値キーボード（リアルタイム）</h2>
        <div className="input-group">
          <input
            type="text"
            value={numericKeyboard.inputValue}
            readOnly
            placeholder="タップして数字を入力"
            onFocus={numericKeyboard.open}
          />
        </div>
        {numericKeyboard.isOpen && (
          <NumericKeyboard
            onKeyPress={numericKeyboard.handleKeyPress}
            onBackspace={numericKeyboard.handleBackspace}
            onClose={numericKeyboard.close}
            mode="realtime"
          />
        )}
      </section>

      <section className="demo-section">
        <h2>ひらがなキーボード（確定モード）</h2>
        <div className="input-group">
          <input
            type="text"
            value={hiraganaKeyboard.inputValue}
            readOnly
            placeholder="タップしてひらがなを入力"
            onFocus={hiraganaKeyboard.open}
          />
        </div>
        {hiraganaKeyboard.isOpen && (
          <HiraganaKeyboard
            onKeyPress={hiraganaKeyboard.handleKeyPress}
            onBackspace={hiraganaKeyboard.handleBackspace}
            onClose={hiraganaKeyboard.close}
            mode="confirm"
            previewValue={hiraganaKeyboard.previewValue}
            onConfirm={hiraganaKeyboard.handleConfirm}
          />
        )}
      </section>

      <section className="demo-section">
        <h2>カタカナキーボード（リアルタイム）</h2>
        <div className="input-group">
          <input
            type="text"
            value={katakanaKeyboard.inputValue}
            readOnly
            placeholder="タップしてカタカナを入力"
            onFocus={katakanaKeyboard.open}
          />
        </div>
        {katakanaKeyboard.isOpen && (
          <KatakanaKeyboard
            onKeyPress={katakanaKeyboard.handleKeyPress}
            onBackspace={katakanaKeyboard.handleBackspace}
            onClose={katakanaKeyboard.close}
            mode="realtime"
          />
        )}
      </section>

      <section className="demo-section">
        <h2>アルファベットキーボード（確定モード）</h2>
        <div className="input-group">
          <input
            type="text"
            value={alphabetKeyboard.inputValue}
            readOnly
            placeholder="タップしてアルファベットを入力"
            onFocus={alphabetKeyboard.open}
          />
        </div>
        {alphabetKeyboard.isOpen && (
          <AlphabetKeyboard
            onKeyPress={alphabetKeyboard.handleKeyPress}
            onBackspace={alphabetKeyboard.handleBackspace}
            onClose={alphabetKeyboard.close}
            mode="confirm"
            previewValue={alphabetKeyboard.previewValue}
            onConfirm={alphabetKeyboard.handleConfirm}
          />
        )}
      </section>
    </div>
  )
}

export default App
