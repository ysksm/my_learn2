import { ITodoRepository } from "../../domain/repositories/ITodoRepository";

// DeleteTodoユースケースの入力
export interface DeleteTodoInput {
  id: number;
}

// DeleteTodoユースケースの結果
export interface DeleteTodoResult {
  success: boolean;
  error?: string;
}

// DeleteTodoユースケース
export class DeleteTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(input: DeleteTodoInput): Promise<DeleteTodoResult> {
    await this.todoRepository.delete(input.id);
    return { success: true };
  }
}
