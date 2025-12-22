/**
 * Chrome Performance Tab 学習サンプル
 * 各種パフォーマンス問題を意図的に発生させるスクリプト
 */

// =============================================================================
// 1. Long Task - メインスレッドをブロックする重い計算
// =============================================================================
function runLongTask() {
  const indicator = document.getElementById('longTaskIndicator');
  indicator.textContent = '処理中... (UIがフリーズします)';
  indicator.style.color = '#ef4444';

  // requestAnimationFrame で UI 更新後に重い処理を実行
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const startTime = performance.now();

      // 重いループ処理（約2秒）
      let result = 0;
      for (let i = 0; i < 100000000; i++) {
        result += Math.sqrt(i) * Math.sin(i);
      }

      const endTime = performance.now();
      indicator.textContent = `完了! 処理時間: ${(endTime - startTime).toFixed(2)}ms`;
      indicator.style.color = '#22c55e';

      console.log('Long Task Result:', result);
    });
  });
}

// =============================================================================
// 2. Layout Thrashing - 強制同期レイアウト
// =============================================================================
function runLayoutThrashing() {
  const container = document.getElementById('layoutBoxes');
  container.innerHTML = '';

  // 50個のボックスを作成
  for (let i = 0; i < 50; i++) {
    const box = document.createElement('div');
    box.className = 'layout-box';
    box.id = `layoutBox${i}`;
    container.appendChild(box);
  }

  // Layout Thrashing: 読み取りと書き込みを交互に行う（悪い例）
  const boxes = container.querySelectorAll('.layout-box');

  console.time('Layout Thrashing');

  for (let iteration = 0; iteration < 100; iteration++) {
    boxes.forEach((box, index) => {
      // 読み取り（Layout を強制）
      const width = box.offsetWidth;

      // 書き込み（スタイル変更）
      box.style.width = (width + Math.sin(iteration) * 2) + 'px';

      // また読み取り（再度 Layout を強制）
      const height = box.offsetHeight;

      // また書き込み
      box.style.height = (height + Math.cos(iteration) * 2) + 'px';
    });
  }

  console.timeEnd('Layout Thrashing');
}

// =============================================================================
// 3. 大量の DOM 操作
// =============================================================================
function runDomManipulation() {
  const container = document.getElementById('domContainer');
  container.innerHTML = '';

  console.time('DOM Manipulation (Bad)');

  // 悪い例: 1つずつ追加（毎回リフローが発生）
  for (let i = 0; i < 1000; i++) {
    const item = document.createElement('div');
    item.className = 'dom-item';
    item.style.backgroundColor = `hsl(${(i * 0.36) % 360}, 70%, 50%)`;
    container.appendChild(item); // 毎回 DOM に追加
  }

  console.timeEnd('DOM Manipulation (Bad)');
}

function clearDomElements() {
  document.getElementById('domContainer').innerHTML = '';
}

// =============================================================================
// 4. メモリリーク
// =============================================================================
const memoryLeakStorage = [];

function createMemoryLeak() {
  const indicator = document.getElementById('memoryIndicator');

  // 大きなオブジェクトを作成して保持し続ける
  for (let i = 0; i < 1000; i++) {
    const largeObject = {
      id: memoryLeakStorage.length,
      data: new Array(10000).fill('メモリを消費するデータ'),
      timestamp: new Date(),
      nestedData: {
        level1: {
          level2: {
            level3: new Array(1000).fill(Math.random())
          }
        }
      }
    };
    memoryLeakStorage.push(largeObject);
  }

  indicator.textContent = `蓄積オブジェクト: ${memoryLeakStorage.length}`;
  indicator.style.color = '#ef4444';

  console.log('Memory leak objects:', memoryLeakStorage.length);
}

function clearMemoryLeak() {
  memoryLeakStorage.length = 0;
  const indicator = document.getElementById('memoryIndicator');
  indicator.textContent = '蓄積オブジェクト: 0 (クリア済み)';
  indicator.style.color = '#22c55e';
}

// =============================================================================
// 5. 頻繁なタイマー
// =============================================================================
let frequentTimerId = null;
let timerCount = 0;

