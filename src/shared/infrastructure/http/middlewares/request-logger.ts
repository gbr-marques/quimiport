import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../../logging/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.locals.requestId = requestId;

  logger.info(
    {
      event: 'http.request.received',
      requestId,
      method: req.method,
      path: req.path,
    },
    'Requisição recebida',
  );

  res.on('finish', () => {
    logger.info(
      {
        event: 'http.request.completed',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      'Requisição concluída',
    );
  });

  next();
};
