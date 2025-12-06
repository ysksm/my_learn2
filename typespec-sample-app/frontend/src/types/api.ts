// TypeSpecで定義されたAPIの型定義（フロントエンド用）

export enum TodoStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
}

export interface ErrorResponse {
  message: string;
  code: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TodoListResponse {
  data: Todo[];
  pagination: PaginationInfo;
}

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
}

// ステータスの表示名
export const TodoStatusLabels: Record<TodoStatus, string> = {
  [TodoStatus.Pending]: "未着手",
  [TodoStatus.InProgress]: "進行中",
  [TodoStatus.Completed]: "完了",
};

// ステータスの色
export const TodoStatusColors: Record<TodoStatus, string> = {
  [TodoStatus.Pending]: "#6b7280",
  [TodoStatus.InProgress]: "#3b82f6",
  [TodoStatus.Completed]: "#22c55e",
};
