/**
 * ========================================
 * OpenTelemetry Metrics（メトリクス）デモ
 * ========================================
 *
 * 【Metricsとは】
 * システムの状態を数値で測定・集計する仕組み。
 * リアルタイムのパフォーマンス監視やアラートに使用。
 *
 * 【主要な概念】
 *
 * 1. Meter
 *    - メトリクスを作成するためのファクトリ
 *    - アプリケーションやライブラリごとに作成
 *
 * 2. Instrument（計器）の種類
 *    - Counter: 累積的に増加する値（リクエスト数、エラー数など）
 *    - UpDownCounter: 増減する値（アクティブ接続数など）
 *    - Gauge: 現在の値を記録（温度、メモリ使用量など）
 *    - Histogram: 値の分布を記録（レスポンス時間など）
 *
 * 3. Aggregation（集計）
 *    - Sum: 合計値
 *    - Last Value: 最新値
 *    - Histogram: バケットごとの分布
 *
 * 4. Attributes（属性）
 *    - メトリクスにラベルを付ける（http.method, status_code など）
 *    - 同じメトリクスを異なる次元で分析可能
 *
 * 【データフォーマット（OTLP）】
 * {
 *   "resourceMetrics": [{
 *     "resource": { "attributes": [...] },
 *     "scopeMetrics": [{
 *       "scope": { "name": "...", "version": "..." },
 *       "metrics": [{
 *         "name": "http.requests.total",
 *         "description": "Total number of HTTP requests",
 *         "unit": "1",
 *         "sum": {  // or gauge, histogram
 *           "dataPoints": [{
 *             "attributes": [{ "key": "method", "value": { "stringValue": "GET" } }],
 *             "startTimeUnixNano": "...",
 *             "timeUnixNano": "...",
 *             "asInt": "123"
 *           }],
 *           "aggregationTemporality": 2,  // CUMULATIVE=2, DELTA=1
 *           "isMonotonic": true
 *         }
 *       }]
 *     }]
 *   }]
 * }
 */

import { metrics, ValueType } from '@opentelemetry/api';
import { setupDevelopment } from '../instrumentation/setup';

// SDKを初期化
const sdk = setupDevelopment('metrics-demo');

// Meterを取得
const meter = metrics.getMeter('metrics-demo', '1.0.0');

// ============================================================
// メトリクスの定義
// ============================================================

/**
 * 1. Counter（カウンター）
 * - 累積的に増加のみする値
 * - リクエスト数、エラー数、処理済みアイテム数など
 * - add() で増加（負の値は不可）
 */
const requestCounter = meter.createCounter('http.requests.total', {
  description: 'HTTPリクエストの総数',
  unit: '1',  // 単位なし（カウント）
});

const errorCounter = meter.createCounter('errors.total', {
  description: 'エラーの総数',
  unit: '1',
});

/**
 * 2. UpDownCounter（アップダウンカウンター）
 * - 増加も減少もする値
 * - アクティブ接続数、キュー内のアイテム数など
 * - add() で増加/減少（正負どちらも可）
 */
const activeConnections = meter.createUpDownCounter('connections.active', {
  description: 'アクティブな接続数',
  unit: '1',
});

const queueSize = meter.createUpDownCounter('queue.size', {
  description: 'キュー内のアイテム数',
  unit: '1',
});

/**
 * 3. Histogram（ヒストグラム）
 * - 値の分布を記録
 * - レスポンス時間、リクエストサイズなど
 * - record() で値を記録
 * - バケット境界で分布を集計
 */
const responseTime = meter.createHistogram('http.response.duration', {
  description: 'HTTPレスポンスの所要時間',
  unit: 'ms',
  // デフォルトのバケット境界を使用
  // または advice: { explicitBucketBoundaries: [0, 10, 50, 100, 500, 1000] }
});

const requestSize = meter.createHistogram('http.request.size', {
  description: 'HTTPリクエストのサイズ',
  unit: 'bytes',
});

/**
 * 4. Observable Gauge（観測可能ゲージ）
 * - 定期的にコールバックで現在値を取得
 * - CPU使用率、メモリ使用量、温度など
 * - システムメトリクスに適している
 */
