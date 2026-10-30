import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import { criarCargasQuimicasRouter } from './modules/cargas/infrastructure/cargas.module';
import { criarProdutosQuimicosRouter } from './modules/produtos/infrastructure/produtos.module';
import { criarUsuariosRouter } from './modules/usuarios/infrastructure/usuarios.module';
import {
  rotaNaoEncontrada,
  tratarErros,
} from './shared/infrastructure/http/middlewares/tratar-erros';
import { requestLogger } from './shared/infrastructure/http/middlewares/request-logger';
import { registrarEventoApi } from './shared/infrastructure/http/registrar-evento-api';

export function criarApp(prisma: PrismaClient): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(express.json());

  app.get('/health', (_req, res) => {
    registrarEventoApi(res, 'health.checked', 'Health check executado', {
      status: 'ok',
    });
    res.json({ status: 'ok' });
  });

  app.use('/usuarios', criarUsuariosRouter(prisma));
  app.use('/produtos-quimicos', criarProdutosQuimicosRouter(prisma));
  app.use('/cargas-quimicas', criarCargasQuimicasRouter(prisma));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
