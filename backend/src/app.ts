import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { leadRouter } from './routes/lead.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // cors — на случай, когда фронт и бэк живут на разных доменах;
  // локально и на Vercel запросы идут через прокси /api и CORS не нужен
  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use('/api', leadRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: 'not_found' });
  });

  app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed' || err.status === 400) {
      return res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: 'Сервер не понял запрос. Обновите страницу и попробуйте ещё раз.',
      });
    }
    console.error('[api] непредвиденная ошибка:', err);
    return res.status(500).json({
      ok: false,
      error: 'server',
      message: 'На нашей стороне что-то сломалось. Мы уже в курсе.',
    });
  });

  return app;
}
