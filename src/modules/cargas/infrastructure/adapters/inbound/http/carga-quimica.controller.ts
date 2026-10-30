import type { Request, Response } from 'express';
import {
  paramsComId,
  validar,
} from '../../../../../../shared/infrastructure/http/validacao';
import { registrarEventoApi } from '../../../../../../shared/infrastructure/http/registrar-evento-api';
import type { AtualizarStatusCarga } from '../../../../application/use-cases/atualizar-status-carga';
import type { BloquearCarga } from '../../../../application/use-cases/bloquear-carga';
import type { BuscarCargaQuimica } from '../../../../application/use-cases/buscar-carga-quimica';
import type { CancelarCarga } from '../../../../application/use-cases/cancelar-carga';
import type { LiberarCarga } from '../../../../application/use-cases/liberar-carga';
import type { ListarCargasQuimicas } from '../../../../application/use-cases/listar-cargas-quimicas';
import type { RegistrarCargaQuimica } from '../../../../application/use-cases/registrar-carga-quimica';
import {
  atualizarStatusCargaSchema,
  liberarCargaSchema,
  listarCargasQuimicasSchema,
  motivoSchema,
  registrarCargaQuimicaSchema,
} from './carga-quimica.schemas';

export interface CasosDeUsoCargaQuimica {
  registrar: RegistrarCargaQuimica;
  listar: ListarCargasQuimicas;
  buscar: BuscarCargaQuimica;
  atualizarStatus: AtualizarStatusCarga;
  bloquear: BloquearCarga;
  liberar: LiberarCarga;
  cancelar: CancelarCarga;
}

const bloqueioSchema = motivoSchema('bloquear');
const cancelamentoSchema = motivoSchema('cancelar');

/**
 * Adapter de entrada: traduz HTTP <-> casos de uso de cargas químicas.
 * O autorId vem no corpo; quando houver autenticação, passará a vir do
 * usuário autenticado sem mudança nos casos de uso.
 */
export class CargaQuimicaController {
  constructor(private readonly casosDeUso: CasosDeUsoCargaQuimica) {}

  registrar = async (req: Request, res: Response): Promise<void> => {
    const { autorId, ...entrada } = validar(
      registrarCargaQuimicaSchema,
      req.body,
    );
    const carga = await this.casosDeUso.registrar.executar(entrada, autorId);
    registrarEventoApi(res, 'carga.created', 'Carga registrada', {
      cargaId: carga.id,
      produtoId: carga.produto.id,
      quantidade: carga.quantidade,
      unidadeMedida: carga.unidadeMedida,
    });
    res.status(201).json(carga);
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const entrada = validar(listarCargasQuimicasSchema, req.query);
    const resultado = await this.casosDeUso.listar.executar(entrada);
    registrarEventoApi(res, 'carga.listed', 'Cargas consultadas', {
      total: resultado.total,
      pagina: resultado.pagina,
    });
    res.json(resultado);
  };

  buscar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const carga = await this.casosDeUso.buscar.executar(id);
    registrarEventoApi(res, 'carga.retrieved', 'Carga consultada', {
      cargaId: carga.id,
    });
    res.json(carga);
  };

  atualizarStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const { autorId, ...entrada } = validar(
      atualizarStatusCargaSchema,
      req.body,
    );
    const carga = await this.casosDeUso.atualizarStatus.executar(
      id,
      entrada,
      autorId,
    );
    registrarEventoApi(
      res,
      'carga.status.updated',
      'Status da carga atualizado',
      {
        cargaId: carga.id,
        status: carga.status,
      },
    );
    res.json(carga);
  };

  bloquear = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const { autorId, ...entrada } = validar(bloqueioSchema, req.body);
    const carga = await this.casosDeUso.bloquear.executar(id, entrada, autorId);
    registrarEventoApi(res, 'carga.blocked', 'Carga bloqueada', {
      cargaId: carga.id,
      status: carga.status,
    });
    res.json(carga);
  };

  liberar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const { autorId } = validar(liberarCargaSchema, req.body);
    const carga = await this.casosDeUso.liberar.executar(id, autorId);
    registrarEventoApi(res, 'carga.released', 'Carga liberada', {
      cargaId: carga.id,
      status: carga.status,
    });
    res.json(carga);
  };

  cancelar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const { autorId, ...entrada } = validar(cancelamentoSchema, req.body);
    const carga = await this.casosDeUso.cancelar.executar(id, entrada, autorId);
    registrarEventoApi(res, 'carga.cancelled', 'Carga cancelada', {
      cargaId: carga.id,
      status: carga.status,
    });
    res.json(carga);
  };
}
