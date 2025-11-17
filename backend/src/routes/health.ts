import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    version: process.env.GIT_COMMIT || 'dev',
    region: process.env.DEPLOY_REGION || 'local',
  });
});

router.get('/readiness', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    services: {
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      realtime: process.env.REALTIME_ALLOWED_ORIGINS ? 'configured' : 'default',
    },
  });
});

export default router;
