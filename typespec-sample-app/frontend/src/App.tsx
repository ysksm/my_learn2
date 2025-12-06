import { useMemo } from "react";
import { createDefaultContainer, DIContainerProvider } from "./di";
import { TodoPage } from "./presentation";
import "./App.css";

function App() {
  // DIコンテナを作成（依存性注入）
  const container = useMemo(() => createDefaultContainer(), []);

  return (
    <DIContainerProvider value={container}>
      <TodoPage />
    </DIContainerProvider>
  );
}

export default App;
