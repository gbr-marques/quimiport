import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { criarCargasQuimicasRouter } from './modules/cargas/infrastructure/cargas.module';
import { criarProdutosQuimicosRouter } from './modules/produtos/infrastructure/produtos.module';
import { criarUsuariosRouter } from './modules/usuarios/infrastructure/usuarios.module';
import {
  rotaNaoEncontrada,
  tratarErros,
} from './shared/infrastructure/http/middlewares/tratar-erros';
import { documentoOpenApi } from './shared/infrastructure/http/openapi';
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

  // Documentação da API: Swagger UI e especificação OpenAPI em JSON
  app.get('/openapi.json', (_req, res) => {
    res.json(documentoOpenApi);
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(documentoOpenApi, {
      customSiteTitle: 'QuimiPort API',
    }),
  );

  app.use('/usuarios', criarUsuariosRouter(prisma));
  app.use('/produtos-quimicos', criarProdutosQuimicosRouter(prisma));
  app.use('/cargas-quimicas', criarCargasQuimicasRouter(prisma));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
