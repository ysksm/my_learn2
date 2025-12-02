/**
 * OpenTelemetry SDK セットアップ
 *
 * このファイルでは、OpenTelemetryの3つのシグナル（Traces, Metrics, Logs）を
 * 統合的に設定します。
 *
 * 【重要】このファイルはアプリケーションの最初に読み込む必要があります。
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Traces用
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Metrics用
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

// Logs用
import { SimpleLogRecordProcessor, ConsoleLogRecordExporter, LogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

// 自動計装（オプション）
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

/**
 * OpenTelemetryの設定オプション
 */
interface OTelSetupOptions {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  // エクスポーター設定
  useConsoleExporter?: boolean;  // コンソール出力（デバッグ用）
  useOtlpExporter?: boolean;     // OTLP出力（本番用）
  otlpEndpoint?: string;         // OTLPコレクターのエンドポイント
}

/**
 * リソース情報を作成
 *
 * Resource: テレメトリデータの送信元を識別するメタデータ
 * - service.name: サービス名
 * - service.version: バージョン
 * - deployment.environment: 環境（dev/staging/prod）
 */
function createResource(options: OTelSetupOptions): Resource {
  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: options.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: options.serviceVersion || '1.0.0',
    ['deployment.environment']: options.environment || 'development',
  });
}

/**
 * OpenTelemetry SDKを初期化
 */
export function setupOpenTelemetry(options: OTelSetupOptions): NodeSDK {
  const resource = createResource(options);

  // デフォルト設定
  const useConsole = options.useConsoleExporter ?? true;
  const useOtlp = options.useOtlpExporter ?? false;
  const otlpEndpoint = options.otlpEndpoint || 'http://localhost:4318';

  console.log('='.repeat(60));
  console.log('OpenTelemetry SDK 初期化');
  console.log('='.repeat(60));
  console.log(`サービス名: ${options.serviceName}`);
  console.log(`バージョン: ${options.serviceVersion || '1.0.0'}`);
  console.log(`環境: ${options.environment || 'development'}`);
  console.log(`コンソール出力: ${useConsole}`);
  console.log(`OTLP出力: ${useOtlp}`);
  if (useOtlp) {
    console.log(`OTLPエンドポイント: ${otlpEndpoint}`);
  }
  console.log('='.repeat(60));

  // ========================================
  // Traces（トレース）のエクスポーター
  // ========================================
  const traceExporter = useConsole
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` });

  // ========================================
  // Metrics（メトリクス）のリーダー
  // ========================================
  const metricReader = new PeriodicExportingMetricReader({
    exporter: useConsole
      ? new ConsoleMetricExporter()
      : new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` }),
    exportIntervalMillis: 5000,  // 5秒ごとにエクスポート
  });

  // ========================================
  // Logs（ログ）のプロセッサー
  // ========================================
  const logRecordProcessor: LogRecordProcessor = useConsole
    ? new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
    : new SimpleLogRecordProcessor(new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` }));

  // SDKの設定
  const sdk = new NodeSDK({
    resource,

    // Traces: エクスポーターを直接指定
    traceExporter,

    // Metrics: メトリクスリーダーを指定
    metricReader,

    // Logs: ログプロセッサーを指定
    logRecordProcessor,

    // ========================================
    // 自動計装（Instrumentation）
    // ========================================
    // HTTPリクエストやExpressルートを自動的にトレースする
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  // SDKを開始
  sdk.start();
  console.log('OpenTelemetry SDK 開始完了\n');

  // シャットダウン時のクリーンアップ
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry SDK シャットダウン完了'))
      .catch((error) => console.error('シャットダウンエラー:', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * シンプルなセットアップ（開発用）
 */
export function setupDevelopment(serviceName: string): NodeSDK {
  return setupOpenTelemetry({
    serviceName,
    useConsoleExporter: true,
    useOtlpExporter: false,
  });
}

/**
 * 本番用セットアップ
 */
export function setupProduction(serviceName: string, otlpEndpoint: string): NodeSDK {
  return setupOpenTelemetry({
    serviceName,
    environment: 'production',
    useConsoleExporter: false,
    useOtlpExporter: true,
    otlpEndpoint,
  });
}