function startFrequentTimer() {
  if (frequentTimerId) return;

  const indicator = document.getElementById('timerIndicator');
  timerCount = 0;

  // 1ms ごとに重い処理を実行（パフォーマンスに悪影響）
  frequentTimerId = setInterval(() => {
    timerCount++;

    // 毎回少し重い処理
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += Math.random();
    }

    indicator.textContent = `タイマー: 実行中 (${timerCount}回)`;
    indicator.style.color = '#ef4444';
  }, 1); // 1ms 間隔
}

function stopFrequentTimer() {
  if (frequentTimerId) {
    clearInterval(frequentTimerId);
    frequentTimerId = null;

    const indicator = document.getElementById('timerIndicator');
    indicator.textContent = `タイマー: 停止 (合計${timerCount}回実行)`;
    indicator.style.color = '#22c55e';
  }
}

// =============================================================================
// 6 & 7. CSS アニメーション
// =============================================================================
function toggleHeavyAnimation() {
  const box = document.getElementById('heavyBox');
  box.classList.toggle('animating');
}

function toggleLightAnimation() {
  const box = document.getElementById('lightBox');
  box.classList.toggle('animating');
}

// =============================================================================
// 8. 複雑な CSS セレクタ
// =============================================================================
function addComplexElements() {
  const container = document.getElementById('complexContainer');
  container.innerHTML = '';

  // 深くネストした要素を作成
  for (let i = 0; i < 100; i++) {
    const html = `
      <div class="level-1" data-complex="true">
        <div class="level-2">
          <div class="level-3">
            <div class="level-4">
              <div class="level-5">
                <span class="target">Item ${i}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  }

  // スタイル再計算を強制
  console.time('Complex Selector Recalc');
  container.offsetHeight; // Force layout
  console.timeEnd('Complex Selector Recalc');
}

function clearComplexElements() {
  document.getElementById('complexContainer').innerHTML = '';
}

// =============================================================================
// 9. 重いエフェクト (Box Shadow / Filter)
// =============================================================================
function toggleHeavyEffects() {
  const container = document.getElementById('effectsContainer');
  container.classList.toggle('heavy-effects');
}

// =============================================================================
// 10. 強制リフロー
// =============================================================================
function forceReflow() {
  const box = document.querySelector('.reflow-box');

  console.time('Force Reflow 100x');

  for (let i = 0; i < 100; i++) {
    // スタイルを変更
    box.style.width = (200 + i) + 'px';

    // offsetHeight を読み取ると強制的にレイアウトが発生
    const height = box.offsetHeight;

    // また変更
    box.style.padding = (20 + (i % 10)) + 'px';

    // また読み取り
    const width = box.offsetWidth;
  }

  // 元に戻す
  box.style.width = '200px';
  box.style.padding = '20px';

  console.timeEnd('Force Reflow 100x');
}

// =============================================================================
// 11. スクロールイベント問題
// =============================================================================
let heavyScrollHandler = null;

function toggleScrollHandler() {
  const container = document.getElementById('scrollContainer');
  const indicator = document.getElementById('scrollIndicator');

  if (heavyScrollHandler) {
    container.removeEventListener('scroll', heavyScrollHandler);
    heavyScrollHandler = null;
    indicator.textContent = 'スクロールハンドラ: OFF';
    indicator.style.color = '#22c55e';
  } else {
    heavyScrollHandler = function (e) {
      // スクロールイベントで重い処理（悪い例）
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i);
      }

      // DOM 操作も追加
      const content = container.querySelector('.scroll-content');
      content.style.transform = `translateY(${Math.sin(sum) * 0.001}px)`;
    };

    container.addEventListener('scroll', heavyScrollHandler);
    indicator.textContent = 'スクロールハンドラ: ON (重い処理)';
    indicator.style.color = '#ef4444';
  }
}

// =============================================================================
// 12. 総合ストレステスト
// =============================================================================
let stressTestRunning = false;
let stressIntervalId = null;

function runStressTest() {
  if (stressTestRunning) return;
  stressTestRunning = true;

  const container = document.getElementById('stressContainer');
  container.innerHTML = '';

  // 大量の要素を作成
  for (let i = 0; i < 200; i++) {
    const el = document.createElement('div');
    el.className = 'stress-element';
    container.appendChild(el);
  }

  const elements = container.querySelectorAll('.stress-element');

  // 複数の問題を同時に発生
  stressIntervalId = setInterval(() => {
    // Layout Thrashing
    elements.forEach((el, i) => {
      const width = el.offsetWidth;
      el.style.width = (25 + Math.sin(Date.now() / 100 + i) * 5) + 'px';
      const height = el.offsetHeight;
      el.style.height = (25 + Math.cos(Date.now() / 100 + i) * 5) + 'px';
    });

    // 重い計算
    let sum = 0;
    for (let i = 0; i < 50000; i++) {
      sum += Math.sqrt(i) * Math.random();
    }
  }, 16); // 約60fps

  // メモリも消費
  for (let i = 0; i < 100; i++) {
    memoryLeakStorage.push({
      stress: true,
      data: new Array(1000).fill(Math.random())
    });
  }
}

function stopStressTest() {
  stressTestRunning = false;

  if (stressIntervalId) {
    clearInterval(stressIntervalId);
    stressIntervalId = null;
  }

  const container = document.getElementById('stressContainer');
  container.innerHTML = '<span style="color: #22c55e;">ストレステスト停止</span>';

  // メモリクリア
  memoryLeakStorage.length = 0;
}

// =============================================================================
// ページ離脱時のクリーンアップ
// =============================================================================
window.addEventListener('beforeunload', () => {
  stopFrequentTimer();
  stopStressTest();
});

// =============================================================================
// 初期化メッセージ
// =============================================================================
console.log('%c🔍 Chrome Performance Tab 学習サンプル', 'font-size: 20px; font-weight: bold; color: #00d4ff;');
console.log('%c使い方:', 'font-size: 14px; font-weight: bold; color: #8b5cf6;');
console.log('1. F12 で DevTools を開く');
console.log('2. Performance タブを選択');
console.log('3. ⚫ ボタンでレコーディング開始');
console.log('4. 各ボタンをクリックして問題を発生させる');
console.log('5. ⬛ ボタンで停止して結果を分析');

// =============================================================================
// 13. 大量イベントリスナー
// =============================================================================
let listenerClickCount = 0;

function addManyListeners() {
  const container = document.getElementById('listenerContainer');
  const indicator = document.getElementById('listenerIndicator');
  container.innerHTML = '';
  listenerClickCount = 0;

  console.time('Add 1000 Individual Listeners');

  // 1000個の要素を作成し、それぞれにリスナーを追加（悪い例）
  for (let i = 0; i < 1000; i++) {
    const item = document.createElement('div');
    item.className = 'listener-item';
    item.textContent = i;
    item.addEventListener('click', function() {
      listenerClickCount++;
      indicator.textContent = `クリック回数: ${listenerClickCount} (個別リスナー)`;
    });
    container.appendChild(item);
  }

  console.timeEnd('Add 1000 Individual Listeners');
  indicator.textContent = '1000個の個別リスナーを追加しました。要素をクリックしてみてください。';
  indicator.style.color = '#ef4444';
}

function addDelegatedListener() {
  const container = document.getElementById('listenerContainer');
  const indicator = document.getElementById('listenerIndicator');
  container.innerHTML = '';
  listenerClickCount = 0;

  console.time('Add Delegated Listener');

  // 1000個の要素を作成
  for (let i = 0; i < 1000; i++) {
    const item = document.createElement('div');
    item.className = 'listener-item';
    item.textContent = i;
    container.appendChild(item);
  }

  // 親要素に1つのリスナーのみ追加（良い例）
  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('listener-item')) {
      listenerClickCount++;
      indicator.textContent = `クリック回数: ${listenerClickCount} (イベントデリゲーション)`;
    }
  });

  console.timeEnd('Add Delegated Listener');
  indicator.textContent = 'イベントデリゲーションで1つのリスナーを追加しました。要素をクリックしてみてください。';
  indicator.style.color = '#22c55e';
}

function clearListenerDemo() {
  document.getElementById('listenerContainer').innerHTML = '';
  document.getElementById('listenerIndicator').textContent = '';
}

// =============================================================================
// 14. Debounce / Throttle 比較
// =============================================================================
let normalCount = 0;
let debounceCount = 0;
let throttleCount = 0;

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 初期化時にイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
  const inputNormal = document.getElementById('inputNormal');
  const inputDebounce = document.getElementById('inputDebounce');
  const inputThrottle = document.getElementById('inputThrottle');

  if (inputNormal) {
    inputNormal.addEventListener('input', function() {
      normalCount++;
      document.getElementById('counterNormal').textContent = normalCount + '回';
    });
  }

  if (inputDebounce) {
    inputDebounce.addEventListener('input', debounce(function() {
      debounceCount++;
      document.getElementById('counterDebounce').textContent = debounceCount + '回';
    }, 300));
  }

  if (inputThrottle) {
    inputThrottle.addEventListener('input', throttle(function() {
      throttleCount++;
      document.getElementById('counterThrottle').textContent = throttleCount + '回';
    }, 100));
  }
});

function resetInputCounters() {
  normalCount = 0;
  debounceCount = 0;
  throttleCount = 0;
  document.getElementById('counterNormal').textContent = '0回';
  document.getElementById('counterDebounce').textContent = '0回';
  document.getElementById('counterThrottle').textContent = '0回';
  document.getElementById('inputNormal').value = '';
  document.getElementById('inputDebounce').value = '';
  document.getElementById('inputThrottle').value = '';
}

// =============================================================================
// 15. JSON.parse 大量データ
// =============================================================================
function parseHugeJSON() {
  const indicator = document.getElementById('jsonIndicator');
  indicator.textContent = '巨大JSONを生成中...';
  indicator.style.color = '#fbbf24';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // 約10MBのJSONを生成
      const items = [];
      for (let i = 0; i < 100000; i++) {
        items.push({
          id: i,
          name: `Item ${i}`,
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          values: [Math.random(), Math.random(), Math.random()],
          nested: { a: 1, b: 2, c: 3 }
        });
      }
      const jsonString = JSON.stringify(items);

      indicator.textContent = `JSON生成完了 (${(jsonString.length / 1024 / 1024).toFixed(2)}MB)。パース開始...`;

      requestAnimationFrame(() => {
        const startTime = performance.now();
        const parsed = JSON.parse(jsonString);
        const endTime = performance.now();

        indicator.textContent = `パース完了! 時間: ${(endTime - startTime).toFixed(2)}ms, 要素数: ${parsed.length}`;
        indicator.style.color = '#22c55e';
      });
    });
  });
}

function parseJSONStreaming() {
  const indicator = document.getElementById('jsonIndicator');
  indicator.textContent = 'ストリーミング風パース開始...';
  indicator.style.color = '#fbbf24';

  // 分割してパース（疑似ストリーミング）
  const chunks = [];
  let processedCount = 0;
  const totalChunks = 100;

  function processChunk() {
    const items = [];
    for (let i = 0; i < 1000; i++) {
      items.push({
        id: processedCount * 1000 + i,
        name: `Item ${processedCount * 1000 + i}`,
        description: 'Lorem ipsum dolor sit amet.',
        values: [Math.random(), Math.random()]
      });
    }
    chunks.push(items);
    processedCount++;

    indicator.textContent = `処理中... ${processedCount}/${totalChunks} チャンク`;

    if (processedCount < totalChunks) {
      setTimeout(processChunk, 0); // 次のチャンクを非同期で処理
    } else {
      const totalItems = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      indicator.textContent = `完了! ${totalItems}要素を${totalChunks}チャンクで処理 (UIがブロックされにくい)`;
      indicator.style.color = '#22c55e';
    }
  }

  processChunk();
}

// =============================================================================
// 16. 正規表現の暴走 (ReDoS)
// =============================================================================
function runSafeRegex() {
  const indicator = document.getElementById('regexIndicator');
  const input = 'a'.repeat(30);

  indicator.textContent = '安全な正規表現を実行中...';
  indicator.style.color = '#fbbf24';

  requestAnimationFrame(() => {
    const startTime = performance.now();
    const result = /^a+$/.test(input); // 安全なパターン
    const endTime = performance.now();

    indicator.textContent = `完了! 時間: ${(endTime - startTime).toFixed(4)}ms, 結果: ${result}`;
    indicator.style.color = '#22c55e';
  });
}

function runDangerousRegex() {
  const indicator = document.getElementById('regexIndicator');
  // 注意: 文字数を増やすと指数的に遅くなる
  const input = 'a'.repeat(25) + 'b'; // マッチしない入力

  indicator.textContent = '危険な正規表現を実行中... (フリーズする可能性があります)';
  indicator.style.color = '#ef4444';

  requestAnimationFrame(() => {
    const startTime = performance.now();
    // 危険なパターン: ネストした量指定子
    const result = /^(a+)+$/.test(input);
    const endTime = performance.now();

    indicator.textContent = `完了! 時間: ${(endTime - startTime).toFixed(2)}ms, 結果: ${result} (バックトラック発生)`;
    indicator.style.color = '#fbbf24';
  });
}

// =============================================================================
// 17. will-change の乱用
// =============================================================================
function addManyLayers() {
  const container = document.getElementById('layersContainer');
  const indicator = document.getElementById('layersIndicator');
  container.innerHTML = '';

  console.time('Create 500 Layers');

  for (let i = 0; i < 500; i++) {
    const layer = document.createElement('div');
    layer.className = 'layer-item';
    layer.style.willChange = 'transform'; // 各要素が独立したレイヤーに
    layer.textContent = i;
    container.appendChild(layer);
  }

  console.timeEnd('Create 500 Layers');
  indicator.textContent = '500個のレイヤーを生成しました。DevTools の Layers タブで確認してください。';
  indicator.style.color = '#ef4444';
}

function clearLayers() {
  document.getElementById('layersContainer').innerHTML = '';
  document.getElementById('layersIndicator').textContent = 'レイヤーをクリアしました。';
  document.getElementById('layersIndicator').style.color = '#22c55e';
}

// =============================================================================
// 18. CLS（レイアウトシフト）
// =============================================================================
function demonstrateCLS() {
  const placeholder = document.getElementById('clsPlaceholder');
  placeholder.innerHTML = '';
  placeholder.style.height = 'auto';
  placeholder.style.minHeight = '0';

  // 遅延後に画像（のダミー）を挿入してシフトを発生
  setTimeout(() => {
    const img = document.createElement('div');
    img.className = 'cls-fake-image';
    img.textContent = '突然挿入された画像 (150px)';
    img.style.height = '150px';
    img.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.style.borderRadius = '8px';
    img.style.color = 'white';
    img.style.fontWeight = 'bold';
    placeholder.appendChild(img);
  }, 1000);
}

function demonstrateCLSFixed() {
  const placeholder = document.getElementById('clsPlaceholder');
  placeholder.innerHTML = '';

  // 事前にスペースを確保
  placeholder.style.height = '150px';
  placeholder.style.minHeight = '150px';
  placeholder.style.background = 'rgba(255,255,255,0.1)';
  placeholder.style.display = 'flex';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.textContent = '読み込み中...';

  setTimeout(() => {
    placeholder.textContent = '';
    placeholder.style.background = 'none';
    const img = document.createElement('div');
    img.className = 'cls-fake-image';
    img.textContent = '画像読み込み完了 (スペース確保済み)';
    img.style.height = '150px';
    img.style.width = '100%';
    img.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.style.borderRadius = '8px';
    img.style.color = 'white';
    img.style.fontWeight = 'bold';
    placeholder.appendChild(img);
  }, 1000);
}

function resetCLSDemo() {
  const placeholder = document.getElementById('clsPlaceholder');
  placeholder.innerHTML = '';
  placeholder.style.height = 'auto';
  placeholder.style.minHeight = '0';
  placeholder.style.background = 'none';
}

// =============================================================================
// 19. contain プロパティ
// =============================================================================
let containEnabled = false;

function toggleContain() {
  const box = document.getElementById('containBox');
  const inner = document.getElementById('containInner');
  containEnabled = !containEnabled;

  if (containEnabled) {
    box.style.contain = 'layout paint';
    inner.innerHTML = 'contain: layout paint<br>更新が内部に限定';
    inner.style.background = 'rgba(34, 197, 94, 0.3)';
  } else {
    box.style.contain = 'none';
    inner.innerHTML = 'contain: none<br>更新時に外部も再描画';
    inner.style.background = 'rgba(239, 68, 68, 0.3)';
  }
}

function triggerContainUpdate() {
  const inner = document.getElementById('containInner');
  // 内部要素のサイズを変更
  const currentPadding = parseInt(getComputedStyle(inner).padding) || 20;
  inner.style.padding = (currentPadding === 20 ? 40 : 20) + 'px';
}

// =============================================================================
// 20. レンダーブロッキング
// =============================================================================
function showBlockingDemo() {
  const demo = document.getElementById('blockingDemo');
  demo.style.display = demo.style.display === 'none' ? 'block' : 'none';
}

// =============================================================================
// 21. 画像の遅延読み込み
// =============================================================================
function loadImagesEager() {
  const container = document.getElementById('imageDemoContainer');
  const indicator = document.getElementById('imageIndicator');
  container.innerHTML = '';
  indicator.textContent = '即時読み込み中...';

  // 10枚の画像を即時読み込み
  for (let i = 0; i < 10; i++) {
    const img = document.createElement('div');
    img.className = 'demo-image';
    img.style.background = `hsl(${i * 36}, 70%, 50%)`;
    img.textContent = `Image ${i + 1} (即時)`;
    container.appendChild(img);
  }

  indicator.textContent = '全10枚を即時読み込みしました（実際の画像ではダウンロードが発生）';
  indicator.style.color = '#ef4444';
}

function loadImagesLazy() {
  const container = document.getElementById('imageDemoContainer');
  const indicator = document.getElementById('imageIndicator');
  container.innerHTML = '';
  indicator.textContent = '遅延読み込み設定中...';

  // 10枚の画像を遅延読み込み
  for (let i = 0; i < 10; i++) {
    const img = document.createElement('div');
    img.className = 'demo-image lazy';
    img.dataset.index = i;
    img.textContent = `Image ${i + 1} (遅延)`;
    img.style.background = '#333';
    container.appendChild(img);
  }

  // Intersection Observer で遅延読み込み
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const index = parseInt(img.dataset.index);
        // 読み込みをシミュレート
        setTimeout(() => {
          img.style.background = `hsl(${index * 36}, 70%, 50%)`;
          img.classList.remove('lazy');
        }, 300);
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('.demo-image.lazy').forEach(img => observer.observe(img));

  indicator.textContent = 'スクロールすると画像が読み込まれます（Intersection Observer使用）';
  indicator.style.color = '#22c55e';
}

function clearImageDemo() {
  document.getElementById('imageDemoContainer').innerHTML = '';
  document.getElementById('imageIndicator').textContent = '';
}

// =============================================================================
// 22. Web Font 読み込み
// =============================================================================
function loadFontBlocking() {
  const sample = document.getElementById('fontSample');
  sample.style.fontFamily = 'serif';
  sample.style.visibility = 'hidden'; // FOIT シミュレート

  setTimeout(() => {
    sample.style.fontFamily = 'Georgia, serif';
    sample.style.visibility = 'visible';
    sample.style.color = '#ef4444';
  }, 2000);
}

function loadFontOptimal() {
  const sample = document.getElementById('fontSample');
  sample.style.fontFamily = 'sans-serif'; // すぐに代替フォントで表示

  setTimeout(() => {
    sample.style.fontFamily = 'Georgia, serif'; // FOUT: 後からフォント切り替え
    sample.style.color = '#22c55e';
  }, 1000);
}

function resetFontDemo() {
  const sample = document.getElementById('fontSample');
  sample.style.fontFamily = 'inherit';
  sample.style.visibility = 'visible';
  sample.style.color = 'inherit';
}

// =============================================================================
// 23. Canvas 描画
// =============================================================================
let canvasAnimationId = null;
let canvasMode = 'stopped';

function startCanvasBad() {
  stopCanvas();
  canvasMode = 'bad';
  const canvas = document.getElementById('perfCanvas');
  const ctx = canvas.getContext('2d');
  const indicator = document.getElementById('canvasIndicator');

  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;
  let x = 0;

  function render() {
    const now = performance.now();
    frameCount++;

    if (now - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = now;
    }

    // 非効率: 毎フレーム全体をクリアして複雑な図形を再描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景を毎回描画（非効率）
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.sin(i * 0.5) * 150 + 200,
        Math.cos(i * 0.3) * 80 + 100,
        10 + Math.sin(now / 500 + i) * 5,
        0, Math.PI * 2
      );
      ctx.fillStyle = `hsl(${i * 7}, 70%, 50%)`;
      ctx.fill();
    }

    // 動くオブジェクト
    x = (x + 2) % canvas.width;
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(x, 80, 40, 40);

    indicator.textContent = `FPS: ${fps} (非効率な描画)`;
    indicator.style.color = '#ef4444';

    canvasAnimationId = requestAnimationFrame(render);
  }

  render();
}

function startCanvasGood() {
  stopCanvas();
  canvasMode = 'good';
  const canvas = document.getElementById('perfCanvas');
  const ctx = canvas.getContext('2d');
  const indicator = document.getElementById('canvasIndicator');

  // オフスクリーンCanvasで静的部分をキャッシュ
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const offCtx = offscreen.getContext('2d');

  // 背景を一度だけ描画
  for (let i = 0; i < 50; i++) {
    offCtx.beginPath();
    offCtx.arc(
      Math.sin(i * 0.5) * 150 + 200,
      Math.cos(i * 0.3) * 80 + 100,
      10,
      0, Math.PI * 2
    );
    offCtx.fillStyle = `hsl(${i * 7}, 70%, 50%)`;
    offCtx.fill();
  }

  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;
  let x = 0;

  function render() {
    const now = performance.now();
    frameCount++;

    if (now - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = now;
    }

    // 効率的: キャッシュした背景を転送
    ctx.drawImage(offscreen, 0, 0);

    // 動くオブジェクトのみ描画
    x = (x + 2) % canvas.width;
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(x, 80, 40, 40);

    indicator.textContent = `FPS: ${fps} (効率的な描画)`;
    indicator.style.color = '#22c55e';

    canvasAnimationId = requestAnimationFrame(render);
  }

  render();
}

function stopCanvas() {
  if (canvasAnimationId) {
    cancelAnimationFrame(canvasAnimationId);
    canvasAnimationId = null;
  }
  canvasMode = 'stopped';
  const canvas = document.getElementById('perfCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('canvasIndicator').textContent = 'FPS: -- (停止中)';
}

// =============================================================================
// 24. 大量パーティクル
// =============================================================================
let particleAnimationId = null;
let particles = [];

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.size = Math.random() * 4 + 2;
    this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function startParticles(count) {
  stopParticles();

  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  const indicator = document.getElementById('particleIndicator');

  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(canvas));
  }

  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  function render() {
    const now = performance.now();
    frameCount++;

    if (now - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = now;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });

    indicator.textContent = `パーティクル: ${particles.length} | FPS: ${fps}`;
    indicator.style.color = fps < 30 ? '#ef4444' : fps < 50 ? '#fbbf24' : '#22c55e';

    particleAnimationId = requestAnimationFrame(render);
  }

  render();
}

function stopParticles() {
  if (particleAnimationId) {
    cancelAnimationFrame(particleAnimationId);
    particleAnimationId = null;
  }
  particles = [];
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('particleIndicator').textContent = 'パーティクル: 0 | FPS: --';
}

// =============================================================================
// クリーンアップ（更新）
// =============================================================================
window.addEventListener('beforeunload', () => {
  stopFrequentTimer();
  stopStressTest();
  stopCanvas();
  stopParticles();
});
