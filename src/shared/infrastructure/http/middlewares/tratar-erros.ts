import type { ErrorRequestHandler, RequestHandler } from 'express';
import {
  ErroConflito,
  ErroDominio,
  ErroNaoEncontrado,
  ErroRegraNegocio,
  ErroValidacao,
} from '../../../domain/errors/erro-dominio';
import { logger } from '../../logging/logger';

function statusDoErro(erro: ErroDominio): number {
  if (erro instanceof ErroValidacao) return 400;
  if (erro instanceof ErroNaoEncontrado) return 404;
  if (erro instanceof ErroConflito) return 409;
  if (erro instanceof ErroRegraNegocio) return 422;
  return 400;
}

export const rotaNaoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({
    codigo: 'ROTA_NAO_ENCONTRADA',
    mensagem: `Rota ${req.method} ${req.path} não encontrada`,
  });
};

export const tratarErros: ErrorRequestHandler = (erro, req, res, _next) => {
  const contexto = {
    requestId: res.locals.requestId as unknown,
    method: req.method,
    path: req.path,
  };

  if (erro instanceof ErroDominio) {
    const statusCode = statusDoErro(erro);
    // Erros de validação e de regra de negócio (4xx) são esperados: nível warn
    logger.warn(
      {
        event: 'http.request.rejected',
        ...contexto,
        statusCode,
        codigo: erro.codigo,
        regra: erro.regra,
        detalhes: erro.detalhes,
      },
      erro.message,
    );
    res.status(statusCode).json({
      codigo: erro.codigo,
      mensagem: erro.message,
      regra: erro.regra,
      detalhes: erro.detalhes,
    });
    return;
  }

  // JSON malformado no corpo da requisição
  if (erro instanceof SyntaxError && 'body' in erro) {
    logger.warn(
      {
        event: 'http.request.rejected',
        ...contexto,
        statusCode: 400,
        codigo: 'JSON_INVALIDO',
      },
      'Corpo da requisição não é um JSON válido',
    );
    res.status(400).json({
      codigo: 'JSON_INVALIDO',
      mensagem: 'Corpo da requisição não é um JSON válido',
    });
    return;
  }

  logger.error(
    {
      event: 'http.request.failed',
      ...contexto,
      statusCode: 500,
      erro: erro instanceof Error ? erro.message : String(erro),
      stack: erro instanceof Error ? erro.stack : undefined,
    },
    'Erro interno do servidor',
  );
  res.status(500).json({
    codigo: 'ERRO_INTERNO',
    mensagem: 'Erro interno do servidor',
  });
};
