import {
  Todo,
  TodoListResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoStatus,
  HealthResponse,
} from "../types/api";

const API_BASE_URL = "http://localhost:3001";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "An error occurred",
        code: "UNKNOWN_ERROR",
      }));
      throw new Error(error.message);
    }

    // 204 No Content の場合は空を返す
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Todos API
  async getTodos(
    page: number = 1,
    limit: number = 10,
    status?: TodoStatus
  ): Promise<TodoListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append("status", status);
    }
    return this.request<TodoListResponse>(`/todos?${params}`);
  }

  async getTodo(id: number): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`);
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    return this.request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
    return this.request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(id: number): Promise<void> {
    await this.request<void>(`/todos/${id}`, {
      method: "DELETE",
    });
  }

  // Health API
  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }
}

export const apiClient = new ApiClient();
