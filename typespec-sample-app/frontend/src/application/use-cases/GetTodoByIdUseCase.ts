import { Todo } from "../../domain/entities/Todo";
import { ITodoRepository } from "../../domain/repositories/ITodoRepository";

// GetTodoByIdユースケースの入力
export interface GetTodoByIdInput {
  id: number;
}

// GetTodoByIdユースケース
export class GetTodoByIdUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(input: GetTodoByIdInput): Promise<Todo | null> {
    return await this.todoRepository.findById(input.id);
  }
}
