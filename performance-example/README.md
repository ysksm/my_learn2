# Chrome Performance Tab 学習サンプル

Chrome DevTools の Performance タブの使い方を学ぶためのインタラクティブなサンプルです。各種パフォーマンス問題を意図的に発生させ、その原因とメカニズム、対策を学べます。

---

## 目次・パフォーマンス問題一覧

| # | 問題 | カテゴリ | Performance タブ指標 | フレームチャート表示 | 主な対策 |
|:-:|------|---------|---------------------|---------------------|---------|
| 1 | [Long Task](#1-long-task長いタスク) | JS | **Task** > 50ms, **Total Blocking Time** | 🔴 赤い三角マーク, 黄色の長いバー `Task` | Web Worker, タスク分割 |
| 2 | [Layout Thrashing](#2-layout-thrashing強制同期レイアウト) | JS | **Layout** 回数, **Forced reflow** 警告 | 紫 `Layout` が連続発生, ⚠️ 警告アイコン | 読み書き分離 |
| 3 | [大量DOM操作](#3-大量の-dom-操作) | JS | **Recalculate Style** 回数・時間 | 紫 `Recalculate Style` 頻発 | DocumentFragment |
| 4 | [メモリリーク](#4-メモリリーク) | JS | **JS Heap Size** 増加傾向 | Memory グラフ右肩上がり📈 | WeakMap, クリーンアップ |
| 5 | [頻繁なタイマー](#5-頻繁なタイマー) | JS | **Timer Fired** 回数 | 黄色 `Timer Fired` 大量発生 | requestAnimationFrame |
| 6 | [重いCSSアニメーション](#6-7-css-アニメーション重い-vs-軽い) | CSS | **Layout**, **Paint** 毎フレーム | 紫 `Layout` + 緑 `Paint` 連続 | transform/opacity 使用 |
| 7 | [軽いCSSアニメーション](#6-7-css-アニメーション重い-vs-軽い) | CSS | **Composite Layers** のみ | 緑 `Composite Layers` のみ | (比較用) |
| 8 | [複雑なCSSセレクタ](#8-複雑な-css-セレクタ) | CSS | **Recalculate Style** 時間 | 紫 `Recalculate Style` 長時間 | BEM, フラットなセレクタ |
| 9 | [Box Shadow/Filter](#9-box-shadow--filter) | CSS | **Paint** 時間 | 緑 `Paint` 処理が長い | will-change, シンプルな影 |
| 10 | [強制リフロー](#10-強制リフロー) | Render | **Layout** 回数, **Rendering** 時間 | 紫 `Layout` 100回以上発生 | キャッシュ, Observer API |
| 11 | [スクロールイベント](#11-スクロールイベント) | Render | **FPS** 低下, **Frame** 赤色 | 🔴 Frame ドロップ（赤いバー） | passive, throttle, rAF |
| 12 | [総合ストレステスト](#12-総合ストレステスト) | 総合 | 全指標が悪化 | Main スレッド全体が埋まる | (分析用) |
| 13 | [大量イベントリスナー](#13-大量イベントリスナー) | JS | **Event** 処理時間, **JS Heap** | 黄色 `Event` ハンドラ多数 | イベントデリゲーション |
| 14 | [Debounce/Throttle](#14-debounce--throttle) | JS | **Event** 発火回数の比較 | `Event` の発火密度の違い | debounce, throttle |
| 15 | [JSON.parse大量データ](#15-jsonparse-大量データ) | JS | **Task** > 50ms, **Scripting** 時間 | 🔴 Long Task, 黄色 `Parse JSON` | Web Worker, 分割処理 |
| 16 | [正規表現の暴走](#16-正規表現の暴走-redos) | JS | **Task** 極端に長い, **Scripting** | 🔴🔴 極長の黄色バー（数秒〜） | 安全なパターン, 入力制限 |
| 17 | [will-change乱用](#17-will-change-の乱用) | Layer | **GPU Memory** 増加 | Layers パネルでレイヤー数増加 | 必要な時だけ適用 |
| 18 | [CLS](#18-cls-cumulative-layout-shift) | Render | **Layout Shift** イベント | 青い `Layout Shift` マーカー | サイズ指定, aspect-ratio |
| 19 | [containプロパティ](#19-contain-プロパティ) | Render | **Paint** 範囲縮小 | 緑 `Paint` エリアが限定的に | contain: content |
| 20 | [レンダーブロッキング](#20-22-リソース読み込み) | Load | **FCP**, **LCP** 遅延 | Network 行でブロッキング表示 | async/defer, preload |
| 21 | [画像遅延読み込み](#20-22-リソース読み込み) | Load | **LCP**, Network タイミング | Network 行で画像リクエスト分散 | loading="lazy" |
| 22 | [Web Font読み込み](#20-22-リソース読み込み) | Load | **FCP**, **FOUT/FOIT** | Network 行でフォント読み込み | font-display: swap |
| 23 | [Canvas描画](#23-24-canvas-と描画) | Canvas | **Paint**, **GPU** 使用率 | 緑 `Paint` + GPU プロセス負荷 | オフスクリーンCanvas |
| 24 | [大量パーティクル](#23-24-canvas-と描画) | Canvas | **FPS** 低下, **Frame** 時間 | 🔴 Frame ドロップ, FPS < 60 | オブジェクトプール |

### Performance タブ指標の見方

| 指標名 | 説明 | 確認場所 |
|--------|------|----------|
| **Task** | JavaScript タスクの実行時間（50ms超でLong Task） | Main セクション |
| **Total Blocking Time (TBT)** | Long Task による累積ブロック時間 | Summary パネル |
| **Layout** | レイアウト計算イベント | Main セクション（紫色） |
| **Recalculate Style** | CSSスタイルの再計算 | Main セクション（紫色） |
| **Paint** | ピクセル描画イベント | Main セクション（緑色） |
| **Composite Layers** | レイヤー合成（GPU処理） | Main セクション（緑色） |
| **Timer Fired** | setInterval/setTimeout コールバック | Main セクション（黄色） |
| **Event** | イベントハンドラ実行 | Main セクション（黄色） |
| **JS Heap Size** | JavaScript ヒープメモリ使用量 | Memory チェックボックス有効時 |
| **FPS** | フレームレート（理想は60fps） | Frames セクション上部 |
| **Frame** | 各フレームの描画時間（16.67ms超で赤） | Frames セクション |
| **Layout Shift** | レイアウトシフト発生 | Experience セクション |
| **FCP/LCP** | First/Largest Contentful Paint | Timings セクション |
| **Forced reflow** | 強制同期レイアウトの警告 | ⚠️ 警告アイコン |

### フレームチャートの色分け

| 色 | 処理カテゴリ | 代表的なイベント |
|----|-------------|-----------------|
| 🟡 黄色 | **Scripting** | Task, Timer Fired, Event, Compile Script |
| 🟣 紫色 | **Rendering** | Recalculate Style, Layout, Update Layer Tree |
| 🟢 緑色 | **Painting** | Paint, Composite Layers |
| ⚪ グレー | **System/Other** | System, Idle |
| 🔴 赤色 | **問題の警告** | Long Task マーカー, Frame ドロップ |

### カテゴリ凡例

| カテゴリ | 説明 | DevTools タブ |
|---------|------|--------------|
| **JS** | JavaScript の実行に関する問題 | Performance (黄色) |
| **CSS** | スタイル計算・描画に関する問題 | Performance (紫/緑) |
| **Render** | レイアウト・再描画に関する問題 | Performance, Rendering |
| **Layer** | レイヤー管理に関する問題 | Layers |
| **Load** | リソース読み込みに関する問題 | Network, Performance |
| **Canvas** | Canvas 描画に関する問題 | Performance (GPU) |

---

## 使い方

```bash
# ブラウザで開く
open index.html
```

または、VS Code の Live Server 等で起動してください。

## ブラウザのレンダリングパイプライン（メカニズム）

ブラウザがページを表示する際、以下のパイプラインを通ります：

```
JavaScript → Style → Layout → Paint → Composite
```

| ステップ | 処理内容 | コスト |
|---------|---------|--------|
| **JavaScript** | DOM操作、イベント処理、計算 | 高（メインスレッド） |
| **Style** | CSSルールの適用、スタイル計算 | 中 |
| **Layout** | 要素の位置・サイズ計算 | 高 |
| **Paint** | ピクセルへの描画（色、影、テキスト） | 中〜高 |
| **Composite** | レイヤーの合成 | 低（GPU） |

**パフォーマンス改善の基本原則**: 後のステップを変更すると、それ以前の全ステップが再実行される。`transform` や `opacity` は Composite のみで済むため高速。

---

## パフォーマンス問題一覧

### 1. Long Task（長いタスク）

#### メカニズム
- JavaScript はシングルスレッドで動作（メインスレッド）
- 50ms以上かかる処理は「Long Task」としてマークされる
- Long Task 中は以下がすべてブロックされる：
  - ユーザー入力（クリック、スクロール）
  - アニメーション更新
  - レンダリング

```
┌─────────────────────────────────────┐
│         Main Thread                 │
├─────────────────────────────────────┤
│ [Long Task - 2000ms]                │ ← UIがフリーズ
│ ████████████████████████████████    │
│                                     │
│ ユーザー入力 → キューに溜まる       │
│ アニメーション → 停止               │
└─────────────────────────────────────┘
```

#### 原因
- 同期的な重いループ処理
- 大量データの処理
- 複雑な計算

#### 対策
| 方法 | 説明 |
|------|------|
| **Web Worker** | 別スレッドで計算を実行 |
| **タスク分割** | `setTimeout`/`requestIdleCallback` で処理を分割 |
| **仮想化** | 大量データは仮想スクロールで表示 |

```javascript
// 悪い例
for (let i = 0; i < 1000000; i++) { heavyCalc(i); }

// 良い例: Web Worker
const worker = new Worker('calc.js');
worker.postMessage(data);
worker.onmessage = (e) => updateUI(e.data);

// 良い例: タスク分割
function processChunk(items, index = 0) {
  const chunk = items.slice(index, index + 1000);
  chunk.forEach(process);
  if (index + 1000 < items.length) {
    setTimeout(() => processChunk(items, index + 1000), 0);
  }
}
```

---

### 2. Layout Thrashing（強制同期レイアウト）

#### メカニズム
- DOM のスタイルを変更すると、レイアウトは「無効」としてマークされる
- 通常、レイアウト計算は次のフレームまで遅延される
- しかし、特定のプロパティを読み取ると**即座に**レイアウトが計算される

```
┌──────────────────────────────────────────────────┐
│ 通常のフロー（効率的）                            │
├──────────────────────────────────────────────────┤
│ 書込→書込→書込→ [フレーム] →レイアウト計算→描画  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Layout Thrashing（非効率）                        │
├──────────────────────────────────────────────────┤
│ 書込→読取→[強制Layout]→書込→読取→[強制Layout]... │
│           ↑              ↑                      │
│         毎回計算        毎回計算                 │
└──────────────────────────────────────────────────┘
```

#### レイアウトを強制するプロパティ
```
offsetTop, offsetLeft, offsetWidth, offsetHeight
scrollTop, scrollLeft, scrollWidth, scrollHeight
clientTop, clientLeft, clientWidth, clientHeight
getComputedStyle(), getBoundingClientRect()
```

#### 対策
```javascript
// 悪い例: 読み書きが交互
elements.forEach(el => {
  const width = el.offsetWidth;      // 読取 → Layout強制
  el.style.width = width + 10 + 'px'; // 書込 → Layoutが無効に
});

// 良い例: 読み書き分離
const widths = elements.map(el => el.offsetWidth);  // まとめて読取
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px';  // まとめて書込
});
```

---

### 3. 大量の DOM 操作

#### メカニズム
- DOM への変更は「生きた」ドキュメントに直接影響
- 各変更で以下が発生する可能性：
  - スタイル再計算（Recalculate Style）
  - レイアウト計算（Layout）
  - 場合によっては Paint も

```
┌────────────────────────────────────────┐
│ 1000回の appendChild                   │
├────────────────────────────────────────┤
│ append → Style → Layout               │
│ append → Style → Layout               │
│ append → Style → Layout               │
│ ... (1000回繰り返し)                   │
└────────────────────────────────────────┘
```

#### 対策
```javascript
// 悪い例: 1つずつ追加（1000回のリフロー）
for (let i = 0; i < 1000; i++) {
  container.appendChild(createItem());
}

// 良い例: DocumentFragment（1回のリフロー）
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  fragment.appendChild(createItem());
}
container.appendChild(fragment);

// 良い例: innerHTML（1回のパース + 1回のリフロー）
container.innerHTML = items.map(createHTML).join('');
```

---

### 4. メモリリーク

#### メカニズム
- JavaScript はガベージコレクション（GC）でメモリを自動管理
- GC は「到達不可能」なオブジェクトを回収
- 参照が残っていると GC されない → メモリリーク

```
┌─────────────────────────────────────────────────┐
│ グローバル変数からの参照チェーン                │
├─────────────────────────────────────────────────┤
│ window → cache[] → Object1                      │
│                  → Object2                      │
│                  → Object3 → DOM Element (削除済) │
│                             ↑                   │
│                    参照があるのでGCされない      │
└─────────────────────────────────────────────────┘
```

#### 一般的なリークパターン
| パターン | 説明 |
|---------|------|
| グローバル配列 | クリアされない配列へのプッシュ |
| イベントリスナー | 削除されない要素へのリスナー |
| クロージャ | 大きなスコープへの参照を保持 |
| タイマー | clearされないsetInterval |
| 分離されたDOM | JSから参照されているが画面にない要素 |

#### 対策
```javascript
// WeakMap/WeakSet（弱参照）
const cache = new WeakMap();
cache.set(element, data);  // elementが消えるとエントリも消える

// 明示的なクリーンアップ
class Component {
  constructor() {
    this.handler = () => {};
    window.addEventListener('resize', this.handler);
  }
  destroy() {
    window.removeEventListener('resize', this.handler);
  }
}
```

---

### 5. 頻繁なタイマー

#### メカニズム
- `setInterval(fn, 1)` は実際には約4ms間隔で実行（ブラウザ制限）
- バックグラウンドタブではさらに制限される（1秒間隔など）
- 各コールバックはメインスレッドで実行される

```
┌──────────────────────────────────────────┐
│ setInterval(fn, 1) の実行                │
├──────────────────────────────────────────┤
│ Time: 0ms   4ms   8ms   12ms  16ms      │
│       fn()  fn()  fn()  fn()  fn()      │
│       ↓     ↓     ↓     ↓     ↓        │
│      [Main Thread がブロック]            │
└──────────────────────────────────────────┘

理想のフレームレート(60fps)では 16.67ms/frame
→ タイマーがフレームを圧迫
```

#### 対策
```javascript
// アニメーションには requestAnimationFrame
function animate() {
  updatePosition();
  requestAnimationFrame(animate);
}

// バックグラウンドでの停止
document.addEventListener('visibilitychange', () => {
  document.hidden ? pause() : resume();
});
```

---

### 6-7. CSS アニメーション（重い vs 軽い）

#### メカニズム
プロパティによって影響するパイプラインが異なる：

| プロパティ | 影響範囲 | コスト |
|-----------|---------|--------|
| `width`, `height`, `top`, `left` | Layout + Paint + Composite | 高 |
| `color`, `background` | Paint + Composite | 中 |
| `transform`, `opacity` | Composite のみ | 低 |

```
重いアニメーション (width/left):
┌─────────────────────────────────────────┐
│ Frame 1: JS → Style → Layout → Paint → Composite │
│ Frame 2: JS → Style → Layout → Paint → Composite │
│ Frame 3: JS → Style → Layout → Paint → Composite │
└─────────────────────────────────────────┘

軽いアニメーション (transform/opacity):
┌─────────────────────────────────────────┐
│ Frame 1: JS → Style → ---- → ---- → Composite │
│ Frame 2: JS → Style → ---- → ---- → Composite │
│ Frame 3: JS → Style → ---- → ---- → Composite │
└─────────────────────────────────────────┘
                        ↑ Layout/Paint をスキップ
```

#### GPUアクセラレーション
`transform` と `opacity` は専用のコンポジターレイヤーで処理：
- メインスレッドをブロックしない
- GPU で並列処理される
- `will-change` で事前にレイヤーを準備可能

```css
/* 悪い例 */
@keyframes bad {
  from { left: 0; width: 100px; }
  to { left: 200px; width: 150px; }
}

/* 良い例 */
.element {
  will-change: transform;
}
@keyframes good {
  from { transform: translateX(0) scale(1); }
  to { transform: translateX(200px) scale(1.5); }
}
```

---

### 8. 複雑な CSS セレクタ

#### メカニズム
- ブラウザはセレクタを**右から左**に評価する
- 深いネストは各レベルで親要素をチェック

```
セレクタ: .nav .menu .item .link span

評価順序:
1. 全ての <span> を見つける
2. 親に .link があるか確認
3. 親に .item があるか確認
4. 親に .menu があるか確認
5. 親に .nav があるか確認

要素数が多いほど計算コストが増大
```

#### セレクタの効率（速い順）
1. ID: `#header`
2. クラス: `.nav-item`
3. タグ: `div`
4. 兄弟: `h1 + p`
5. 子孫: `.nav span`
6. 全称: `*`
7. 属性: `[type="text"]`
8. 疑似: `:nth-child()`

---

### 9. Box Shadow / Filter

#### メカニズム
- `box-shadow` と `filter` は Paint 処理で重い計算が必要
- ぼかし処理は周囲のピクセルを参照して計算

```
box-shadow: 0 0 50px の場合:
┌────────────────────────────────┐
│ 各ピクセルについて:            │
│   周囲50px分のピクセルを参照   │
│   平均値を計算                 │
│   → 計算量: O(blur_radius²)    │
└────────────────────────────────┘
```

#### 対策
- 影のぼかし半径を小さくする
- 影の数を減らす
- `will-change` でレイヤー分離
- 疑似要素で影を分離し、`opacity` でアニメーション

---

### 10. 強制リフロー

#### メカニズム
Layout Thrashing と同様のメカニズム。特定のプロパティを読み取ると強制的にレイアウトが計算される。

#### 強制リフローを引き起こすAPI
```javascript
// サイズ・位置の取得
element.offsetTop/Left/Width/Height
element.scrollTop/Left/Width/Height
element.clientTop/Left/Width/Height
element.getBoundingClientRect()

// スタイルの取得
window.getComputedStyle(element)
element.computedStyleMap()

// スクロール操作
element.scrollTo()
element.scrollIntoView()

// フォーカス操作
element.focus()
```

---

### 11. スクロールイベント

#### メカニズム
- スクロールイベントは1秒に60回以上発火する可能性
- デフォルトでは `preventDefault()` が可能なため、ブラウザは最適化できない

```
┌────────────────────────────────────────┐
│ スクロールイベントの発火頻度          │
├────────────────────────────────────────┤
│ 1秒間: scroll → scroll → scroll → ... │
│        (60+ 回)                        │
│                                        │
│ 各イベントで重い処理 = カクつき        │
└────────────────────────────────────────┘
```

#### 対策
```javascript
// passive: true でブロックしないことを明示
element.addEventListener('scroll', handler, { passive: true });

// requestAnimationFrame でフレームごとに1回
let ticking = false;
element.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      doSomething();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// IntersectionObserver で可視性検出
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) loadContent();
  });
});
```

---

### 13. 大量イベントリスナー

#### メカニズム
- 各リスナーは関数オブジェクトとしてメモリを消費
- クロージャがある場合、外部スコープの変数も保持
- イベント発火時、該当要素のリスナーをすべてチェック

```
┌─────────────────────────────────────────────────┐
│ 1000個の個別リスナー                            │
├─────────────────────────────────────────────────┤
│ element1.addEventListener(fn1)                  │
│ element2.addEventListener(fn2)                  │
│ element3.addEventListener(fn3)                  │
│ ...                                             │
│ → 1000個の関数オブジェクト                      │
│ → メモリ消費大                                  │
│ → 動的要素には対応できない                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ イベントデリゲーション                          │
├─────────────────────────────────────────────────┤
│ parent.addEventListener(fn)                     │
│   └─ event.target で判定                        │
│ → 1個の関数オブジェクト                         │
│ → 動的要素も自動対応                            │
└─────────────────────────────────────────────────┘
```

#### 対策
```javascript
// イベントデリゲーション
container.addEventListener('click', (e) => {
  if (e.target.matches('.item')) handleClick(e);
});
```

---

### 14. Debounce / Throttle

#### メカニズム
高頻度イベント（input, scroll, resize）の処理を最適化

```
イベント発火:  |●|●|●|●|●|---------|●|●|●|
通常:          |x|x|x|x|x|         |x|x|x|  (9回実行)
Debounce:      |         |-------|x|     |x|  (2回: 停止後に実行)
Throttle:      |x|   |x|   |x|   |x|   |x|   (5回: 間隔制限)
```

| 手法 | 動作 | 用途 |
|------|------|------|
| **Debounce** | 最後のイベントから一定時間後に1回 | 検索入力、リサイズ完了後 |
| **Throttle** | 一定間隔で最大1回 | スクロール、マウス移動 |

---

### 15. JSON.parse 大量データ

#### メカニズム
- `JSON.parse()` は同期処理
- 大きなデータほどメインスレッドを長時間ブロック
- パース中はGCも発生しやすい

#### 対策
| 方法 | 説明 |
|------|------|
| **Web Worker** | 別スレッドでパース |
| **ストリーミング** | データを分割して処理 |
| **ページネーション** | サーバー側で分割 |

---

### 16. 正規表現の暴走 (ReDoS)

#### メカニズム
- 正規表現エンジンはマッチ失敗時にバックトラック
- ネストした量指定子 `(a+)+` は指数的な組み合わせを生成
- 悪意のある入力で意図的に遅延可能（ReDoS攻撃）

```
パターン: (a+)+$
入力: "aaaaaaaaaaaaaaaaaaaaaaaab"

試行:
1. a×25 としてマッチ試行 → 失敗
2. a×24 + a×1 として試行 → 失敗
3. a×23 + a×2 として試行 → 失敗
... (2^25 通りの組み合わせ)
```

#### 危険なパターン
```javascript
/(a+)+$/      // ネストした量指定子
/(a|a)+$/     // 重複する選択肢
/(.*a){10}/   // 繰り返しの中の .*
```

---

### 17. will-change の乱用

#### メカニズム
- `will-change` は要素を独立したコンポジットレイヤーに昇格
- 各レイヤーはGPUメモリを消費（ビットマップとして保持）
- 100x100pxの要素 ≈ 40KB (RGBA)

```
┌─────────────────────────────────────────────────┐
│ 過剰なレイヤー生成                              │
├─────────────────────────────────────────────────┤
│ .card { will-change: transform; } × 500個      │
│ → 500個の独立レイヤー                          │
│ → 約 20MB の GPU メモリ消費                     │
│ → モバイルではクラッシュの可能性                │
└─────────────────────────────────────────────────┘
```

#### 対策
```css
/* 必要な時だけ適用 */
.card:hover { will-change: transform; }
.card.animating { will-change: transform; }
```

---

### 18. CLS (Cumulative Layout Shift)

#### メカニズム
Core Web Vitals の重要指標。コンテンツの予期しない移動を測定。

```
CLS = Σ (影響割合 × 距離割合)

良好: < 0.1 | 改善が必要: 0.1-0.25 | 不良: > 0.25
```

#### 原因
- サイズ未指定の画像
- 動的に挿入されるコンテンツ
- Webフォントの読み込み

#### 対策
```html
<!-- サイズを明示 -->
<img src="..." width="800" height="600">

<!-- アスペクト比を維持 -->
<style>
.image { aspect-ratio: 16 / 9; }
</style>
```

---

### 19. contain プロパティ

#### メカニズム
レンダリング範囲を限定してブラウザの最適化を支援

| 値 | 効果 |
|----|------|
| `layout` | 内部のレイアウト変更が外部に影響しない |
| `paint` | 内部の描画が境界を超えない |
| `size` | 要素サイズが子に依存しない |
| `strict` | size + layout + paint |
| `content` | layout + paint |

```css
.widget { contain: content; }
.virtual-item { contain: strict; height: 50px; }
```

---

### 20-22. リソース読み込み

#### レンダーブロッキング
```html
<!-- async: 並列DL、即座に実行 -->
<script src="analytics.js" async></script>

<!-- defer: 並列DL、DOM解析後に順序通り実行 -->
<script src="app.js" defer></script>

<!-- クリティカルCSSをインライン化 -->
<style>/* 初期表示に必要な最小限 */</style>
```

#### 画像の遅延読み込み
```html
<img src="..." loading="lazy">
```

#### Webフォント
```css
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2');
  font-display: swap; /* FOUT: 代替フォントを先に表示 */
}
```

---

### 23-24. Canvas と描画

#### 非効率な描画
```javascript
// 毎フレーム全体を再描画（悪い例）
function render() {
  ctx.clearRect(0, 0, w, h);
  drawBackground();  // 毎回描画
  drawObjects();
  requestAnimationFrame(render);
}
```

#### 効率的な描画
```javascript
// オフスクリーンCanvasでキャッシュ
const offscreen = document.createElement('canvas');
const offCtx = offscreen.getContext('2d');
drawBackground(offCtx);  // 一度だけ

function render() {
  ctx.drawImage(offscreen, 0, 0);  // 転送のみ
  drawMovingObjects(ctx);
  requestAnimationFrame(render);
}
```

#### パーティクル最適化
- **オブジェクトプール**: 生成/破棄を避けて再利用
- **バッチ描画**: 同じ種類をまとめて描画
- **LOD**: 遠い/小さいものを省略
- **GPU**: WebGL/シェーダーで並列処理

---

## Chrome DevTools の使い方

### Performance タブ

1. **F12** で DevTools を開く
2. **Performance** タブを選択
3. **⚫ Record** ボタンをクリック
4. 問題のある操作を実行
5. **⬛ Stop** ボタンをクリック

### 見るべき指標

| 指標 | 場所 | 理想値 |
|------|------|--------|
| FPS | 上部の緑グラフ | 60fps (一定) |
| CPU | 上部の黄色グラフ | 低く一定 |
| Long Tasks | Main セクション | 赤い三角なし |
| Layout | 紫色のバー | 最小限 |
| Paint | 緑色のバー | 最小限 |

### 便利な機能

- **CPU Throttling**: 低スペック環境をシミュレート
- **Screenshots**: 各時点の画面をキャプチャ
- **Call Tree**: 関数の呼び出し階層を確認
- **Bottom-Up**: 最も時間のかかった処理を確認

### 追加ツール

| ツール | 用途 |
|--------|------|
| **Rendering** | Paint flashing で再描画を可視化 |
| **Layers** | レイヤー構成を3Dで確認 |
| **Memory** | ヒープスナップショットでリークを検出 |
| **Coverage** | 未使用コードを検出 |

---

## 参考リンク

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Rendering Performance](https://web.dev/rendering-performance/)
- [Avoid Layout Thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)
- [CSS Triggers](https://csstriggers.com/) - プロパティごとの影響範囲
