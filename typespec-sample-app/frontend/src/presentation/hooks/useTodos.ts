import { useState, useCallback } from "react";
import { Todo } from "../../domain/entities/Todo";
import { PaginationInfo } from "../../domain/repositories/ITodoRepository";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";
import {
  useGetTodosUseCase,
  useCreateTodoUseCase,
  useUpdateTodoUseCase,
  useDeleteTodoUseCase,
} from "../../di";

export interface UseTodosState {
  todos: Todo[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseTodosActions {
  fetchTodos: (page: number, limit: number, status?: TodoStatus) => Promise<void>;
  createTodo: (title: string, description?: string) => Promise<boolean>;
  updateTodo: (
    id: number,
    data: { title?: string; description?: string; status?: TodoStatus }
  ) => Promise<boolean>;
  deleteTodo: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export type UseTodosResult = UseTodosState & UseTodosActions;

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTodosUseCase = useGetTodosUseCase();
  const createTodoUseCase = useCreateTodoUseCase();
  const updateTodoUseCase = useUpdateTodoUseCase();
  const deleteTodoUseCase = useDeleteTodoUseCase();

  const fetchTodos = useCallback(
    async (page: number, limit: number, status?: TodoStatus) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getTodosUseCase.execute({ page, limit, status });
        setTodos(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Todoの取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [getTodosUseCase]
  );

  const createTodo = useCallback(
    async (title: string, description?: string): Promise<boolean> => {
      try {
        const result = await createTodoUseCase.execute({ title, description });
        if (!result.success) {
          setError(result.error || "Todoの作成に失敗しました");
          return false;
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Todoの作成に失敗しました"
        );
        return false;
      }
    },
    [createTodoUseCase]
  );

  const updateTodo = useCallback(
    async (
      id: number,
      data: { title?: string; description?: string; status?: TodoStatus }
    ): Promise<boolean> => {
      try {
        const result = await updateTodoUseCase.execute({ id, ...data });
        if (!result.success) {
          setError(result.error || "Todoの更新に失敗しました");
          return false;
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Todoの更新に失敗しました"
        );
        return false;
      }
    },
    [updateTodoUseCase]
  );

  const deleteTodo = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await deleteTodoUseCase.execute({ id });
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Todoの削除に失敗しました"
        );
        return false;
      }
    },
    [deleteTodoUseCase]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    todos,
    pagination,
    isLoading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    clearError,
  };
}
