import { useState, useEffect, useCallback } from "react";
import { apiClient } from "./api/client";
import { TodoForm, TodoList, FilterBar } from "./components";
import {
  Todo,
  TodoStatus,
  PaginationInfo,
  CreateTodoRequest,
  UpdateTodoRequest,
} from "./types/api";
import "./App.css";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<TodoStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState(true);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getTodos(currentPage, 10, statusFilter);
      setTodos(response.data);
      setPagination(response.pagination);
      setIsServerOnline(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Todoの取得に失敗しました"
      );
      setIsServerOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ヘルスチェック
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.checkHealth();
        setIsServerOnline(true);
      } catch {
        setIsServerOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTodo = async (data: CreateTodoRequest) => {
    await apiClient.createTodo(data);
    setCurrentPage(1);
    await fetchTodos();
  };

  const handleUpdateTodo = async (id: number, data: UpdateTodoRequest) => {
    await apiClient.updateTodo(id, data);
    await fetchTodos();
  };

  const handleDeleteTodo = async (id: number) => {
    await apiClient.deleteTodo(id);
    await fetchTodos();
  };

  const handleStatusFilterChange = (status: TodoStatus | undefined) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TypeSpec Todo App</h1>
        <p className="subtitle">TypeSpec + Express.js + React で構築</p>
        <div className={`server-status ${isServerOnline ? "online" : "offline"}`}>
          {isServerOnline ? "Server Online" : "Server Offline"}
        </div>
      </header>

      <main className="app-main">
        <section className="create-section">
          <TodoForm onSubmit={handleCreateTodo} />
        </section>

        <section className="list-section">
          <h2>Todoリスト</h2>

          <FilterBar
            currentStatus={statusFilter}
            onStatusChange={handleStatusFilterChange}
            pagination={pagination}
            onPageChange={setCurrentPage}
          />

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={fetchTodos}>再試行</button>
            </div>
          )}

          {isLoading ? (
            <div className="loading">読み込み中...</div>
          ) : (
            <TodoList
              todos={todos}
              onUpdate={handleUpdateTodo}
              onDelete={handleDeleteTodo}
            />
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>
          API Documentation:{" "}
          <a
            href="http://localhost:3001/api-docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Swagger UI
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
