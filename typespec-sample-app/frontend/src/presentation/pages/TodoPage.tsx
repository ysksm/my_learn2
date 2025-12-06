import { useState, useEffect, useCallback } from "react";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";
import { useTodos, useHealth } from "../hooks";
import { TodoForm, TodoList, FilterBar } from "../components";

export function TodoPage() {
  const [statusFilter, setStatusFilter] = useState<TodoStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    todos,
    pagination,
    isLoading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  } = useTodos();

  const { isOnline } = useHealth(30000);

  const loadTodos = useCallback(() => {
    fetchTodos(currentPage, 10, statusFilter);
  }, [fetchTodos, currentPage, statusFilter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (
    title: string,
    description?: string
  ): Promise<boolean> => {
    const success = await createTodo(title, description);
    if (success) {
      setCurrentPage(1);
      await fetchTodos(1, 10, statusFilter);
    }
    return success;
  };

  const handleUpdateTodo = async (
    id: number,
    data: { title?: string; description?: string; status?: TodoStatus }
  ): Promise<boolean> => {
    const success = await updateTodo(id, data);
    if (success) {
      await loadTodos();
    }
    return success;
  };

  const handleDeleteTodo = async (id: number): Promise<boolean> => {
    const success = await deleteTodo(id);
    if (success) {
      await loadTodos();
    }
    return success;
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
        <div className={`server-status ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "Server Online" : "Server Offline"}
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
              <button onClick={loadTodos}>再試行</button>
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
