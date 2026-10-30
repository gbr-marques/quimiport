import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { CargaQuimica } from '../../domain/aggregates/carga-quimica';
import { Quantidade } from '../../domain/value-objects/quantidade';
import { PrismaCargaQuimicaRepository } from './prisma-carga-quimica.repository';

/** Testes unitários do repositório Prisma, sem conexão com o banco de dados. */
describe('PrismaCargaQuimicaRepository', () => {
  // Verifica que a ausência do registro é preservada como null pelo repositório.
  it('Retorna null quando a carga não existe', async () => {
    type FindUniqueArgs = { where: { id: string } };
    const findUnique = jest
      .fn<(args: FindUniqueArgs) => Promise<null>>()
      .mockResolvedValue(null);

    // O teste só precisa simular o delegate e o método usados por buscarPorId.
    const prismaMock = {
      cargaQuimica: { findUnique },
    };

    const prisma = prismaMock as unknown as PrismaClient;

    const repositorio = new PrismaCargaQuimicaRepository(prisma);

    // Confirma o resultado e a consulta enviada ao Prisma.
    await expect(repositorio.buscarPorId('id-inexistente')).resolves.toBeNull();

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'id-inexistente' },
    });
  });

  // Verifica que o registro e seu evento inicial são gravados na mesma transação.
  it('Criar Carga', async () => {
    const dataEntrada = new Date('2026-01-15T10:00:00.000Z');
    const carga = CargaQuimica.registrar({
      codigo: 'CARGA-001',
      produto: {
        id: 'produto-1',
        nome: 'Produto de teste',
        numeroOnu: '1830',
        classeRisco: 'CLASSE_3',
        ativo: true,
      },
      quantidade: Quantidade.criar(10, 'KG'),
      origem: 'Origem',
      destino: 'Destino',
      responsavelTecnico: {
        id: 'responsavel-1',
        ativo: true,
        habilitado: true,
      },
      documentacaoValida: true,
      dataEntrada,
      autorId: 'autor-1',
    });

    const criarCarga = jest
      .fn<(args: { data: Record<string, unknown> }) => Promise<void>>()
      .mockResolvedValue(undefined);
    const criarEventos = jest
      .fn<(args: { data: Record<string, unknown>[] }) => Promise<void>>()
      .mockResolvedValue(undefined);

    const transacao = {
      cargaQuimica: { create: criarCarga },
      historicoCarga: { createMany: criarEventos },
    };
    const executarTransacao = jest.fn(
      async (callback: (tx: typeof transacao) => Promise<void>) =>
        callback(transacao),
    );
    const prisma = {
      $transaction: executarTransacao,
    } as unknown as PrismaClient;

    const repositorio = new PrismaCargaQuimicaRepository(prisma);

    await repositorio.registrar(carga);

    expect(executarTransacao).toHaveBeenCalledTimes(1);
    expect(criarCarga).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: carga.id,
        codigo: 'CARGA-001',
        produtoId: 'produto-1',
        quantidade: 10,
        unidadeMedida: 'KG',
        status: 'REGISTRADA',
      }),
    });
    expect(criarEventos).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          cargaId: carga.id,
          tipoEvento: 'REGISTRO',
          statusAnterior: null,
          statusNovo: 'REGISTRADA',
          autorId: 'autor-1',
        }),
      ],
    });
    expect(carga.eventosPendentes).toHaveLength(0);
  });
});
