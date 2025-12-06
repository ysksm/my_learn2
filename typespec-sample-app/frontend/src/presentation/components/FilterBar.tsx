import {
  TodoStatus,
  TodoStatusLabels,
  getAllTodoStatuses,
} from "../../domain/value-objects/TodoStatus";
import { PaginationInfo } from "../../domain/repositories/ITodoRepository";

interface FilterBarProps {
  currentStatus: TodoStatus | undefined;
  onStatusChange: (status: TodoStatus | undefined) => void;
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
}

export function FilterBar({
  currentStatus,
  onStatusChange,
  pagination,
  onPageChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-status">
        <label>ステータス:</label>
        <select
          value={currentStatus || ""}
          onChange={(e) =>
            onStatusChange(e.target.value ? (e.target.value as TodoStatus) : undefined)
          }
        >
          <option value="">すべて</option>
          {getAllTodoStatuses().map((status) => (
            <option key={status} value={status}>
              {TodoStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            前へ
          </button>
          <span>
            {pagination.page} / {pagination.totalPages} ページ（全{pagination.total}件）
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            次へ
          </button>
        </div>
      )}

      {pagination && (
        <div className="total-count">
          全 {pagination.total} 件
        </div>
      )}
    </div>
  );
}
