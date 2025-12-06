// 値オブジェクト: Todoのステータス
export const TodoStatusValues = {
  Pending: "pending",
  InProgress: "in_progress",
  Completed: "completed",
} as const;

export type TodoStatus = (typeof TodoStatusValues)[keyof typeof TodoStatusValues];

// ステータスの表示名
export const TodoStatusLabels: Record<TodoStatus, string> = {
  [TodoStatusValues.Pending]: "未着手",
  [TodoStatusValues.InProgress]: "進行中",
  [TodoStatusValues.Completed]: "完了",
};

// ステータスの色
export const TodoStatusColors: Record<TodoStatus, string> = {
  [TodoStatusValues.Pending]: "#6b7280",
  [TodoStatusValues.InProgress]: "#3b82f6",
  [TodoStatusValues.Completed]: "#22c55e",
};

// ステータスの一覧を取得
export function getAllTodoStatuses(): TodoStatus[] {
  return Object.values(TodoStatusValues);
}

// 文字列からTodoStatusへの変換（バリデーション付き）
export function parseTodoStatus(value: string): TodoStatus | null {
  const statuses = Object.values(TodoStatusValues) as string[];
  if (statuses.includes(value)) {
    return value as TodoStatus;
  }
  return null;
}
