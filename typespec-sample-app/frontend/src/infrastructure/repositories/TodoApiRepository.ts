import { Todo, CreateTodoParams, UpdateTodoParams, createTodo } from "../../domain/entities/Todo";
import {
  ITodoRepository,
  TodoListResult,
  PaginationInfo,
} from "../../domain/repositories/ITodoRepository";
import { TodoStatus } from "../../domain/value-objects/TodoStatus";
import { HttpClient } from "../api/HttpClient";

// APIレスポンスのDTO（Data Transfer Object）
interface TodoApiDto {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TodoListApiResponse {
  data: TodoApiDto[];
  pagination: PaginationInfo;
}

// DTOからドメインエンティティへの変換
function mapTodoFromApi(dto: TodoApiDto): Todo {
  return createTodo({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    status: dto.status as TodoStatus,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}

// TodoリポジトリのAPI実装
export class TodoApiRepository implements ITodoRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(
    page: number,
    limit: number,
    status?: TodoStatus
  ): Promise<TodoListResult> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append("status", status);
    }

    const response = await this.httpClient.get<TodoListApiResponse>(
      `/todos?${params}`
    );

    return {
      data: response.data.map(mapTodoFromApi),
      pagination: response.pagination,
    };
  }

  async findById(id: number): Promise<Todo | null> {
    try {
      const dto = await this.httpClient.get<TodoApiDto>(`/todos/${id}`);
      return mapTodoFromApi(dto);
    } catch {
      return null;
    }
  }

  async create(params: CreateTodoParams): Promise<Todo> {
    const dto = await this.httpClient.post<TodoApiDto>("/todos", params);
    return mapTodoFromApi(dto);
  }

  async update(id: number, params: UpdateTodoParams): Promise<Todo> {
    const dto = await this.httpClient.patch<TodoApiDto>(`/todos/${id}`, params);
    return mapTodoFromApi(dto);
  }

  async delete(id: number): Promise<void> {
    await this.httpClient.delete(`/todos/${id}`);
  }
}
