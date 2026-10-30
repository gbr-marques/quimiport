import request from 'supertest';
import {
  appTeste,
  conectarBancoDeTeste,
  corpo,
  desconectarBancoDeTeste,
  novoNome,
} from './support';

describe('API de produtos químicos', () => {
  // Conecta ao banco antes dos testes.
  beforeAll(conectarBancoDeTeste);
  afterAll(desconectarBancoDeTeste);

  // Cria um produto pela rota HTTP e confere a resposta.
  it('Valida o cadastro de produto químico.', async () => {
    // Envia os dados do produto para a API.
    const nome = novoNome('Produto E2E');
    const resposta = await request(appTeste).post('/produtos-quimicos').send({
      nome,
      numeroOnu: '1830',
      classeRisco: 'CLASSE_3',
      grupoCompatibilidade: 'CORROSIVOS',
      estadoFisico: 'LIQUIDO',
    });

    // Confere que o produto foi criado com os dados esperados.
    expect(resposta.status).toBe(201);
    expect(
      corpo<{ nome: string; classeRisco: string; status: string }>(resposta),
    ).toMatchObject({
      nome,
      classeRisco: 'CLASSE_3',
      status: 'ATIVO',
    });
  });

  // Nome vazio deve ser rejeitado pela API.
  it('Valida o bloqueio de cadastro sem nome.', async () => {
    // Envia o cadastro sem um nome válido.
    const resposta = await request(appTeste).post('/produtos-quimicos').send({
      nome: ' ',
      numeroOnu: '1830',
      classeRisco: 'CLASSE_3',
      grupoCompatibilidade: 'CORROSIVOS',
    });

    // Confere que a API rejeitou os dados.
    expect(resposta.status).toBe(400);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe('DADOS_INVALIDOS');
  });

  // Classe de risco ausente deve ser rejeitada pela API.
  it('Valida o bloqueio de cadastro sem classe de risco.', async () => {
    // Envia o cadastro sem informar a classe de risco.
    const resposta = await request(appTeste)
      .post('/produtos-quimicos')
      .send({
        nome: novoNome('Produto E2E'),
        numeroOnu: '1830',
        grupoCompatibilidade: 'CORROSIVOS',
      });

    // Confere que a API rejeitou os dados.
    expect(resposta.status).toBe(400);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe('DADOS_INVALIDOS');
  });

  // Status fora de ATIVO e INATIVO deve ser rejeitado pela API.
  it('Valida o bloqueio de cadastro com status inválido.', async () => {
    // Envia o cadastro com um status inexistente.
    const resposta = await request(appTeste)
      .post('/produtos-quimicos')
      .send({
        nome: novoNome('Produto E2E'),
        numeroOnu: '1830',
        classeRisco: 'CLASSE_3',
        grupoCompatibilidade: 'CORROSIVOS',
        status: 'SUSPENSO',
      });

    // Confere que a API rejeitou o status e informou a regra.
    expect(resposta.status).toBe(400);
    expect(corpo<{ codigo: string; regra: string }>(resposta)).toMatchObject({
      codigo: 'STATUS_PRODUTO_INVALIDO',
      regra: 'RN021',
    });
  });
});
