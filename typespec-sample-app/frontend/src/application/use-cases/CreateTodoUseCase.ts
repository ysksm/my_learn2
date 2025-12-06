import {
  Todo,
  CreateTodoParams,
  validateCreateTodoParams,
} from "../../domain/entities/Todo";
import { ITodoRepository } from "../../domain/repositories/ITodoRepository";

// CreateTodoユースケースの入力
export interface CreateTodoInput {
  title: string;
  description?: string;
}

// CreateTodoユースケースの結果
export interface CreateTodoResult {
  success: boolean;
  todo?: Todo;
  error?: string;
}

// CreateTodoユースケース
export class CreateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(input: CreateTodoInput): Promise<CreateTodoResult> {
    // バリデーション
    const params: CreateTodoParams = {
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
    };

    const validationError = validateCreateTodoParams(params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // リポジトリを通じてTodoを作成
    const todo = await this.todoRepository.create(params);
    return { success: true, todo };
  }
}