let currentMemoryUsage = 0;
let currentCpuUsage = 0;

const memoryGauge = meter.createObservableGauge('system.memory.usage', {
  description: 'メモリ使用量',
  unit: 'bytes',
});

memoryGauge.addCallback((result) => {
  result.observe(currentMemoryUsage, { 'memory.type': 'heap' });
});

const cpuGauge = meter.createObservableGauge('system.cpu.usage', {
  description: 'CPU使用率',
  unit: '%',
});

cpuGauge.addCallback((result) => {
  result.observe(currentCpuUsage, { 'cpu.core': 'all' });
});

/**
 * 5. Observable Counter（観測可能カウンター）
 * - 外部システムの累積値を定期的に取得
 */
let totalBytesReceived = 0;

const bytesReceivedCounter = meter.createObservableCounter('network.bytes.received', {
  description: '受信した総バイト数',
  unit: 'bytes',
});

bytesReceivedCounter.addCallback((result) => {
  result.observe(totalBytesReceived, { 'interface': 'eth0' });
});

// ============================================================
// デモ関数
// ============================================================

/**
 * Counterのデモ
 */
async function counterDemo(): Promise<void> {
  console.log('\n📊 Counter（カウンター）デモ\n');
  console.log('Counterは累積的に増加する値を記録します。\n');

  // 属性付きでカウントアップ
  requestCounter.add(1, {
    'http.method': 'GET',
    'http.route': '/api/users',
    'http.status_code': 200,
  });
  console.log('GET /api/users -> 200 : +1');

  requestCounter.add(1, {
    'http.method': 'POST',
    'http.route': '/api/users',
    'http.status_code': 201,
  });
  console.log('POST /api/users -> 201 : +1');

  requestCounter.add(1, {
    'http.method': 'GET',
    'http.route': '/api/users',
    'http.status_code': 200,
  });
  console.log('GET /api/users -> 200 : +1');

  // エラーをカウント
  errorCounter.add(1, {
    'error.type': 'ValidationError',
    'http.route': '/api/orders',
  });
  console.log('ValidationError at /api/orders : +1');

  console.log('\n→ メトリクスは定期的にエクスポートされます（5秒ごと）');
}

/**
 * UpDownCounterのデモ
 */
async function upDownCounterDemo(): Promise<void> {
  console.log('\n📊 UpDownCounter（アップダウンカウンター）デモ\n');
  console.log('UpDownCounterは増減する値を記録します。\n');

  // 接続を追加
  activeConnections.add(1, { 'client.type': 'web' });
  console.log('Web接続追加: +1');

  activeConnections.add(1, { 'client.type': 'mobile' });
  console.log('Mobile接続追加: +1');

  activeConnections.add(1, { 'client.type': 'web' });
  console.log('Web接続追加: +1');

  // 接続を削除（負の値）
  activeConnections.add(-1, { 'client.type': 'web' });
  console.log('Web接続削除: -1');

  // キュー操作
  queueSize.add(5, { 'queue.name': 'email' });
  console.log('Emailキューに5件追加');

  queueSize.add(-2, { 'queue.name': 'email' });
  console.log('Emailキューから2件処理');
}

/**
 * Histogramのデモ
 */
async function histogramDemo(): Promise<void> {
  console.log('\n📊 Histogram（ヒストグラム）デモ\n');
  console.log('Histogramは値の分布を記録します。\n');

  // レスポンス時間を記録
  const times = [15, 23, 45, 12, 89, 156, 34, 67, 21, 43];

  for (const time of times) {
    responseTime.record(time, {
      'http.method': 'GET',
      'http.route': '/api/products',
    });
    console.log(`レスポンス時間: ${time}ms`);
  }

  // リクエストサイズを記録
  const sizes = [1024, 2048, 512, 4096, 768];

  for (const size of sizes) {
    requestSize.record(size, {
      'http.method': 'POST',
      'content.type': 'application/json',
    });
    console.log(`リクエストサイズ: ${size} bytes`);
  }

  console.log('\n→ Histogramはバケット（区間）ごとに値を集計します');
  console.log('   例: 0-10ms: 0件, 10-50ms: 6件, 50-100ms: 2件, 100ms+: 2件');
}

