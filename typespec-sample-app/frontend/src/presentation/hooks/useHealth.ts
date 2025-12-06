import { useState, useEffect, useCallback } from "react";
import { useCheckHealthUseCase } from "../../di";

export interface UseHealthResult {
  isOnline: boolean;
  checkHealth: () => Promise<void>;
}

export function useHealth(checkIntervalMs: number = 30000): UseHealthResult {
  const [isOnline, setIsOnline] = useState(true);
  const checkHealthUseCase = useCheckHealthUseCase();

  const checkHealth = useCallback(async () => {
    const result = await checkHealthUseCase.execute();
    setIsOnline(result.isOnline);
  }, [checkHealthUseCase]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, checkIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, checkIntervalMs]);

  return {
    isOnline,
    checkHealth,
  };
}
