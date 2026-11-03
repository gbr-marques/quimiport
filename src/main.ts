import { env } from './shared/config/env';
import { prisma } from './shared/infrastructure/database/prisma';
import { logger } from './shared/infrastructure/logging/logger';
import { criarApp } from './app';

function bootstrap(): void {
  const app = criarApp(prisma);

  const servidor = app.listen(env.porta, () => {
    logger.info(
      { event: 'server.started', porta: env.porta, ambiente: env.nodeEnv },
      'Servidor iniciado',
    );
  });

  const encerrar = (sinal: NodeJS.Signals): void => {
    logger.info(
      { event: 'server.stopping', sinal },
      'Sinal recebido, encerrando servidor',
    );
    servidor.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}

bootstrap();
