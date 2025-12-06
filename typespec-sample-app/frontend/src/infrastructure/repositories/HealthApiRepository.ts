import {
  IHealthRepository,
  HealthStatus,
} from "../../domain/repositories/IHealthRepository";
import { HttpClient } from "../api/HttpClient";

// ヘルスチェックAPIのレスポンスDTO
interface HealthApiResponse {
  status: "ok" | "error";
  timestamp: string;
}

// ヘルスリポジトリのAPI実装
export class HealthApiRepository implements IHealthRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async checkHealth(): Promise<HealthStatus> {
    const response = await this.httpClient.get<HealthApiResponse>("/health");
    return {
      status: response.status,
      timestamp: new Date(response.timestamp),
    };
  }
}
