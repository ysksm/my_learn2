import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

/**
 * TypeSpecで定義されたTodo管理API
 */
@service({
  title: "Todo API",
})
@server("http://localhost:3001", "開発サーバー")
namespace TodoApi;

// ============================================
// モデル定義
// ============================================

/** Todoアイテムのステータス */
enum TodoStatus {
  pending: "pending",
  in_progress: "in_progress",
  completed: "completed",
}

/** Todoアイテム */
model Todo {
  /** 一意の識別子 */
  id: int32;

  /** タイトル */
  title: string;

  /** 説明（オプション） */
  description?: string;

  /** ステータス */
  status: TodoStatus;

  /** 作成日時 */
  createdAt: utcDateTime;

  /** 更新日時 */
  updatedAt: utcDateTime;
}

/** Todo作成リクエスト */
model CreateTodoRequest {
  /** タイトル */
  @minLength(1)
  @maxLength(100)
  title: string;

  /** 説明（オプション） */
  @maxLength(500)
  description?: string;
}

/** Todo更新リクエスト */
model UpdateTodoRequest {
  /** タイトル */
  @minLength(1)
  @maxLength(100)
  title?: string;

  /** 説明 */
  @maxLength(500)
  description?: string;

  /** ステータス */
  status?: TodoStatus;
}

/** エラーレスポンス */
model ErrorResponse {
  /** エラーメッセージ */
  message: string;

  /** エラーコード */
  code: string;
}

/** ページネーション情報 */
model PaginationInfo {
  /** 現在のページ */
  page: int32;

  /** ページあたりの件数 */
  limit: int32;

  /** 総件数 */
  total: int32;

  /** 総ページ数 */
  totalPages: int32;
}

/** Todoリストレスポンス */
model TodoListResponse {
  /** Todoリスト */
  data: Todo[];

  /** ページネーション情報 */
  pagination: PaginationInfo;
}

// ============================================
// APIエンドポイント定義
// ============================================

@route("/todos")
@tag("Todos")
interface Todos {
  /** 全てのTodoを取得 */
  @get
  list(
    @query page?: int32 = 1,
    @query limit?: int32 = 10,
    @query status?: TodoStatus
  ): TodoListResponse;

  /** 特定のTodoを取得 */
  @get
  @route("{id}")
  get(@path id: int32): Todo | {
    @statusCode statusCode: 404;
    @body error: ErrorResponse;
  };

  /** 新しいTodoを作成 */
  @post
  create(@body body: CreateTodoRequest): {
    @statusCode statusCode: 201;
    @body todo: Todo;
  } | {
    @statusCode statusCode: 400;
    @body error: ErrorResponse;
  };

  /** Todoを更新 */
  @patch
  @route("{id}")
  update(@path id: int32, @body body: UpdateTodoRequest): Todo | {
    @statusCode statusCode: 404;
    @body error: ErrorResponse;
  };

  /** Todoを削除 */
  @delete
  @route("{id}")
  delete(@path id: int32): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body error: ErrorResponse;
  };
}

// ============================================
// ヘルスチェックエンドポイント
// ============================================

/** ヘルスチェックレスポンス */
model HealthResponse {
  /** ステータス */
  status: "ok" | "error";

  /** タイムスタンプ */
  timestamp: utcDateTime;
}

@route("/health")
@tag("Health")
interface Health {
  /** ヘルスチェック */
  @get
  check(): HealthResponse;
}
