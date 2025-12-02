# OpenTelemetry 学習用サンプルアプリケーション

OpenTelemetryの**3つのシグナル**（Traces、Metrics、Logs）を理解するためのサンプルアプリケーションです。

## 目次

1. [OpenTelemetryとは](#opentelemetryとは)
2. [3つのシグナル](#3つのシグナル)
3. [セットアップ](#セットアップ)
4. [デモの実行](#デモの実行)
5. [OTLPフォーマット](#otlpフォーマット)
6. [ライブラリ構成](#ライブラリ構成)

---

## OpenTelemetryとは

OpenTelemetry（OTel）は、テレメトリデータ（Traces、Metrics、Logs）を収集・エクスポートするための**オープンソースの標準仕様**です。

### なぜOpenTelemetryが必要か

```
┌─────────────────────────────────────────────────────────────┐
│                     分散システムの課題                       │
├─────────────────────────────────────────────────────────────┤
│  マイクロサービスA ──→ マイクロサービスB ──→ データベース   │
│        ↓                     ↓                    ↓        │
│     [ログ1]               [ログ2]             [ログ3]       │
│                                                             │
│  問題: エラーがどこで発生したか追跡が困難                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 OpenTelemetryの解決策                        │
├─────────────────────────────────────────────────────────────┤
│  マイクロサービスA ──→ マイクロサービスB ──→ データベース   │
│        ↓                     ↓                    ↓        │
│  [Span: TraceID=abc]   [Span: TraceID=abc]  [Span: TraceID=abc]
│  [Log: TraceID=abc]    [Log: TraceID=abc]   [Log: TraceID=abc]
│  [Metrics]             [Metrics]            [Metrics]       │
│                                                             │
│  → TraceIDで全てのデータを関連付けて追跡可能                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3つのシグナル

### 1. Traces（トレース）

**用途**: リクエストの流れを追跡

```
Trace (TraceID: abc-123)
│
├── Span: HTTP GET /api/orders (200ms)
│   │
│   ├── Span: authenticate (20ms)
│   │
│   ├── Span: database query (80ms)
│   │   └── attributes: {db.system: "postgresql", db.statement: "SELECT..."}
│   │
│   └── Span: serialize response (10ms)
│
└── 完了
```

**主要な概念**:
| 概念 | 説明 |
|------|------|
| **Trace** | 1つのリクエストの全体的な流れ |
| **Span** | 処理の1単位（関数、APIコール、DBクエリなど） |
| **SpanContext** | Trace ID + Span ID + Trace Flags |
| **Attributes** | Spanに付加するメタデータ |
| **Events** | Span内で発生したイベント |
| **Status** | 処理結果（OK / ERROR） |

**SpanKindの種類**:
| Kind | 用途 |
|------|------|
| INTERNAL | 内部処理（デフォルト） |
| SERVER | HTTPリクエストを受信 |
| CLIENT | 外部サービスへリクエスト |
| PRODUCER | メッセージキューへ送信 |
| CONSUMER | メッセージキューから受信 |

### 2. Metrics（メトリクス）

**用途**: システムの状態を数値で測定

```
┌─────────────────────────────────────────────────────────────┐
│                    メトリクスの種類                          │
├─────────────────┬───────────────────────────────────────────┤
│ Counter         │ 累積増加のみ                              │
│                 │ 例: リクエスト数、エラー数                 │
│                 │ add(1)                                    │
├─────────────────┼───────────────────────────────────────────┤
│ UpDownCounter   │ 増減可能                                  │
│                 │ 例: アクティブ接続数、キューサイズ         │
│                 │ add(1), add(-1)                           │
├─────────────────┼───────────────────────────────────────────┤
│ Histogram       │ 値の分布を記録                            │
│                 │ 例: レスポンス時間、リクエストサイズ       │
│                 │ record(45)  → バケットで集計              │
├─────────────────┼───────────────────────────────────────────┤
│ ObservableGauge │ 現在値をコールバックで取得                 │
│                 │ 例: CPU使用率、メモリ使用量                │
│                 │ callback(() => currentValue)              │
└─────────────────┴───────────────────────────────────────────┘
```

**属性（Attributes）の重要性**:
```javascript
// 同じメトリクス名でも属性で分析可能
httpRequestCounter.add(1, {
  'http.method': 'GET',      // メソッド別
  'http.route': '/api/users', // エンドポイント別
  'http.status_code': 200,   // ステータス別
});
```

### 3. Logs（ログ）

**用途**: 構造化されたログデータを収集

```
┌─────────────────────────────────────────────────────────────┐
│                  重要度レベル（Severity）                    │
├───────────┬───────────┬─────────────────────────────────────┤
│ Level     │ Number    │ 用途                                │
├───────────┼───────────┼─────────────────────────────────────┤
│ TRACE     │ 1-4       │ 最も詳細なデバッグ情報              │
│ DEBUG     │ 5-8       │ デバッグ情報                        │
│ INFO      │ 9-12      │ 一般的な情報                        │
│ WARN      │ 13-16     │ 警告                                │
│ ERROR     │ 17-20     │ エラー                              │
│ FATAL     │ 21-24     │ 致命的エラー                        │
└───────────┴───────────┴─────────────────────────────────────┘
```

**トレースとの相関**:
```javascript
// ログにTraceID/SpanIDが自動的に含まれる
logger.emit({
  severityNumber: SeverityNumber.INFO,
  body: 'ユーザーがログインしました',
  attributes: {
    'user.id': 12345,
  },
  // 自動付加: traceId, spanId
});

// → Jaeger等のトレースUIからログを参照可能
// → ログ検索からトレースにジャンプ可能
```

---

## セットアップ

```bash
# プロジェクトディレクトリに移動
cd opentelemetry-sample

# 依存関係をインストール
npm install
```

---

## デモの実行

### 個別デモ

各シグナルを個別に理解するためのデモ:

```bash
# Traces（トレース）デモ
npm run demo:traces

# Metrics（メトリクス）デモ
npm run demo:metrics

# Logs（ログ）デモ
npm run demo:logs
```

### 統合デモ（Express API）

3つのシグナルを統合したWebアプリケーション:

```bash
# サーバー起動
npm run dev

# 別ターミナルでAPIを呼び出し
curl http://localhost:3000/
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/1
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"items":["item1","item2"]}'
curl http://localhost:3000/api/slow?delay=1000
curl http://localhost:3000/api/error?type=validation
```

---

## OTLPフォーマット

OpenTelemetry Protocol（OTLP）は、テレメトリデータの標準フォーマットです。

### Traces のOTLP形式

```json
{
  "resourceSpans": [{
    "resource": {
      "attributes": [
        { "key": "service.name", "value": { "stringValue": "sample-api" } }
      ]
    },
    "scopeSpans": [{
      "scope": { "name": "sample-api", "version": "1.0.0" },
      "spans": [{
        "traceId": "abc123...",
        "spanId": "def456...",
        "parentSpanId": "...",
        "name": "HTTP GET /api/users",
        "kind": 2,
        "startTimeUnixNano": "1234567890000000000",
        "endTimeUnixNano": "1234567990000000000",
        "attributes": [
          { "key": "http.method", "value": { "stringValue": "GET" } },
          { "key": "http.status_code", "value": { "intValue": "200" } }
        ],
        "status": { "code": 1 }
      }]
    }]
  }]
}
```

### Metrics のOTLP形式

```json
{
  "resourceMetrics": [{
    "resource": { "attributes": [...] },
    "scopeMetrics": [{
      "scope": { "name": "sample-api" },
      "metrics": [{
        "name": "http.requests.total",
        "description": "HTTPリクエストの総数",
        "unit": "1",
        "sum": {
          "dataPoints": [{
            "attributes": [
              { "key": "http.method", "value": { "stringValue": "GET" } }
            ],
            "startTimeUnixNano": "...",
            "timeUnixNano": "...",
            "asInt": "123"
          }],
          "aggregationTemporality": 2,
          "isMonotonic": true
        }
      }]
    }]
  }]
}
```

### Logs のOTLP形式

```json
{
  "resourceLogs": [{
    "resource": { "attributes": [...] },
    "scopeLogs": [{
      "scope": { "name": "sample-api" },
      "logRecords": [{
        "timeUnixNano": "1234567890000000000",
        "severityNumber": 9,
        "severityText": "INFO",
        "body": { "stringValue": "ユーザーがログインしました" },
        "attributes": [
          { "key": "user.id", "value": { "intValue": "12345" } }
        ],
        "traceId": "abc123...",
        "spanId": "def456..."
      }]
    }]
  }]
}
```

---

## ライブラリ構成

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenTelemetry JS 構成                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐   API Layer（抽象インターフェース）    │
│  │ @opentelemetry/ │                                       │
│  │     api         │   trace, metrics, context を定義      │
│  │     api-logs    │   logs を定義                         │
│  └────────┬────────┘                                       │
│           │                                                 │
│  ┌────────▼────────┐   SDK Layer（実装）                   │
│  │ @opentelemetry/ │                                       │
│  │  sdk-trace-node │   Traces の実装                       │
│  │  sdk-metrics    │   Metrics の実装                      │
│  │  sdk-logs       │   Logs の実装                         │
│  │  sdk-node       │   統合SDK                             │
│  └────────┬────────┘                                       │
│           │                                                 │
│  ┌────────▼────────┐   Exporter Layer（出力先）            │
│  │ @opentelemetry/ │                                       │
│  │  exporter-*-    │                                       │
│  │    otlp-http    │   OTLP HTTP エクスポーター            │
│  │    console      │   コンソール出力                      │
│  └────────┬────────┘                                       │
│           │                                                 │
│  ┌────────▼────────┐   Instrumentation Layer               │
│  │ @opentelemetry/ │                                       │
│  │  instrumentation│                                       │
│  │    -http        │   HTTP 自動計装                       │
│  │    -express     │   Express 自動計装                    │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 主要パッケージ

| パッケージ | 役割 |
|-----------|------|
| `@opentelemetry/api` | 共通API（trace, metrics, context） |
| `@opentelemetry/api-logs` | Logs API |
| `@opentelemetry/sdk-node` | Node.js用統合SDK |
| `@opentelemetry/sdk-trace-node` | Traces SDK |
| `@opentelemetry/sdk-metrics` | Metrics SDK |
| `@opentelemetry/sdk-logs` | Logs SDK |
| `@opentelemetry/resources` | リソース情報（サービス名など） |
| `@opentelemetry/semantic-conventions` | 標準属性名の定義 |
| `@opentelemetry/exporter-*-otlp-http` | OTLP HTTPエクスポーター |
| `@opentelemetry/instrumentation-*` | 自動計装ライブラリ |

---

## プロジェクト構造

```
opentelemetry-sample/
├── src/
│   ├── instrumentation/
│   │   └── setup.ts        # OpenTelemetry SDK 初期化
│   ├── traces/
│   │   └── demo.ts         # Traces デモ
│   ├── metrics/
│   │   └── demo.ts         # Metrics デモ
│   ├── logs/
│   │   └── demo.ts         # Logs デモ
│   └── index.ts            # 統合サンプルアプリ (Express)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 次のステップ

1. **バックエンド連携**: Jaeger、Zipkin、Grafana Tempoなどのバックエンドに接続
2. **自動計装の拡張**: データベース、Redis、gRPCなどの自動計装を追加
3. **サンプリング**: 本番環境向けのサンプリング設定
4. **カスタム計装**: ビジネスロジック固有のメトリクス追加

---

## 参考リンク

- [OpenTelemetry 公式サイト](https://opentelemetry.io/)
- [OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
