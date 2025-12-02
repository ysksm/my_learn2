/**
 * ========================================
 * OpenTelemetry Traces（トレース）デモ
 * ========================================
 *
 * 【Tracesとは】
 * 分散システムにおけるリクエストの流れを追跡する仕組み。
 * 1つのリクエストが複数のサービスを通過する際の経路と所要時間を可視化。
 *
 * 【主要な概念】
 *
 * 1. Trace（トレース）
 *    - 1つのリクエストの全体的な流れ
 *    - 複数のSpanで構成される
 *    - 一意のTrace IDで識別される
 *
 * 2. Span（スパン）
 *    - 処理の1単位（関数呼び出し、DBクエリ、HTTP リクエストなど）
 *    - 開始時刻、終了時刻、属性、イベント、ステータスを持つ
 *    - 親子関係を持つことができる（ネスト構造）
 *
 * 3. SpanContext
 *    - Spanを一意に識別する情報（Trace ID, Span ID, Trace Flags）
 *    - サービス間でコンテキストを伝播するために使用
 *
 * 4. Attributes（属性）
 *    - Spanに付加するキーバリューペアのメタデータ
 *    - 例: user.id, http.method, db.statement
 *
 * 5. Events（イベント）
 *    - Span内で発生したタイムスタンプ付きのイベント
 *    - 例: 例外発生、キャッシュヒット
 *
 * 6. Status（ステータス）
 *    - Spanの結果を表す（OK, ERROR）
 *
 * 【データフォーマット（OTLP）】
 * {
 *   "resourceSpans": [{
 *     "resource": { "attributes": [...] },
 *     "scopeSpans": [{
 *       "scope": { "name": "...", "version": "..." },
 *       "spans": [{
 *         "traceId": "abc123...",
 *         "spanId": "def456...",
 *         "parentSpanId": "...",
 *         "name": "HTTP GET /api/users",
 *         "kind": 1,  // INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER
 *         "startTimeUnixNano": "...",
 *         "endTimeUnixNano": "...",
 *         "attributes": [{ "key": "...", "value": {...} }],
 *         "events": [...],
 *         "status": { "code": 1 }  // OK=1, ERROR=2
 *       }]
 *     }]
 *   }]
 * }
 */

import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';
import { setupDevelopment } from '../instrumentation/setup';

// SDKを初期化（コンソール出力モード）
const sdk = setupDevelopment('traces-demo');

// Tracerを取得
// Tracerはアプリケーションやライブラリごとに作成する
const tracer = trace.getTracer('traces-demo', '1.0.0');

/**
 * 基本的なSpanの作成
 */
async function basicSpanDemo(): Promise<void> {
  console.log('\n📍 基本的なSpanの作成デモ\n');

  // 最もシンプルなSpan
  const span = tracer.startSpan('basic-operation');

  // 何らかの処理
  await simulateWork(100);

  // Spanを終了（必須！）
  span.end();
}

/**
 * 属性（Attributes）の追加
 */
async function attributesDemo(): Promise<void> {
  console.log('\n📍 属性（Attributes）デモ\n');

  const span = tracer.startSpan('user-lookup', {
    // Spanの種類を指定
    kind: SpanKind.INTERNAL,  // 内部処理
    // 属性を最初から設定
    attributes: {
      'user.id': 12345,
      'user.email': 'example@test.com',
    }
  });

  // 後から属性を追加することも可能
  span.setAttribute('user.role', 'admin');
  span.setAttributes({
    'cache.hit': true,
    'cache.key': 'user:12345',
  });

  await simulateWork(50);
  span.end();
}

/**
 * イベント（Events）の追加
 */
async function eventsDemo(): Promise<void> {
  console.log('\n📍 イベント（Events）デモ\n');

  const span = tracer.startSpan('data-processing');

  // イベントを追加（タイムスタンプ付きのログのようなもの）
  span.addEvent('processing-started', {
    'items.count': 100,
  });

  await simulateWork(100);

  span.addEvent('validation-completed', {
    'valid.count': 95,
    'invalid.count': 5,
  });

  await simulateWork(50);

  span.addEvent('processing-finished');
  span.end();
}

/**
 * 親子関係（ネスト）のあるSpan
 */
