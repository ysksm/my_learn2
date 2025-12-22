import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CDP Performance Monitor',
    timestamp: new Date().toISOString(),
  });
});

export default router;
