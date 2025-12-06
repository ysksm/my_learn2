import { Todo, TodoStatus, CreateTodoRequest, UpdateTodoRequest } from "./types";

// インメモリデータストア
class TodoRepository {
  private todos: Map<number, Todo> = new Map();
  private nextId = 1;

  constructor() {
    // サンプルデータを追加
    this.create({ title: "TypeSpecを学ぶ", description: "API定義言語の基本を理解する" });
    this.create({ title: "Express.jsでAPIを実装", description: "バックエンドサーバーを構築" });
    this.create({ title: "Reactでフロントエンドを作成", description: "UIコンポーネントを実装" });
  }

  findAll(
    page: number = 1,
    limit: number = 10,
    status?: TodoStatus
  ): { data: Todo[]; total: number } {
    let todos = Array.from(this.todos.values());

    if (status) {
      todos = todos.filter((todo) => todo.status === status);
    }

    const total = todos.length;
    const start = (page - 1) * limit;
    const data = todos.slice(start, start + limit);

    return { data, total };
  }

  findById(id: number): Todo | undefined {
    return this.todos.get(id);
  }

  create(request: CreateTodoRequest): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: this.nextId++,
      title: request.title,
      description: request.description,
      status: TodoStatus.Pending,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  update(id: number, request: UpdateTodoRequest): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...todo,
      title: request.title ?? todo.title,
      description: request.description !== undefined ? request.description : todo.description,
      status: request.status ?? todo.status,
      updatedAt: new Date().toISOString(),
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  delete(id: number): boolean {
    return this.todos.delete(id);
  }
}

export const todoRepository = new TodoRepository();
