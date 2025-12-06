import { IHealthRepository, HealthStatus } from "../../domain/repositories/IHealthRepository";

// CheckHealthユースケースの結果
export interface CheckHealthResult {
  isOnline: boolean;
  status?: HealthStatus;
}

// CheckHealthユースケース
export class CheckHealthUseCase {
  constructor(private readonly healthRepository: IHealthRepository) {}

  async execute(): Promise<CheckHealthResult> {
    try {
      const status = await this.healthRepository.checkHealth();
      return { isOnline: status.status === "ok", status };
    } catch {
      return { isOnline: false };
    }
  }
}
