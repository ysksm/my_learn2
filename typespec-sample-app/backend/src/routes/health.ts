import { Router, Request, Response } from "express";
import { HealthResponse } from "../types";

const router = Router();

// GET /health - ヘルスチェック
router.get("/", (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

export default router;
