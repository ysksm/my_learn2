# Jira Project Viewer Chrome Extension

Jira APIにアクセスしてプロジェクト一覧を取得するChrome拡張機能のプロトタイプです。

## 機能

- 現在開いているJiraページのURLを自動検出
- ボタン1つでプロジェクト一覧を取得
- サイドパネルで表示

## インストール方法

### 1. アイコンの生成

1. `generate-icons.html` をブラウザで開く
2. 各サイズのボタンをクリックしてアイコンをダウンロード
3. ダウンロードしたファイルを `icons/` フォルダに配置

### 2. Chrome拡張機能として読み込み

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `jira-chrome-extension` フォルダを選択

## 使い方

1. Jiraサイト（例: `https://your-domain.atlassian.net`）を開く
2. Chrome拡張機能のアイコンをクリックしてサイドパネルを開く
3. Base URLが自動的に検出される
4. 「プロジェクト一覧を取得」ボタンをクリック
5. プロジェクト一覧が表示される

## 注意事項

- Jiraにログイン済みの状態で使用してください
- 拡張機能はJiraの認証Cookie（`credentials: 'include'`）を使用してAPIにアクセスします
- Atlassian Cloudの場合、`*.atlassian.net` ドメインのみ対応しています

## 技術仕様

- Manifest V3
- Side Panel API
- Jira REST API v3 (`/rest/api/3/project/search`)

## ファイル構成

```
jira-chrome-extension/
├── manifest.json        # 拡張機能の設定
├── background.js        # Service Worker
├── sidepanel.html       # サイドパネルのHTML
├── sidepanel.js         # サイドパネルのロジック
├── styles.css           # スタイル
├── generate-icons.html  # アイコン生成ツール
├── icons/               # アイコンフォルダ
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
