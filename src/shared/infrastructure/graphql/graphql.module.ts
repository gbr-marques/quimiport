import type { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { GraphQLError, type ExecutionResult } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { ListarCargasQuimicas } from '../../../modules/cargas/application/use-cases/listar-cargas-quimicas';
import { PrismaCargaQuimicaRepository } from '../../../modules/cargas/infrastructure/persistence/prisma-carga-quimica.repository';
import { BuscarProdutoQuimico } from '../../../modules/produtos/application/use-cases/buscar-produto-quimico';
import { PrismaProdutoQuimicoRepository } from '../../../modules/produtos/infrastructure/persistence/prisma-produto-quimico.repository';
import { ErroDominio } from '../../domain/errors/erro-dominio';
import { registrarEventoApi } from '../http/registrar-evento-api';
import { logger } from '../logging/logger';
import { criarSchemaGraphql, type ContextoGraphql } from './schema';

/**
 * Erros de domínio viram erros GraphQL com o mesmo `codigo` e `regra` da API
 * REST, em `extensions`. Erros internos têm a mensagem ocultada do cliente.
 */
function formatarErro(erro: GraphQLError, res: Response): GraphQLError {
  const original = erro.originalError;
  const contexto = {
    requestId: res.locals.requestId as unknown,
    path: erro.path,
  };

  if (original instanceof ErroDominio) {
    logger.warn(
      {
        event: 'graphql.operation.rejected',
        ...contexto,
        codigo: original.codigo,
        regra: original.regra,
      },
      original.message,
    );
    return new GraphQLError(original.message, {
      nodes: erro.nodes,
      path: erro.path,
      extensions: {
        codigo: original.codigo,
        regra: original.regra,
        detalhes: original.detalhes,
      },
    });
  }

  logger.error(
    {
      event: 'graphql.operation.failed',
      ...contexto,
      erro: erro.message,
      stack: original?.stack,
    },
    'Erro interno do servidor',
  );
  return new GraphQLError('Erro interno do servidor', {
    nodes: erro.nodes,
    path: erro.path,
    extensions: { codigo: 'ERRO_INTERNO' },
  });
}

/** Composição do adapter GraphQL: reutiliza os casos de uso da API REST */
export function criarGraphqlHandler(prisma: PrismaClient) {
  const schema = criarSchemaGraphql({
    listarCargas: new ListarCargasQuimicas(
      new PrismaCargaQuimicaRepository(prisma),
    ),
    buscarProduto: new BuscarProdutoQuimico(
      new PrismaProdutoQuimicoRepository(prisma),
    ),
  });

  return createHandler<ContextoGraphql>({
    schema,
    context: () => ({ produtosCarregados: new Map() }),
    onOperation: (req, args, resultado: ExecutionResult) => {
      const { res } = req.context;
      registrarEventoApi(
        res,
        'graphql.operation.executed',
        'Consulta GraphQL executada',
        {
          operationName: args.operationName ?? null,
          erros: resultado.errors?.length ?? 0,
        },
      );

      if (!resultado.errors?.length) return;
      return {
        ...resultado,
        errors: resultado.errors.map((erro) => formatarErro(erro, res)),
      };
    },
  });
}
