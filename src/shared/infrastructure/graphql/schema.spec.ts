import { describe, expect, it, jest } from '@jest/globals';
import { graphql } from 'graphql';
import type {
  CargaQuimicaSaida,
  ListaCargasQuimicasSaida,
} from '../../../modules/cargas/application/dto/carga-quimica.dto';
import type { ProdutoQuimicoSaida } from '../../../modules/produtos/application/dto/produto-quimico.dto';
import { ErroNaoEncontrado } from '../../domain/errors/erro-dominio';
import { criarSchemaGraphql, type CasosDeUsoGraphql } from './schema';

describe('Schema GraphQL', () => {
  const idProduto = '6f1c2b0e-8d4a-4c1e-9b7a-2f3d4e5f6a7b';

  // Produto e cargas usados nos testes.
  const produto: ProdutoQuimicoSaida = {
    id: idProduto,
    nome: 'Ácido Sulfúrico',
    descricao: null,
    numeroOnu: 'UN1830',
    classeRisco: 'CLASSE_8',
    grupoCompatibilidade: 'CORROSIVOS',
    estadoFisico: 'LIQUIDO',
    status: 'INATIVO',
    criadoEm: '2026-10-01T00:00:00.000Z',
    atualizadoEm: '2026-10-02T00:00:00.000Z',
  };

  function criarCarga(codigo: string): CargaQuimicaSaida {
    return {
      id: `id-${codigo}`,
      codigo,
      produto: {
        id: idProduto,
        nome: 'Nome no registro',
        numeroOnu: 'UN1830',
        classeRisco: 'CLASSE_8',
      },
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem',
      destino: 'Destino',
      responsavelTecnicoId: 'tecnico-1',
      status: 'EM_INSPECAO',
      documentacaoValida: true,
      dataEntrada: '2026-10-01T00:00:00.000Z',
      criadoEm: '2026-10-01T00:00:00.000Z',
      atualizadoEm: '2026-10-01T00:00:00.000Z',
    };
  }

  // Cria o schema com casos de uso simulados.
  function criarCaso() {
    const lista: ListaCargasQuimicasSaida = {
      itens: [criarCarga('C-1'), criarCarga('C-2')],
      total: 2,
      pagina: 1,
      porPagina: 20,
      totalPaginas: 1,
    };
    const casos = {
      listarCargas: {
        executar: jest
          .fn<CasosDeUsoGraphql['listarCargas']['executar']>()
          .mockResolvedValue(lista),
      },
      buscarProduto: {
        executar: jest
          .fn<CasosDeUsoGraphql['buscarProduto']['executar']>()
          .mockResolvedValue(produto),
      },
    };
    const executar = (source: string) =>
      graphql({
        schema: criarSchemaGraphql(casos),
        source,
        contextValue: { produtosCarregados: new Map() },
      });
    return { casos, executar };
  }

  // Consulta cargas por status com o produto atual e as transições.
  it('Valida a consulta de cargas por status.', async () => {
    const { casos, executar } = criarCaso();

    const resultado = await executar(`{
      cargasPorStatus(status: EM_INSPECAO, porPagina: 10) {
        total
        itens {
          codigo
          status
          transicoesPermitidas
          produto { nome }
          produtoAtual { nome status }
        }
      }
    }`);

    // Confere o filtro repassado ao caso de uso e os dados retornados.
    expect(resultado.errors).toBeUndefined();
    expect(casos.listarCargas.executar).toHaveBeenCalledWith({
      status: 'EM_INSPECAO',
      pagina: undefined,
      porPagina: 10,
    });
    expect(resultado.data).toEqual({
      cargasPorStatus: {
        total: 2,
        itens: ['C-1', 'C-2'].map((codigo) => ({
          codigo,
          status: 'EM_INSPECAO',
          transicoesPermitidas: ['LIBERADA', 'BLOQUEADA', 'CANCELADA'],
          produto: { nome: 'Nome no registro' },
          produtoAtual: { nome: 'Ácido Sulfúrico', status: 'INATIVO' },
        })),
      },
    });
  });

  // O mesmo produto é buscado uma única vez por consulta.
  it('Valida que o produto atual é buscado uma vez por consulta.', async () => {
    const { casos, executar } = criarCaso();

    await executar(
      '{ cargasPorStatus(status: EM_INSPECAO) { itens { produtoAtual { id } } } }',
    );

    expect(casos.buscarProduto.executar).toHaveBeenCalledTimes(1);
  });

  // Rejeita status fora do enum antes de chamar o caso de uso.
  it('Valida o bloqueio de status inválido.', async () => {
    const { casos, executar } = criarCaso();

    const resultado = await executar(
      '{ cargasPorStatus(status: EM_TRANSITO) { total } }',
    );

    expect(resultado.errors?.[0].message).toContain('EM_TRANSITO');
    expect(casos.listarCargas.executar).not.toHaveBeenCalled();
  });

  // Busca um produto químico pelo identificador.
  it('Valida a consulta de produto químico.', async () => {
    const { executar } = criarCaso();

    const resultado = await executar(
      `{ produtoQuimico(id: "${idProduto}") { nome classeRisco status } }`,
    );

    expect(resultado.data).toEqual({
      produtoQuimico: {
        nome: 'Ácido Sulfúrico',
        classeRisco: 'CLASSE_8',
        status: 'INATIVO',
      },
    });
  });

  // Rejeita identificador que não é UUID, sem chamar o caso de uso.
  it('Valida o bloqueio de identificador inválido.', async () => {
    const { casos, executar } = criarCaso();

    const resultado = await executar('{ produtoQuimico(id: "abc") { nome } }');

    expect(resultado.errors?.[0].originalError).toMatchObject({
      codigo: 'DADOS_INVALIDOS',
    });
    expect(casos.buscarProduto.executar).not.toHaveBeenCalled();
  });

  // Repassa o erro de domínio do caso de uso.
  it('Valida o erro de produto inexistente.', async () => {
    const { casos, executar } = criarCaso();
    casos.buscarProduto.executar.mockRejectedValue(
      new ErroNaoEncontrado(
        'PRODUTO_QUIMICO_NAO_ENCONTRADO',
        'Produto químico não encontrado',
      ),
    );

    const resultado = await executar(
      `{ produtoQuimico(id: "${idProduto}") { nome } }`,
    );

    expect(resultado.data).toBeNull();
    expect(resultado.errors?.[0].originalError).toMatchObject({
      codigo: 'PRODUTO_QUIMICO_NAO_ENCONTRADO',
    });
  });
});
