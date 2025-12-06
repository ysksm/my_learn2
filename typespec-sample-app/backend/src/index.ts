import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import todosRouter from "./routes/todos";
import healthRouter from "./routes/health";

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// OpenAPI仕様の読み込み
const openapiPath = path.join(__dirname, "../../typespec/tsp-output/openapi.yaml");
let swaggerDocument: object | null = null;

try {
  swaggerDocument = YAML.load(openapiPath);
} catch (error) {
  console.warn("OpenAPI spec not found. Swagger UI will be disabled.");
}

// Swagger UI
if (swaggerDocument) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// ルート
app.use("/todos", todosRouter);
app.use("/health", healthRouter);

// ルートパス
app.get("/", (_req, res) => {
  res.json({
    name: "Todo API",
    version: "1.0.0",
    description: "TypeSpecで定義されたTodo管理API",
    endpoints: {
      apiDocs: "/api-docs",
      health: "/health",
      todos: "/todos",
    },
  });
});

// エラーハンドリング
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
);

// サーバー起動
app.listen(PORT, () => {
  console.log(`
  ====================================
  Todo API Server
  ====================================
  Server running at:    http://localhost:${PORT}
  API Documentation:    http://localhost:${PORT}/api-docs
  Health Check:         http://localhost:${PORT}/health
  ====================================
  `);
});
