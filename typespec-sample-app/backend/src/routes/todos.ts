import { Router, Request, Response } from "express";
import { todoRepository } from "../repository";
import {
  TodoStatus,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoListResponse,
  ErrorResponse,
} from "../types";

const router = Router();

// GET /todos - 全てのTodoを取得
router.get("/", (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as TodoStatus | undefined;

  const { data, total } = todoRepository.findAll(page, limit, status);
  const totalPages = Math.ceil(total / limit);

  const response: TodoListResponse = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  res.json(response);
});

// GET /todos/:id - 特定のTodoを取得
router.get("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const todo = todoRepository.findById(id);

  if (!todo) {
    const error: ErrorResponse = {
      message: `Todo with id ${id} not found`,
      code: "NOT_FOUND",
    };
    return res.status(404).json(error);
  }

  res.json(todo);
});

// POST /todos - 新しいTodoを作成
router.post("/", (req: Request, res: Response) => {
  const body: CreateTodoRequest = req.body;

  if (!body.title || body.title.trim().length === 0) {
    const error: ErrorResponse = {
      message: "Title is required",
      code: "VALIDATION_ERROR",
    };
    return res.status(400).json(error);
  }

  if (body.title.length > 100) {
    const error: ErrorResponse = {
      message: "Title must be 100 characters or less",
      code: "VALIDATION_ERROR",
    };
    return res.status(400).json(error);
  }

  const todo = todoRepository.create(body);
  res.status(201).json(todo);
});

// PATCH /todos/:id - Todoを更新
router.patch("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const body: UpdateTodoRequest = req.body;

  const todo = todoRepository.update(id, body);

  if (!todo) {
    const error: ErrorResponse = {
      message: `Todo with id ${id} not found`,
      code: "NOT_FOUND",
    };
    return res.status(404).json(error);
  }

  res.json(todo);
});

// DELETE /todos/:id - Todoを削除
router.delete("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const deleted = todoRepository.delete(id);

  if (!deleted) {
    const error: ErrorResponse = {
      message: `Todo with id ${id} not found`,
      code: "NOT_FOUND",
    };
    return res.status(404).json(error);
  }

  res.status(204).send();
});

export default router;
