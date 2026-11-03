import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  appTeste,
  conectarBancoDeTeste,
  corpo,
  criarCarga,
  criarProduto,
  criarUsuario,
  desconectarBancoDeTeste,
} from './support';

interface RespostaGraphql<T> {
  data: T | null;
  errors?: { message: string; extensions?: { codigo?: string } }[];
}

interface CargaGraphql {
  id: string;
  status: string;
  transicoesPermitidas: string[];
  produto: { id: string };
  produtoAtual: { id: string; status: string };
}

describe('API GraphQL', () => {
  let responsavelId: string;

  // Conecta ao banco e cria o responsável dos testes.
  beforeAll(async () => {
    await conectarBancoDeTeste();
    responsavelId = await criarUsuario('RESPONSAVEL_TECNICO');
  });
  afterAll(desconectarBancoDeTeste);

  function consultar(query: string) {
    return request(appTeste).post('/graphql').send({ query });
  }

  // Consulta a carga registrada pelo status, com o produto atual.
  it('Valida a consulta de cargas por status.', async () => {
    // Cria uma carga e inativa o produto depois do registro.
    const produto = await criarProduto();
    const carga = await criarCarga(produto.id, responsavelId, responsavelId);
    await request(appTeste).patch(`/produtos-quimicos/${produto.id}/inativar`);

    const resposta = await consultar(`{
      cargasPorStatus(status: REGISTRADA, porPagina: 100) {
        itens {
          id
          status
          transicoesPermitidas
          produto { id }
          produtoAtual { id status }
        }
      }
    }`);

    // Confere a carga na lista e o status atual do produto.
    expect(resposta.status).toBe(200);
    const { data } =
      corpo<RespostaGraphql<{ cargasPorStatus: { itens: CargaGraphql[] } }>>(
        resposta,
      );
    const encontrada = data?.cargasPorStatus.itens.find(
      (item) => item.id === carga.id,
    );
    expect(encontrada).toEqual({
      id: carga.id,
      status: 'REGISTRADA',
      transicoesPermitidas: ['EM_ANALISE', 'CANCELADA'],
      produto: { id: produto.id },
      produtoAtual: { id: produto.id, status: 'INATIVO' },
    });
    expect(
      data?.cargasPorStatus.itens.every((item) => item.status === 'REGISTRADA'),
    ).toBe(true);
  });

  // Busca um produto químico pelo identificador.
  it('Valida a consulta de produto químico.', async () => {
    const produto = await criarProduto();

    const resposta = await consultar(
      `{ produtoQuimico(id: "${produto.id}") { id nome status } }`,
    );

    expect(resposta.status).toBe(200);
    expect(
      corpo<RespostaGraphql<{ produtoQuimico: unknown }>>(resposta).data,
    ).toEqual({
      produtoQuimico: { id: produto.id, nome: produto.nome, status: 'ATIVO' },
    });
  });

  // Retorna o código de erro de domínio em extensions.
  it('Valida o erro de produto químico inexistente.', async () => {
    const resposta = await consultar(
      `{ produtoQuimico(id: "${randomUUID()}") { id } }`,
    );

    expect(resposta.status).toBe(200);
    const { data, errors } = corpo<RespostaGraphql<unknown>>(resposta);
    expect(data).toBeNull();
    expect(errors?.[0].extensions?.codigo).toBe(
      'PRODUTO_QUIMICO_NAO_ENCONTRADO',
    );
  });

  // Rejeita status fora do enum. Com Accept application/json, a especificação
  // GraphQL over HTTP responde 200 mesmo para erros de validação.
  it('Valida o bloqueio de status inválido.', async () => {
    const resposta = await consultar(
      '{ cargasPorStatus(status: EM_TRANSITO) { total } }',
    );

    expect(resposta.status).toBe(200);
    const { data, errors } = corpo<RespostaGraphql<unknown>>(resposta);
    expect(data).toBeUndefined();
    expect(errors?.[0].message).toContain('EM_TRANSITO');
  });
});
