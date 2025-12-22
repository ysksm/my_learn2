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
