// TypeSpec Binary Protocol Definition
// バイナリコマンドプロトコル定義

namespace BinaryProtocol;

// ============================================
// プリミティブ型定義
// ============================================

// エンディアン指定
@doc("Byte order for multi-byte values")
enum Endian {
  Little,
  Big,
}

// ============================================
// 共通デコレータ
// ============================================

// @binary - バイナリシリアライズ対象
// @size(n) - 固定サイズ（バイト数）
// @length_prefix(type) - 長さプレフィックス型
// @command_id(id) - コマンドID
// @version(v) - プロトコルバージョン

// ============================================
// プロトコルヘッダー
// ============================================

@binary
model ProtocolHeader {
  @size(2)
  magic: uint16;          // マジックナンバー 0xABCD

  @size(1)
  version: uint8;         // プロトコルバージョン

  @size(1)
  command_id: uint8;      // コマンドID

  @size(4)
  payload_length: uint32; // ペイロード長

  @size(4)
  sequence_id: uint32;    // シーケンスID

  @size(2)
  checksum: uint16;       // チェックサム
}

// ============================================
// 列挙型定義
// ============================================

@binary
enum DeviceStatus {
  @value(0) Offline,
  @value(1) Online,
  @value(2) Busy,
  @value(3) Error,
}

@binary
enum ErrorCode {
  @value(0) None,
  @value(1) InvalidCommand,
  @value(2) InvalidParameter,
  @value(3) Timeout,
  @value(4) DeviceError,
  @value(255) Unknown,
}

// ============================================
// コマンド定義
// ============================================

// Pingコマンド
@binary
@command_id(0x01)
model PingCommand {
  @size(8)
  timestamp: uint64;      // タイムスタンプ（ミリ秒）
}

// Ping応答
@binary
@command_id(0x81)
model PingResponse {
  @size(8)
  request_timestamp: uint64;  // リクエスト時のタイムスタンプ

  @size(8)
  response_timestamp: uint64; // 応答時のタイムスタンプ
}

// デバイス情報取得コマンド
@binary
@command_id(0x02)
model GetDeviceInfoCommand {
  @size(1)
  include_details: bool;  // 詳細情報を含めるか
}

// デバイス情報応答
@binary
@command_id(0x82)
model DeviceInfoResponse {
  @size(1)
  status: DeviceStatus;

  @size(32)
  device_name: string;    // 固定長文字列（NULL終端）

  @size(16)
  firmware_version: string;

  @size(4)
  uptime_seconds: uint32;

  @size(2)
  temperature: int16;     // 温度（0.1度単位）

  @size(1)
  battery_level: uint8;   // バッテリー残量（%）
}

// データ送信コマンド
@binary
@command_id(0x03)
model SendDataCommand {
  @size(1)
  channel: uint8;         // チャンネル番号

  @size(1)
  priority: uint8;        // 優先度

  @length_prefix(uint16)
  data: bytes;            // 可変長データ
}

// データ送信応答
@binary
@command_id(0x83)
model SendDataResponse {
  @size(1)
  success: bool;

  @size(1)
  error_code: ErrorCode;

  @size(4)
  bytes_written: uint32;
}

// 設定変更コマンド
@binary
@command_id(0x04)
model SetConfigCommand {
  @size(1)
  config_id: uint8;

  @size(1)
  value_type: uint8;      // 0=int, 1=float, 2=string

  @length_prefix(uint8)
  value: bytes;           // 可変長値
}

// 設定変更応答
@binary
@command_id(0x84)
model SetConfigResponse {
  @size(1)
  success: bool;

  @size(1)
  error_code: ErrorCode;
}

// バッチコマンド（複数コマンドを一度に送信）
@binary
@command_id(0x10)
model BatchCommand {
  @size(1)
  command_count: uint8;

  @length_prefix(uint16)
  commands: bytes;        // シリアライズされたコマンド列
}

// バッチ応答
@binary
@command_id(0x90)
model BatchResponse {
  @size(1)
  success_count: uint8;

  @size(1)
  failure_count: uint8;

  @length_prefix(uint16)
  results: bytes;         // 各コマンドの結果
}

// ============================================
// 複合型定義
// ============================================

@binary
model Vector3D {
  @size(4)
  x: float32;

  @size(4)
  y: float32;

  @size(4)
  z: float32;
}

@binary
model SensorData {
  @size(8)
  timestamp: uint64;

  @size(1)
  sensor_id: uint8;

  position: Vector3D;     // ネストした構造体

  @size(4)
  temperature: float32;

  @size(4)
  humidity: float32;
}

// センサーデータ取得応答
@binary
@command_id(0x85)
model SensorDataResponse {
  @size(1)
  sensor_count: uint8;

  @length_prefix(uint16)
  sensors: SensorData[];  // 配列
}
