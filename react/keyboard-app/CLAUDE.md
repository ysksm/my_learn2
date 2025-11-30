# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - TypeScript compilation and Vite production build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run unit tests once

## Tech Stack

- React 19 with TypeScript
- Vite (using rolldown-vite) for bundling
- ESLint for linting
- Vitest for unit testing

## Project Structure

```
src/
├── components/
│   ├── keyboards/       # キーボードコンポーネント群
│   │   ├── KeyboardBase.tsx
│   │   ├── NumericKeyboard.tsx
│   │   ├── HiraganaKeyboard.tsx
│   │   ├── KatakanaKeyboard.tsx
│   │   └── AlphabetKeyboard.tsx
│   └── inputs/
│       └── KeyboardInput.tsx  # 統合入力コンポーネント
├── hooks/
│   └── useKeyboard.ts   # キーボード制御フック
├── types/
│   └── keyboard.ts      # 型定義
└── App.tsx              # デモ画面
```

## Key Components

- **KeyboardInput**: 入力タイプ（numeric/hiragana/katakana/alphabet）とモード（realtime/confirm）を指定して使用
- **useKeyboard**: キーボードの状態管理フック。連続入力対応のため関数型更新を使用
