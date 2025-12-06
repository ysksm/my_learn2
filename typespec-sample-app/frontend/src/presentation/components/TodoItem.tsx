import { useState } from "react";
import { Todo } from "../../domain/entities/Todo";
import {
  TodoStatus,
  TodoStatusLabels,
  TodoStatusColors,
  getAllTodoStatuses,
} from "../../domain/value-objects/TodoStatus";

interface TodoItemProps {
  todo: Todo;
  onUpdate: (
    id: number,
    data: { title?: string; description?: string; status?: TodoStatus }
  ) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: TodoStatus) => {
    setIsLoading(true);
    try {
      await onUpdate(todo.id, { status: newStatus });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    setIsLoading(true);
    try {
      const success = await onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      if (success) {
        setIsEditing(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("このTodoを削除しますか？")) return;

    setIsLoading(true);
    try {
      await onDelete(todo.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP");
  };

  return (
    <div className={`todo-item ${todo.status}`}>
      {isEditing ? (
        <div className="todo-edit">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="タイトル"
            maxLength={100}
            disabled={isLoading}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="説明"
            maxLength={500}
            rows={2}
            disabled={isLoading}
          />
          <div className="edit-actions">
            <button onClick={handleSave} disabled={isLoading || !editTitle.trim()}>
              保存
            </button>
            <button onClick={handleCancel} disabled={isLoading} className="cancel">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="todo-content">
            <h3>{todo.title}</h3>
            {todo.description && <p className="description">{todo.description}</p>}
            <div className="meta">
              <span className="date">作成: {formatDate(todo.createdAt)}</span>
              <span className="date">更新: {formatDate(todo.updatedAt)}</span>
            </div>
          </div>
          <div className="todo-actions">
            <select
              value={todo.status}
              onChange={(e) => handleStatusChange(e.target.value as TodoStatus)}
              disabled={isLoading}
              style={{ borderColor: TodoStatusColors[todo.status] }}
            >
              {getAllTodoStatuses().map((status) => (
                <option key={status} value={status}>
                  {TodoStatusLabels[status]}
                </option>
              ))}
            </select>
            <button onClick={() => setIsEditing(true)} disabled={isLoading}>
              編集
            </button>
            <button onClick={handleDelete} disabled={isLoading} className="delete">
              削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
