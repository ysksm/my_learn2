// ヘルスチェックのレスポンス
export interface HealthStatus {
  status: "ok" | "error";
  timestamp: Date;
}

// ヘルスリポジトリインターフェース（DIP: 依存性逆転の原則）
export interface IHealthRepository {
  // ヘルスチェックを実行
  checkHealth(): Promise<HealthStatus>;
}