async function nestedSpansDemo(): Promise<void> {
  console.log('\n📍 ネストされたSpan（親子関係）デモ\n');

  // 親Span
  const parentSpan = tracer.startSpan('http-request', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': 'GET',
      'http.url': '/api/orders/123',
    }
  });

  // 親Spanのコンテキストを作成
  const ctx = trace.setSpan(context.active(), parentSpan);

  // コンテキストを使って子Spanを作成
  await context.with(ctx, async () => {
    // 子Span 1: 認証
    const authSpan = tracer.startSpan('authenticate-user', {
      kind: SpanKind.INTERNAL,
    });
    await simulateWork(30);
    authSpan.setAttribute('auth.method', 'jwt');
    authSpan.end();

    // 子Span 2: データベースクエリ
    const dbSpan = tracer.startSpan('database-query', {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.statement': 'SELECT * FROM orders WHERE id = $1',
      }
    });
    await simulateWork(80);
    dbSpan.end();

    // 子Span 3: レスポンス生成
    const responseSpan = tracer.startSpan('generate-response', {
      kind: SpanKind.INTERNAL,
    });
    await simulateWork(20);
    responseSpan.end();
  });

  parentSpan.setAttribute('http.status_code', 200);
  parentSpan.end();
}

/**
 * エラーハンドリング
 */
async function errorHandlingDemo(): Promise<void> {
  console.log('\n📍 エラーハンドリングデモ\n');

  const span = tracer.startSpan('risky-operation');

  try {
    await simulateWork(50);

    // エラーをシミュレート
    throw new Error('Something went wrong!');
  } catch (error) {
    // エラーを記録
    span.recordException(error as Error);
    // ステータスをエラーに設定
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
  } finally {
    span.end();
  }
}

/**
 * startActiveSpanを使った便利な方法
 */
async function activeSpanDemo(): Promise<void> {
  console.log('\n📍 startActiveSpan デモ（推奨パターン）\n');

  // startActiveSpanは自動的にコンテキストを設定し、
  // コールバック終了時にSpanを終了してくれる
  await tracer.startActiveSpan('api-call', async (span) => {
    span.setAttribute('api.endpoint', '/users');

    // ネストした呼び出しも自動的に親子関係になる
    await tracer.startActiveSpan('validate-input', async (childSpan) => {
      await simulateWork(20);
      childSpan.end();
    });

    await tracer.startActiveSpan('process-data', async (childSpan) => {
      await simulateWork(50);
      childSpan.end();
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  });
}

/**
 * SpanKindの種類デモ
 */
async function spanKindDemo(): Promise<void> {
  console.log('\n📍 SpanKind（種類）デモ\n');
  console.log('SpanKindは、Spanがどのような役割を持つかを示します:\n');

  // INTERNAL: 内部処理（デフォルト）
  const internalSpan = tracer.startSpan('internal-operation', {
    kind: SpanKind.INTERNAL,
  });
  console.log('- INTERNAL: 内部処理（関数呼び出しなど）');
  internalSpan.end();

  // SERVER: サーバー側のリクエスト処理
  const serverSpan = tracer.startSpan('http-server-handler', {
    kind: SpanKind.SERVER,
    attributes: { 'http.method': 'POST' }
  });
  console.log('- SERVER: HTTPリクエストを受信するサーバー');
  serverSpan.end();

  // CLIENT: 外部サービスへのリクエスト
  const clientSpan = tracer.startSpan('http-client-request', {
    kind: SpanKind.CLIENT,
    attributes: { 'http.url': 'https://api.example.com' }
  });
  console.log('- CLIENT: 外部APIへのHTTPリクエスト');
  clientSpan.end();

  // PRODUCER: メッセージキューへの送信
  const producerSpan = tracer.startSpan('send-message', {
    kind: SpanKind.PRODUCER,
    attributes: { 'messaging.system': 'kafka' }
  });
  console.log('- PRODUCER: メッセージキューへの送信');
  producerSpan.end();

  // CONSUMER: メッセージキューからの受信
  const consumerSpan = tracer.startSpan('receive-message', {
    kind: SpanKind.CONSUMER,
    attributes: { 'messaging.system': 'kafka' }
  });
  console.log('- CONSUMER: メッセージキューからの受信');
  consumerSpan.end();
}

/**
 * 処理をシミュレート
 */
function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * メイン実行
 */
async function main(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        OpenTelemetry Traces（トレース）デモ                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await basicSpanDemo();
    await attributesDemo();
    await eventsDemo();
    await nestedSpansDemo();
    await errorHandlingDemo();
    await activeSpanDemo();
    await spanKindDemo();

    console.log('\n✅ 全てのデモが完了しました！\n');
    console.log('【出力の見方】');
    console.log('- traceId: トレース全体を識別するID');
    console.log('- spanId: 個々のSpanを識別するID');
    console.log('- parentId: 親SpanのID（ネスト時）');
    console.log('- name: Spanの名前');
    console.log('- kind: Spanの種類');
    console.log('- attributes: 付加されたメタデータ');
    console.log('- events: Span内で発生したイベント');
    console.log('- status: 処理結果（OK/ERROR）');
  } finally {
    // SDKをシャットダウン
    setTimeout(async () => {
      await sdk.shutdown();
      console.log('\n👋 SDK シャットダウン完了');
    }, 2000);
  }
}

main().catch(console.error);