/**
 * Observable Gaugeのデモ
 */
async function observableGaugeDemo(): Promise<void> {
  console.log('\n📊 Observable Gauge（観測可能ゲージ）デモ\n');
  console.log('Observable Gaugeは定期的に現在値をコールバックで取得します。\n');

  // シミュレートされたシステムメトリクス
  const memoryValues = [1024 * 1024 * 100, 1024 * 1024 * 150, 1024 * 1024 * 120];
  const cpuValues = [25.5, 45.2, 32.8];

  for (let i = 0; i < 3; i++) {
    currentMemoryUsage = memoryValues[i];
    currentCpuUsage = cpuValues[i];
    totalBytesReceived += 1024 * 100 * (i + 1);

    console.log(`更新 ${i + 1}:`);
    console.log(`  メモリ使用量: ${(currentMemoryUsage / 1024 / 1024).toFixed(0)} MB`);
    console.log(`  CPU使用率: ${currentCpuUsage}%`);
    console.log(`  受信バイト数: ${totalBytesReceived} bytes`);

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n→ Observable系はメトリクス収集時にコールバックが呼ばれます');
}

/**
 * 属性（Attributes）の重要性デモ
 */
async function attributesImportanceDemo(): Promise<void> {
  console.log('\n📊 属性（Attributes）の重要性デモ\n');
  console.log('属性を使うと、同じメトリクスを異なる次元で分析できます。\n');

  // 同じメトリクス名だが、異なる属性で区別
  const endpoints = [
    { method: 'GET', route: '/api/users', status: 200 },
    { method: 'GET', route: '/api/users', status: 200 },
    { method: 'POST', route: '/api/users', status: 201 },
    { method: 'GET', route: '/api/products', status: 200 },
    { method: 'GET', route: '/api/users', status: 404 },
    { method: 'DELETE', route: '/api/users/123', status: 204 },
  ];

  for (const ep of endpoints) {
    requestCounter.add(1, {
      'http.method': ep.method,
      'http.route': ep.route,
      'http.status_code': ep.status,
    });
    console.log(`${ep.method} ${ep.route} -> ${ep.status}`);
  }

  console.log('\n→ 属性により以下の分析が可能:');
  console.log('   - メソッド別リクエスト数 (GET: 4, POST: 1, DELETE: 1)');
  console.log('   - エンドポイント別リクエスト数 (/api/users: 5, /api/products: 1)');
  console.log('   - ステータスコード別リクエスト数 (200: 3, 201: 1, ...)');
  console.log('   - メソッド×ステータスの組み合わせ分析');
}

/**
 * メイン実行
 */
async function main(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        OpenTelemetry Metrics（メトリクス）デモ             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n【メトリクスの種類まとめ】');
  console.log('┌─────────────────┬──────────────────────────────────────┐');
  console.log('│ Counter         │ 累積増加のみ（リクエスト数等）       │');
  console.log('│ UpDownCounter   │ 増減可能（アクティブ接続数等）       │');
  console.log('│ Histogram       │ 値の分布（レスポンス時間等）         │');
  console.log('│ ObservableGauge │ コールバックで現在値取得（CPU等）    │');
  console.log('└─────────────────┴──────────────────────────────────────┘');

  try {
    await counterDemo();
    await upDownCounterDemo();
    await histogramDemo();
    await observableGaugeDemo();
    await attributesImportanceDemo();

    console.log('\n✅ 全てのデモが完了しました！\n');
    console.log('【出力の見方】');
    console.log('- name: メトリクス名');
    console.log('- description: 説明');
    console.log('- unit: 単位（ms, bytes, 1など）');
    console.log('- dataPoints: データポイント（値と属性）');
    console.log('- aggregationTemporality: 集計方法（CUMULATIVE/DELTA）');

    // メトリクスがエクスポートされるのを待つ
    console.log('\n⏳ メトリクスのエクスポートを待機中（5秒）...');
    await new Promise(resolve => setTimeout(resolve, 6000));
  } finally {
    await sdk.shutdown();
    console.log('\n👋 SDK シャットダウン完了');
  }
}

main().catch(console.error);
