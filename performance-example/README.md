# Chrome Performance Tab 学習サンプル

Chrome DevTools の Performance タブの使い方を学ぶためのインタラクティブなサンプルです。各種パフォーマンス問題を意図的に発生させ、その原因とメカニズム、対策を学べます。

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
