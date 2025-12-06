import { TodoStatus, TodoStatusValues } from "../value-objects/TodoStatus";

// ドメインエンティティ: Todo
export interface Todo {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly status: TodoStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Todoの作成パラメータ
export interface CreateTodoParams {
  title: string;
  description?: string;
}

// Todoの更新パラメータ
export interface UpdateTodoParams {
  title?: string;
  description?: string;
  status?: TodoStatus;
}

// Todoエンティティのファクトリ関数
export function createTodo(params: {
  id: number;
  title: string;
  description?: string;
  status: TodoStatus;
  createdAt: Date;
  updatedAt: Date;
}): Todo {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    status: params.status,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

// Todoのバリデーション
export function validateCreateTodoParams(params: CreateTodoParams): string | null {
  if (!params.title || params.title.trim().length === 0) {
    return "タイトルを入力してください";
  }
  if (params.title.length > 100) {
    return "タイトルは100文字以内で入力してください";
  }
  if (params.description && params.description.length > 500) {
    return "説明は500文字以内で入力してください";
  }
  return null;
}

// Todoが完了しているか
export function isCompleted(todo: Todo): boolean {
  return todo.status === TodoStatusValues.Completed;
}

// Todoが進行中か
export function isInProgress(todo: Todo): boolean {
  return todo.status === TodoStatusValues.InProgress;
}

// Todoが未着手か
export function isPending(todo: Todo): boolean {
  return todo.status === TodoStatusValues.Pending;
}
