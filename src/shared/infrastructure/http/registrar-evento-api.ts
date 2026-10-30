import type { Response } from 'express';
import { logger } from '../logging/logger';

export function registrarEventoApi(
  res: Response,
  evento: string,
  mensagem: string,
  dados: Record<string, unknown> = {},
): void {
  const requestId: unknown = res.locals.requestId;
  if (typeof requestId !== 'string') {
    throw new Error('Identificador da requisição não foi definido.');
  }

  logger.info({ event: evento, requestId, ...dados }, mensagem);
}
