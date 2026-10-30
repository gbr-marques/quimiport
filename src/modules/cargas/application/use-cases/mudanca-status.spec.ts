import { describe, expect, it, jest } from '@jest/globals';
import { ErroRegraNegocio } from '../../../../shared/domain/errors/erro-dominio';
import { CargaQuimica } from '../../domain/aggregates/carga-quimica';
import { Quantidade } from '../../domain/value-objects/quantidade';
import {
  STATUS_CARGA,
  TRANSICOES_PERMITIDAS,
  type StatusCarga,
} from '../../domain/value-objects/status-carga';
import type { CargaQuimicaRepository } from '../ports/carga-quimica-repository';
import type { UsuarioGateway } from '../ports/usuario-gateway';
import { AtualizarStatusCarga } from './atualizar-status-carga';
import { BloquearCarga } from './bloquear-carga';
import { CancelarCarga } from './cancelar-carga';
import { LiberarCarga } from './liberar-carga';

describe('Status da carga', () => {
  // Cria uma carga de teste.
  function criarCarga(status: StatusCarga, documentacaoValida = true) {
    const data = new Date('2026-01-15T10:00:00.000Z');

    return CargaQuimica.restaurar({
      id: 'carga-1',
      codigo: 'CARGA-001',
      produto: {
        id: 'produto-1',
        nome: 'Produto de teste',
        numeroOnu: '1830',
        classeRisco: 'CLASSE_3',
      },
      quantidade: Quantidade.restaurar(10, 'KG'),
      origem: 'Origem',
      destino: 'Destino',
      responsavelTecnicoId: 'tecnico-1',
      status,
      documentacaoValida,
      dataEntrada: data,
      criadoEm: data,
      atualizadoEm: data,
    });
  }

  // Cria dependências simuladas.
  function criarCaso(carga: CargaQuimica) {
    const repositorio: jest.Mocked<CargaQuimicaRepository> = {
      registrar: jest.fn<CargaQuimicaRepository['registrar']>(),
      salvarMudancaStatus: jest
        .fn<CargaQuimicaRepository['salvarMudancaStatus']>()
        .mockResolvedValue(undefined),
      buscarPorId: jest
        .fn<CargaQuimicaRepository['buscarPorId']>()
        .mockResolvedValue(carga),
      buscarPorCodigo: jest.fn<CargaQuimicaRepository['buscarPorCodigo']>(),
      listar: jest.fn<CargaQuimicaRepository['listar']>(),
    };
    const usuarios: jest.Mocked<UsuarioGateway> = {
      buscarPorId: jest.fn<UsuarioGateway['buscarPorId']>().mockResolvedValue({
        id: 'autor-1',
        ativo: true,
        responsavelTecnico: false,
      }),
    };

    return {
      repositorio,
      usuarios,
      casoAtualizar: new AtualizarStatusCarga(repositorio, usuarios),
      casoBloquear: new BloquearCarga(repositorio, usuarios),
      casoCancelar: new CancelarCarga(repositorio, usuarios),
      casoLiberar: new LiberarCarga(repositorio, usuarios),
    };
  }

  // Rejeita liberação sem documentação.
  it('Valida o bloqueio de liberação sem documentação.', async () => {
    // Cria a carga sem documentação.
    const { casoLiberar, repositorio } = criarCaso(
      criarCarga('EM_INSPECAO', false),
    );

    // Confere o erro e que nada foi salvo.
    await expect(
      casoLiberar.executar('carga-1', 'autor-1'),
    ).rejects.toMatchObject({ codigo: 'DOCUMENTACAO_PENDENTE' });
    expect(repositorio.salvarMudancaStatus.mock.calls).toHaveLength(0);
  });

  // Atualiza o status da carga.
  it('Valida a atualização do status da carga.', async () => {
    // Muda a carga de registrada para análise.
    const { casoAtualizar, repositorio } = criarCaso(criarCarga('REGISTRADA'));

    const carga = await casoAtualizar.executar(
      'carga-1',
      { status: 'EM_ANALISE' },
      'autor-1',
    );

    // Confere o status e que foi salvo.
    expect(carga.status).toBe('EM_ANALISE');
    expect(repositorio.salvarMudancaStatus.mock.calls).toHaveLength(1);
  });

  // Testa as transições permitidas.
  it.each([
    ['REGISTRADA', 'EM_ANALISE'],
    ['REGISTRADA', 'CANCELADA'],
    ['EM_ANALISE', 'EM_INSPECAO'],
    ['EM_ANALISE', 'CANCELADA'],
    ['EM_INSPECAO', 'LIBERADA'],
    ['EM_INSPECAO', 'BLOQUEADA'],
    ['EM_INSPECAO', 'CANCELADA'],
    ['LIBERADA', 'EM_MOVIMENTACAO'],
    ['LIBERADA', 'CANCELADA'],
    ['BLOQUEADA', 'CANCELADA'],
    ['EM_MOVIMENTACAO', 'FINALIZADA'],
  ] as const)(
    'Valida a transição permitida de %s para %s.',
    (statusAtual, proximoStatus) => {
      // Cria a carga no status inicial.
      const carga = criarCarga(statusAtual);

      // Confere a transição e o novo status.
      expect(() =>
        carga.alterarStatus(proximoStatus, {
          autorId: 'autor-1',
          motivo: 'Motivo',
        }),
      ).not.toThrow();
      expect(carga.status).toBe(proximoStatus);
    },
  );

  // Testa as transições proibidas.
  it('Valida o bloqueio das transições não permitidas.', () => {
    // Percorre os pares não permitidos.
    for (const status of STATUS_CARGA) {
      for (const proximoStatus of STATUS_CARGA) {
        if (!TRANSICOES_PERMITIDAS[status].includes(proximoStatus)) {
          const carga = criarCarga(status);

          expect(() =>
            carga.alterarStatus(proximoStatus, {
              autorId: 'autor-1',
              motivo: 'Motivo',
            }),
          ).toThrow(ErroRegraNegocio);
        }
      }
    }
  });

  // Cancela uma carga registrada.
  it('Valida o cancelamento de uma carga com status registrado.', async () => {
    // Executa o cancelamento.
    const { casoCancelar, repositorio } = criarCaso(criarCarga('REGISTRADA'));

    const carga = await casoCancelar.executar(
      'carga-1',
      { motivo: 'Solicitação do cliente' },
      'autor-1',
    );

    // Confere o status e que foi salvo.
    expect(carga.status).toBe('CANCELADA');
    expect(repositorio.salvarMudancaStatus.mock.calls).toHaveLength(1);
  });

  // Rejeita movimentação de carga bloqueada.
  it('Valida o bloqueio de movimentação de carga bloqueada.', () => {
    // Cria e bloqueia a carga.
    const carga = criarCarga('EM_INSPECAO');
    carga.bloquear({ autorId: 'autor-1', motivo: 'Bloqueio de teste' });

    // Confere o bloqueio e a mensagem de erro.
    expect(carga.status).toBe('BLOQUEADA');
    expect(() =>
      carga.alterarStatus('EM_MOVIMENTACAO', { autorId: 'autor-1' }),
    ).toThrow('Carga bloqueada — movimentação proibida');
  });
});
