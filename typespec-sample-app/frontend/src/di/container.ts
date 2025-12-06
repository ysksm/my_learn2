import { createContext, useContext } from "react";
import { ITodoRepository } from "../domain/repositories/ITodoRepository";
import { IHealthRepository } from "../domain/repositories/IHealthRepository";
import {
  GetTodosUseCase,
  GetTodoByIdUseCase,
  CreateTodoUseCase,
  UpdateTodoUseCase,
  DeleteTodoUseCase,
  CheckHealthUseCase,
} from "../application";
import { HttpClient } from "../infrastructure/api/HttpClient";
import { TodoApiRepository } from "../infrastructure/repositories/TodoApiRepository";
import { HealthApiRepository } from "../infrastructure/repositories/HealthApiRepository";

// DIコンテナのインターフェース
export interface DIContainer {
  // Repositories
  todoRepository: ITodoRepository;
  healthRepository: IHealthRepository;

  // Use Cases
  getTodosUseCase: GetTodosUseCase;
  getTodoByIdUseCase: GetTodoByIdUseCase;
  createTodoUseCase: CreateTodoUseCase;
  updateTodoUseCase: UpdateTodoUseCase;
  deleteTodoUseCase: DeleteTodoUseCase;
  checkHealthUseCase: CheckHealthUseCase;
}

// DIコンテナの設定
export interface DIContainerConfig {
  apiBaseUrl: string;
}

// DIコンテナの作成（ファクトリ関数）
export function createDIContainer(config: DIContainerConfig): DIContainer {
  // Infrastructure Layer
  const httpClient = new HttpClient({ baseUrl: config.apiBaseUrl });

  // Repositories (依存性注入)
  const todoRepository: ITodoRepository = new TodoApiRepository(httpClient);
  const healthRepository: IHealthRepository = new HealthApiRepository(httpClient);

  // Use Cases (依存性注入)
  const getTodosUseCase = new GetTodosUseCase(todoRepository);
  const getTodoByIdUseCase = new GetTodoByIdUseCase(todoRepository);
  const createTodoUseCase = new CreateTodoUseCase(todoRepository);
  const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);
  const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository);
  const checkHealthUseCase = new CheckHealthUseCase(healthRepository);

  return {
    todoRepository,
    healthRepository,
    getTodosUseCase,
    getTodoByIdUseCase,
    createTodoUseCase,
    updateTodoUseCase,
    deleteTodoUseCase,
    checkHealthUseCase,
  };
}

// デフォルト設定でDIコンテナを作成
export function createDefaultContainer(): DIContainer {
  return createDIContainer({
    apiBaseUrl: "http://localhost:3001",
  });
}

// React Context for DI
const DIContainerContext = createContext<DIContainer | null>(null);

export const DIContainerProvider = DIContainerContext.Provider;

// DIコンテナを取得するカスタムフック
export function useDIContainer(): DIContainer {
  const container = useContext(DIContainerContext);
  if (!container) {
    throw new Error("useDIContainer must be used within a DIContainerProvider");
  }
  return container;
}

// 個別のユースケースを取得するフック
export function useGetTodosUseCase(): GetTodosUseCase {
  return useDIContainer().getTodosUseCase;
}

export function useGetTodoByIdUseCase(): GetTodoByIdUseCase {
  return useDIContainer().getTodoByIdUseCase;
}

export function useCreateTodoUseCase(): CreateTodoUseCase {
  return useDIContainer().createTodoUseCase;
}

export function useUpdateTodoUseCase(): UpdateTodoUseCase {
  return useDIContainer().updateTodoUseCase;
}

export function useDeleteTodoUseCase(): DeleteTodoUseCase {
  return useDIContainer().deleteTodoUseCase;
}

export function useCheckHealthUseCase(): CheckHealthUseCase {
  return useDIContainer().checkHealthUseCase;
}
