import type { Request, Response } from 'express';
import {
  paramsComId,
  validar,
} from '../../../../../../shared/infrastructure/http/validacao';
import { registrarEventoApi } from '../../../../../../shared/infrastructure/http/registrar-evento-api';
import type { AtualizarProdutoQuimico } from '../../../../application/use-cases/atualizar-produto-quimico';
import type { BuscarProdutoQuimico } from '../../../../application/use-cases/buscar-produto-quimico';
import type { CriarProdutoQuimico } from '../../../../application/use-cases/criar-produto-quimico';
import type { InativarProdutoQuimico } from '../../../../application/use-cases/inativar-produto-quimico';
import type { ListarProdutosQuimicos } from '../../../../application/use-cases/listar-produtos-quimicos';
import {
  atualizarProdutoQuimicoSchema,
  criarProdutoQuimicoSchema,
  listarProdutosQuimicosSchema,
} from './produto-quimico.schemas';

export interface CasosDeUsoProdutoQuimico {
  criar: CriarProdutoQuimico;
  listar: ListarProdutosQuimicos;
  buscar: BuscarProdutoQuimico;
  atualizar: AtualizarProdutoQuimico;
  inativar: InativarProdutoQuimico;
}

/** Adapter de entrada: traduz HTTP <-> casos de uso de produtos químicos */
export class ProdutoQuimicoController {
  constructor(private readonly casosDeUso: CasosDeUsoProdutoQuimico) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    const entrada = validar(criarProdutoQuimicoSchema, req.body);
    const produto = await this.casosDeUso.criar.executar(entrada);
    registrarEventoApi(res, 'produto.created', 'Produto químico registrado', {
      produtoId: produto.id,
      classeRisco: produto.classeRisco,
    });
    res.status(201).json(produto);
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const entrada = validar(listarProdutosQuimicosSchema, req.query);
    const resultado = await this.casosDeUso.listar.executar(entrada);
    registrarEventoApi(res, 'produto.listed', 'Produtos químicos consultados', {
      total: resultado.total,
      pagina: resultado.pagina,
    });
    res.json(resultado);
  };

  buscar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const produto = await this.casosDeUso.buscar.executar(id);
    registrarEventoApi(res, 'produto.retrieved', 'Produto químico consultado', {
      produtoId: produto.id,
    });
    res.json(produto);
  };

  atualizar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const entrada = validar(atualizarProdutoQuimicoSchema, req.body);
    const produto = await this.casosDeUso.atualizar.executar(id, entrada);
    registrarEventoApi(res, 'produto.updated', 'Produto químico atualizado', {
      produtoId: produto.id,
    });
    res.json(produto);
  };

  inativar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const produto = await this.casosDeUso.inativar.executar(id);
    registrarEventoApi(
      res,
      'produto.deactivated',
      'Produto químico inativado',
      {
        produtoId: produto.id,
        status: produto.status,
      },
    );
    res.json(produto);
  };
}
