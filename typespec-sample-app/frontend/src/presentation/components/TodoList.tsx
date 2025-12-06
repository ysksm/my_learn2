import { Todo } from "../../domain/entities/Todo";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onUpdate: (
    id: number,
    data: { title?: string; description?: string; status?: TodoStatus }
  ) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function TodoList({ todos, onUpdate, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>Todoがありません。新しいTodoを作成してください。</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
