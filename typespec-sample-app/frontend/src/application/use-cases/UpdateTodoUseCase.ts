import { Todo, UpdateTodoParams } from "../../domain/entities/Todo";
import { ITodoRepository } from "../../domain/repositories/ITodoRepository";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";

// UpdateTodoユースケースの入力
export interface UpdateTodoInput {
  id: number;
  title?: string;
  description?: string;
  status?: TodoStatus;
}

// UpdateTodoユースケースの結果
export interface UpdateTodoResult {
  success: boolean;
  todo?: Todo;
  error?: string;
}

// UpdateTodoユースケース
export class UpdateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(input: UpdateTodoInput): Promise<UpdateTodoResult> {
    // バリデーション
    if (input.title !== undefined && input.title.trim().length === 0) {
      return { success: false, error: "タイトルを入力してください" };
    }

    if (input.title !== undefined && input.title.length > 100) {
      return { success: false, error: "タイトルは100文字以内で入力してください" };
    }

    if (input.description !== undefined && input.description.length > 500) {
      return { success: false, error: "説明は500文字以内で入力してください" };
    }

    const params: UpdateTodoParams = {
      title: input.title?.trim(),
      description: input.description?.trim(),
      status: input.status,
    };

    // リポジトリを通じてTodoを更新
    const todo = await this.todoRepository.update(input.id, params);
    return { success: true, todo };
  }
}
