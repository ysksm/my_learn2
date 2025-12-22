import { Router, Request, Response } from 'express';
import type { MetricsCollector } from '../collectors';

export function createApiRouter(collector: MetricsCollector | null): Router {
  const router = Router();

  // ミドルウェア: CDP 接続チェック
  const requireConnection = (req: Request, res: Response, next: () => void) => {
    if (!collector) {
      res.status(503).json({ error: 'CDP not connected' });
      return;
    }
    next();
  };

  /**
   * GET /api/metrics
   * 現在のメトリクスを取得
   */
  router.get('/metrics', requireConnection, async (req: Request, res: Response) => {
    try {
      const metrics = await collector!.collectAll();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/profiling/cpu/start
   * CPU プロファイリングを開始
   */
  router.post('/profiling/cpu/start', requireConnection, async (req: Request, res: Response) => {
    try {
      if (collector!.isCpuProfiling) {
        res.status(400).json({ error: 'Profiling already in progress' });
        return;
      }
      await collector!.startCpuProfiling();
      res.json({ status: 'started' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/profiling/cpu/stop
   * CPU プロファイリングを停止
   */
  router.post('/profiling/cpu/stop', requireConnection, async (req: Request, res: Response) => {
    try {
      if (!collector!.isCpuProfiling) {
        res.status(400).json({ error: 'Profiling not started' });
        return;
      }
      const profile = await collector!.stopCpuProfiling();
      const summary = collector!.profiler.analyzePprofile(profile);
      res.json({ profile, summary });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/memory/snapshot
   * ヒープスナップショットを取得
   */
  router.post('/memory/snapshot', requireConnection, async (req: Request, res: Response) => {
    try {
      const snapshot = await collector!.takeHeapSnapshot();
      res.json({ size: snapshot.length, snapshot: snapshot.substring(0, 1000) + '...' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/memory/gc
   * ガベージコレクションを強制実行
   */
  router.post('/memory/gc', requireConnection, async (req: Request, res: Response) => {
    try {
      await collector!.collectGarbage();
      res.json({ status: 'gc_completed' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/network/requests
   * ネットワークリクエスト一覧を取得
   */
  router.get('/network/requests', requireConnection, (req: Request, res: Response) => {
    const requests = collector!.network.getRequests();
    res.json({ requests, count: requests.length });
  });

  /**
   * DELETE /api/network/requests
   * ネットワーク記録をクリア
   */
  router.delete('/network/requests', requireConnection, (req: Request, res: Response) => {
    collector!.clearNetworkRequests();
    res.json({ status: 'cleared' });
  });

  /**
   * POST /api/page/reload
   * ページをリロード
   */
  router.post('/page/reload', requireConnection, async (req: Request, res: Response) => {
    try {
      const ignoreCache = req.body?.ignoreCache ?? false;
      await collector!.reloadPage(ignoreCache);
      res.json({ status: 'reloading' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/page/navigate
   * 指定URLに移動
   */
  router.post('/page/navigate', requireConnection, async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }
      await collector!.navigateTo(url);
      res.json({ status: 'navigating', url });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
