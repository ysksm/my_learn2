# TypeSpec Sample App

TypeSpecを使ったAPI定義からフルスタックアプリケーションを構築するサンプルプロジェクトです。

## 技術スタック

- **API定義**: TypeSpec
- **バックエンド**: Express.js (TypeScript)
- **フロントエンド**: React (TypeScript) + Vite

## プロジェクト構造

```
typespec-sample-app/
├── typespec/           # TypeSpec API定義
│   ├── main.tsp        # API仕様の定義
│   └── tsp-output/     # 生成されたOpenAPI仕様
├── backend/            # Express.js バックエンド
│   └── src/
│       ├── index.ts    # サーバーエントリーポイント
│       ├── types.ts    # TypeScript型定義
│       ├── repository.ts # データストア
│       └── routes/     # APIルート
├── frontend/           # React フロントエンド
│   └── src/
│       ├── api/        # APIクライアント
│       ├── components/ # Reactコンポーネント
│       └── types/      # TypeScript型定義
└── package.json        # ルートパッケージ設定
```

## セットアップ

### 1. 依存関係のインストール

```bash
# ルートディレクトリで実行
npm run install:all
```

または個別にインストール:

```bash
cd typespec && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. TypeSpecのビルド

```bash
cd typespec
npm run build
```

これにより `tsp-output/openapi.yaml` が生成されます。

### 3. バックエンドの起動

```bash
cd backend

# 開発モード
npm run dev

# または本番モード
npm run build && npm start
```

バックエンドは http://localhost:3001 で起動します。

### 4. フロントエンドの起動

```bash
cd frontend

# 開発モード
npm run dev

# または本番ビルド
npm run build && npm run preview
```

フロントエンドは http://localhost:5173 で起動します。

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /health | ヘルスチェック |
| GET | /todos | Todo一覧取得 |
| GET | /todos/:id | Todo取得 |
| POST | /todos | Todo作成 |
| PATCH | /todos/:id | Todo更新 |
| DELETE | /todos/:id | Todo削除 |

### API ドキュメント

バックエンド起動後、以下のURLでSwagger UIが利用可能です:
- http://localhost:3001/api-docs

## TypeSpecについて

TypeSpecはMicrosoftが開発したAPI記述言語です。このプロジェクトでは以下の機能を使用しています:

- **モデル定義**: データ構造の型安全な定義
- **エンドポイント定義**: RESTful APIの宣言的な定義
- **バリデーション**: @minLength, @maxLength などの制約
- **OpenAPI生成**: TypeSpecからOpenAPI 3.0仕様を自動生成

### TypeSpecファイルの編集

`typespec/main.tsp` を編集してAPIを変更し、以下のコマンドで再ビルドします:

```bash
cd typespec
npm run build
```

## 機能

- Todo作成・編集・削除
- ステータス管理（未着手・進行中・完了）
- フィルタリング
- ページネーション
- サーバーステータス表示
- Swagger UIによるAPIドキュメント

## 学習ポイント

1. **TypeSpecによるAPI First開発**: APIの仕様を先に定義し、コードを生成
2. **型の共有**: TypeSpecで定義した型をバックエンド・フロントエンドで共有
3. **OpenAPI活用**: 生成されたOpenAPI仕様からSwagger UIを提供
4. **RESTful API設計**: 標準的なCRUD操作の実装

## ライセンス

MIT
