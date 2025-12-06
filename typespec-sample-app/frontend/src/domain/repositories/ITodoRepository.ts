import { Todo, CreateTodoParams, UpdateTodoParams } from "../entities/Todo";
import { TodoStatus } from "../value-objects/TodoStatus";

// ページネーション情報
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Todoリストのレスポンス
export interface TodoListResult {
  data: Todo[];
  pagination: PaginationInfo;
}

// Todoリポジトリインターフェース（DIP: 依存性逆転の原則）
// ドメイン層で定義し、インフラストラクチャ層で実装する
export interface ITodoRepository {
  // 全てのTodoを取得（ページネーション、フィルタリング対応）
  findAll(page: number, limit: number, status?: TodoStatus): Promise<TodoListResult>;

  // IDでTodoを取得
  findById(id: number): Promise<Todo | null>;

  // 新しいTodoを作成
  create(params: CreateTodoParams): Promise<Todo>;

  // Todoを更新
  update(id: number, params: UpdateTodoParams): Promise<Todo>;

  // Todoを削除
  delete(id: number): Promise<void>;
}
