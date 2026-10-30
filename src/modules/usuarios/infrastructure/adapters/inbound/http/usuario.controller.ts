import type { Request, Response } from 'express';
import {
  paramsComId,
  validar,
} from '../../../../../../shared/infrastructure/http/validacao';
import { registrarEventoApi } from '../../../../../../shared/infrastructure/http/registrar-evento-api';
import type { AtivarUsuario } from '../../../../application/use-cases/ativar-usuario';
import type { AtualizarUsuario } from '../../../../application/use-cases/atualizar-usuario';
import type { BuscarUsuario } from '../../../../application/use-cases/buscar-usuario';
import type { CriarUsuario } from '../../../../application/use-cases/criar-usuario';
import type { InativarUsuario } from '../../../../application/use-cases/inativar-usuario';
import type { ListarUsuarios } from '../../../../application/use-cases/listar-usuarios';
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  listarUsuariosSchema,
} from './usuario.schemas';

export interface CasosDeUsoUsuario {
  criar: CriarUsuario;
  listar: ListarUsuarios;
  buscar: BuscarUsuario;
  atualizar: AtualizarUsuario;
  inativar: InativarUsuario;
  ativar: AtivarUsuario;
}

/** Adapter de entrada: traduz HTTP <-> casos de uso de usuários */
export class UsuarioController {
  constructor(private readonly casosDeUso: CasosDeUsoUsuario) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    const entrada = validar(criarUsuarioSchema, req.body);
    const usuario = await this.casosDeUso.criar.executar(entrada);
    registrarEventoApi(res, 'usuario.created', 'Usuário registrado', {
      usuarioId: usuario.id,
      cargoProfissional: usuario.cargoProfissional,
    });
    res.status(201).json(usuario);
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const entrada = validar(listarUsuariosSchema, req.query);
    const resultado = await this.casosDeUso.listar.executar(entrada);
    registrarEventoApi(res, 'usuario.listed', 'Usuários consultados', {
      total: resultado.total,
      pagina: resultado.pagina,
    });
    res.json(resultado);
  };

  buscar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const usuario = await this.casosDeUso.buscar.executar(id);
    registrarEventoApi(res, 'usuario.retrieved', 'Usuário consultado', {
      usuarioId: usuario.id,
    });
    res.json(usuario);
  };

  atualizar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const entrada = validar(atualizarUsuarioSchema, req.body);
    const usuario = await this.casosDeUso.atualizar.executar(id, entrada);
    registrarEventoApi(res, 'usuario.updated', 'Usuário atualizado', {
      usuarioId: usuario.id,
    });
    res.json(usuario);
  };

  inativar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const usuario = await this.casosDeUso.inativar.executar(id);
    registrarEventoApi(res, 'usuario.deactivated', 'Usuário inativado', {
      usuarioId: usuario.id,
      status: usuario.status,
    });
    res.json(usuario);
  };

  ativar = async (req: Request, res: Response): Promise<void> => {
    const { id } = validar(paramsComId, req.params);
    const usuario = await this.casosDeUso.ativar.executar(id);
    registrarEventoApi(res, 'usuario.activated', 'Usuário ativado', {
      usuarioId: usuario.id,
      status: usuario.status,
    });
    res.json(usuario);
  };
}
