// Domain Layer Exports

// Entities
export type { Todo, CreateTodoParams, UpdateTodoParams } from "./entities";
export {
  createTodo,
  validateCreateTodoParams,
  isCompleted,
  isInProgress,
  isPending,
} from "./entities";

// Value Objects
export type { TodoStatus } from "./value-objects";
export {
  TodoStatusValues,
  TodoStatusLabels,
  TodoStatusColors,
  getAllTodoStatuses,
  parseTodoStatus,
} from "./value-objects";

// Repository Interfaces (DIP)
export type {
  ITodoRepository,
  PaginationInfo,
  TodoListResult,
  IHealthRepository,
  HealthStatus,
} from "./repositories";
