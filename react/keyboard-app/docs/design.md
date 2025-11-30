# 設計書

## アーキテクチャ

```
src/
├── components/
│   ├── keyboards/
│   │   ├── NumericKeyboard.tsx    # 数値キーボード
│   │   ├── HiraganaKeyboard.tsx   # ひらがなキーボード
│   │   ├── KatakanaKeyboard.tsx   # カタカナキーボード
│   │   ├── AlphabetKeyboard.tsx   # アルファベットキーボード
│   │   ├── KeyboardBase.tsx       # 共通キーボードベース
│   │   ├── KeyboardBase.css       # キーボードスタイル
│   │   └── index.ts               # エクスポート
│   ├── inputs/
│   │   ├── KeyboardInput.tsx      # キーボード連携入力コンポーネント
│   │   ├── KeyboardInput.css      # 入力フィールドスタイル
│   │   └── index.ts               # エクスポート
│   └── App.tsx
├── hooks/
│   ├── useKeyboard.ts             # キーボード制御フック
│   └── useKeyboard.test.ts        # ユニットテスト
├── types/
│   └── keyboard.ts                # 型定義
├── test/
│   └── setup.ts                   # テストセットアップ
└── main.tsx
```

## コンポーネント設計

### KeyboardBase

全キーボードの基底コンポーネント。共通レイアウトと機能を提供。

```typescript
interface KeyboardBaseProps {
  keys: string[][];           // キー配列（行ごと）
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;    // バックスペース処理
  mode: 'realtime' | 'confirm';
  previewValue?: string;      // 確定モード用プレビュー値
  onConfirm?: () => void;     // 確定モード用
}
```

### KeyboardInput

入力フィールドとキーボードを連携するラッパーコンポーネント。

```typescript
interface KeyboardInputProps {
  type: 'numeric' | 'hiragana' | 'katakana' | 'alphabet';
  mode: 'realtime' | 'confirm';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}
```

**使用例:**
```tsx
<KeyboardInput
  type="numeric"
  mode="realtime"
  value={value}
  onChange={setValue}
  label="数値入力"
  placeholder="タップして入力"
/>
```

### useKeyboard フック

キーボードの表示/非表示、入力状態を管理。

```typescript
interface UseKeyboardReturn {
  isOpen: boolean;
  inputValue: string;        // 確定済みの入力値
  previewValue: string;      // 確定モード用（現在の入力値 + 編集中の値）
  open: () => void;
  close: () => void;
  handleKeyPress: (key: string) => void;
  handleConfirm: () => void;
  handleBackspace: () => void;
  setInputValue: (value: string) => void;
}
```

**確定モードの動作:**
- `open()` 時に `previewValue` へ現在の `inputValue` をコピー
- キー入力で `previewValue` を編集
- `handleConfirm()` で `previewValue` を `inputValue` として確定

**実装上の注意:**
- 連続入力に対応するため、状態更新は関数型更新 (`setState(current => ...)`) を使用
- `onChange` コールバックは `useRef` で保持し、最新の参照を維持

## キー配列定義

### 数値キーボード

```
[ 1 ] [ 2 ] [ 3 ]
[ 4 ] [ 5 ] [ 6 ]
[ 7 ] [ 8 ] [ 9 ]
[ ⌫ ] [ 0 ] [ ✓ ]
```

### ひらがな/カタカナキーボード

五十音配列（あかさたなはまやらわ行）

### アルファベットキーボード

QWERTY配列

## 状態管理

- 各入力フィールドの値はローカルステートで管理
- キーボードの開閉状態は `useKeyboard` フックで管理
- 確定モードのプレビュー値は一時的なステートとして保持

## スタイリング

- 通常のCSSファイルを使用（コンポーネントごとに分離）
- キーボードは画面下部に固定表示（オーバーレイ付き）
- レスポンシブ対応（モバイル想定、最大幅400px）
- ダークモード対応のため、入力フィールドにはテキスト色を明示的に指定

## デモ画面

デモ画面（`App.tsx`）では以下の機能を提供：

- **モード切り替え**: リアルタイム / 確定モードをボタンで切り替え
- **4種類の入力フィールド**: 数値、ひらがな、カタカナ、アルファベット
- **入力値確認**: 全入力値を一覧表示
- **リセット機能**: 「すべてクリア」ボタンで全入力をリセット

## アニメーション

- キーボード表示時: オーバーレイのフェードイン、コンテナの下からスライドアップ
- キー押下時: スケールダウンアニメーション

## アクセシビリティ

- `role="dialog"` と `aria-modal="true"` でモーダルとして認識
- `aria-label` で各キーの説明を提供
- `aria-live="polite"` でプレビュー値の変更を読み上げ
- 空白キー（`　`）は `disabled` に設定

## テスト

Vitestを使用したユニットテスト:

- `npm run test` - ウォッチモードでテスト実行
- `npm run test:run` - テストを1回実行

テスト対象:
- `useKeyboard` フック（リアルタイムモード、確定モード）
