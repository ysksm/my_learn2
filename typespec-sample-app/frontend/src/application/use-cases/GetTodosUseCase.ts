import { ITodoRepository, TodoListResult } from "../../domain/repositories/ITodoRepository";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";

// GetTodosユースケースの入力
export interface GetTodosInput {
  page: number;
  limit: number;
  status?: TodoStatus;
}

// GetTodosユースケース
export class GetTodosUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(input: GetTodosInput): Promise<TodoListResult> {
    return await this.todoRepository.findAll(input.page, input.limit, input.status);
  }
}
