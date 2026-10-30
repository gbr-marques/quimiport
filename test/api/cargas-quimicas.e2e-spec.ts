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
  novoCodigoCarga,
} from './support';

describe('API de cargas químicas', () => {
  let responsavelId: string;

  // Conecta ao banco e cria o responsável dos testes.
  beforeAll(async () => {
    await conectarBancoDeTeste();
    responsavelId = await criarUsuario('RESPONSAVEL_TECNICO');
  });
  afterAll(desconectarBancoDeTeste);

  // Cria uma carga no status necessário para cada teste.
  async function criarCargaEmStatus(
    status: string,
    documentacaoValida = true,
  ): Promise<{ id: string; status: string }> {
    // Cria o produto e a carga pela API.
    const produto = await criarProduto();
    const carga = await criarCarga(
      produto.id,
      responsavelId,
      responsavelId,
      documentacaoValida,
    );

    // Muda o status até chegar ao estado solicitado.
    const caminho: Record<string, string[]> = {
      REGISTRADA: [],
      EM_ANALISE: ['EM_ANALISE'],
      EM_INSPECAO: ['EM_ANALISE', 'EM_INSPECAO'],
      LIBERADA: ['EM_ANALISE', 'EM_INSPECAO', 'LIBERADA'],
      BLOQUEADA: ['EM_ANALISE', 'EM_INSPECAO', 'BLOQUEADA'],
      EM_MOVIMENTACAO: [
        'EM_ANALISE',
        'EM_INSPECAO',
        'LIBERADA',
        'EM_MOVIMENTACAO',
      ],
      FINALIZADA: [
        'EM_ANALISE',
        'EM_INSPECAO',
        'LIBERADA',
        'EM_MOVIMENTACAO',
        'FINALIZADA',
      ],
      CANCELADA: ['CANCELADA'],
    };

    for (const proximoStatus of caminho[status] ?? []) {
      const resposta = await request(appTeste)
        .patch(`/cargas-quimicas/${carga.id}/status`)
        .send({
          status: proximoStatus,
          motivo: 'Preparação do teste',
          autorId: responsavelId,
        });
      if (resposta.status !== 200) {
        throw new Error(
          `Não foi possível preparar o status ${proximoStatus}: ${JSON.stringify(resposta.body)}`,
        );
      }
    }

    return { id: carga.id, status };
  }

  // Cria uma carga usando o endpoint real da API.
  it('Valida o registro de carga química.', async () => {
    // Prepara um produto e registra a carga.
    const produto = await criarProduto();
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      produtoId: produto.id,
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      responsavelTecnicoId: responsavelId,
      autorId: responsavelId,
      documentacaoValida: true,
    });

    // Confere o resultado do cadastro.
    expect(resposta.status).toBe(201);
    const carga = corpo<{
      codigo: string;
      produto: { id: string };
      status: string;
    }>(resposta);

    expect(carga.codigo).toBeTruthy();
    expect(carga.produto.id).toBe(produto.id);
    expect(carga.status).toBe('REGISTRADA');
  });

  // Um produto inativo não pode ser vinculado a uma nova carga.
  it('Valida o bloqueio de carga com produto inativo.', async () => {
    // Tenta registrar a carga com produto inativo.
    const produto = await criarProduto('INATIVO');
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      produtoId: produto.id,
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      responsavelTecnicoId: responsavelId,
      autorId: responsavelId,
    });

    // Confere que a API bloqueou o cadastro.
    expect(resposta.status).toBe(422);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe(
      'PRODUTO_QUIMICO_INATIVO',
    );
  });

  // Uma carga precisa de um produto químico associado.
  it('Valida o bloqueio de carga sem produto químico associado.', async () => {
    // Tenta registrar a carga sem informar o produto.
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      responsavelTecnicoId: responsavelId,
      autorId: responsavelId,
    });

    // Confere que a API apontou o campo do produto.
    expect(resposta.status).toBe(400);
    expect(
      corpo<{ codigo: string; detalhes: { campo: string }[] }>(resposta),
    ).toMatchObject({
      codigo: 'DADOS_INVALIDOS',
      detalhes: [{ campo: 'produtoId' }],
    });
  });

  // O produto informado precisa existir.
  it('Valida o bloqueio de carga com produto químico inexistente.', async () => {
    // Tenta registrar a carga com um produto que não existe.
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      produtoId: randomUUID(),
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      responsavelTecnicoId: responsavelId,
      autorId: responsavelId,
    });

    // Confere que a API não encontrou o produto.
    expect(resposta.status).toBe(404);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe(
      'PRODUTO_QUIMICO_NAO_ENCONTRADO',
    );
  });

  // Toda carga precisa de um responsável técnico informado.
  it('Valida o bloqueio de carga sem responsável técnico.', async () => {
    // Tenta registrar a carga sem informar o responsável.
    const produto = await criarProduto();
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      produtoId: produto.id,
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      autorId: responsavelId,
    });

    // Confere que a API apontou o campo do responsável.
    expect(resposta.status).toBe(400);
    expect(
      corpo<{ codigo: string; detalhes: { campo: string }[] }>(resposta),
    ).toMatchObject({
      codigo: 'DADOS_INVALIDOS',
      detalhes: [{ campo: 'responsavelTecnicoId' }],
    });
  });

  // O responsável técnico precisa ter o cargo de responsável técnico.
  it('Valida o bloqueio de carga com responsável sem o cargo exigido.', async () => {
    // Usa um operador como responsável técnico.
    const produto = await criarProduto();
    const operadorId = await criarUsuario('OPERADOR');
    const resposta = await request(appTeste).post('/cargas-quimicas').send({
      codigo: novoCodigoCarga(),
      produtoId: produto.id,
      quantidade: 10,
      unidadeMedida: 'KG',
      origem: 'Origem E2E',
      destino: 'Destino E2E',
      responsavelTecnicoId: operadorId,
      autorId: responsavelId,
    });

    // Confere que a API bloqueou o cadastro pela regra RN009.
    expect(resposta.status).toBe(422);
    expect(corpo<{ codigo: string; regra: string }>(resposta)).toMatchObject({
      codigo: 'RESPONSAVEL_TECNICO_INVALIDO',
      regra: 'RN009',
    });
  });

  // Quantidades zero e negativas devem ser recusadas.
  it.each([0, -1])(
    'Valida o bloqueio de carga com quantidade inválida.',
    async (quantidade) => {
      // Tenta registrar a carga com uma quantidade inválida.
      const produto = await criarProduto();
      const resposta = await request(appTeste).post('/cargas-quimicas').send({
        codigo: novoCodigoCarga(),
        produtoId: produto.id,
        quantidade,
        unidadeMedida: 'KG',
        origem: 'Origem E2E',
        destino: 'Destino E2E',
        responsavelTecnicoId: responsavelId,
        autorId: responsavelId,
      });

      // Confere que a API rejeitou a quantidade.
      expect(resposta.status).toBe(400);
      expect(corpo<{ codigo: string }>(resposta).codigo).toBe(
        'QUANTIDADE_INVALIDA',
      );
    },
  );

  // Uma carga sem documentação válida não pode ser liberada.
  it('Valida o bloqueio de liberação sem documentação.', async () => {
    // Cria uma carga sem documentação válida e tenta liberá-la.
    const carga = await criarCargaEmStatus('EM_INSPECAO', false);
    const resposta = await request(appTeste)
      .patch(`/cargas-quimicas/${carga.id}/liberar`)
      .send({ autorId: responsavelId });

    // Confere que a liberação foi bloqueada.
    expect(resposta.status).toBe(422);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe(
      'DOCUMENTACAO_PENDENTE',
    );
  });

  // Atualiza o status de uma carga pela API.
  it('Valida a atualização do status da carga.', async () => {
    // Atualiza uma carga registrada para análise.
    const carga = await criarCargaEmStatus('REGISTRADA');
    const resposta = await request(appTeste)
      .patch(`/cargas-quimicas/${carga.id}/status`)
      .send({ status: 'EM_ANALISE', autorId: responsavelId });

    // Confere o novo status.
    expect(resposta.status).toBe(200);
    expect(corpo<{ status: string }>(resposta).status).toBe('EM_ANALISE');
  });

  // Cada par verifica uma transição permitida pela API.
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
    async (statusAtual, proximoStatus) => {
      // Cria a carga no status inicial e faz a transição.
      const carga = await criarCargaEmStatus(statusAtual);
      const resposta = await request(appTeste)
        .patch(`/cargas-quimicas/${carga.id}/status`)
        .send({
          status: proximoStatus,
          motivo: 'Transição E2E',
          autorId: responsavelId,
        });

      // Confere que a transição foi aceita.
      expect(resposta.status).toBe(200);
      expect(corpo<{ status: string }>(resposta).status).toBe(proximoStatus);
    },
  );

  // Transições fora da máquina de estados devem retornar erro de negócio.
  it('Valida o bloqueio das transições não permitidas.', async () => {
    // Lista os status e as transições aceitas.
    const statusIniciais = [
      'REGISTRADA',
      'EM_ANALISE',
      'EM_INSPECAO',
      'LIBERADA',
      'BLOQUEADA',
      'EM_MOVIMENTACAO',
      'FINALIZADA',
      'CANCELADA',
    ];
    const permitidas: Record<string, string[]> = {
      REGISTRADA: ['EM_ANALISE', 'CANCELADA'],
      EM_ANALISE: ['EM_INSPECAO', 'CANCELADA'],
      EM_INSPECAO: ['LIBERADA', 'BLOQUEADA', 'CANCELADA'],
      LIBERADA: ['EM_MOVIMENTACAO', 'CANCELADA'],
      BLOQUEADA: ['CANCELADA'],
      EM_MOVIMENTACAO: ['FINALIZADA'],
      FINALIZADA: [],
      CANCELADA: [],
    };

    // Tenta cada transição que não está permitida.
    for (const statusAtual of statusIniciais) {
      const carga = await criarCargaEmStatus(statusAtual);
      for (const proximoStatus of statusIniciais) {
        if (permitidas[statusAtual].includes(proximoStatus)) continue;

        const resposta = await request(appTeste)
          .patch(`/cargas-quimicas/${carga.id}/status`)
          .send({
            status: proximoStatus,
            motivo: 'Transição inválida E2E',
            autorId: responsavelId,
          });

        // Confere que a API bloqueou a transição.
        expect(resposta.status).toBe(422);
      }
    }
  }, 30000);

  // Cancela uma carga registrada pela rota específica.
  it('Valida o cancelamento de uma carga com status registrado.', async () => {
    // Cancela uma carga registrada.
    const carga = await criarCargaEmStatus('REGISTRADA');
    const resposta = await request(appTeste)
      .patch(`/cargas-quimicas/${carga.id}/cancelar`)
      .send({ motivo: 'Cancelamento E2E', autorId: responsavelId });

    // Confere o status final.
    expect(resposta.status).toBe(200);
    expect(corpo<{ status: string }>(resposta).status).toBe('CANCELADA');
  });

  // Uma carga bloqueada não pode entrar em movimentação.
  it('Valida o bloqueio de movimentação de carga bloqueada.', async () => {
    // Tenta movimentar uma carga bloqueada.
    const carga = await criarCargaEmStatus('BLOQUEADA');
    const resposta = await request(appTeste)
      .patch(`/cargas-quimicas/${carga.id}/status`)
      .send({
        status: 'EM_MOVIMENTACAO',
        autorId: responsavelId,
      });

    // Confere que a movimentação foi bloqueada.
    expect(resposta.status).toBe(422);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe('CARGA_BLOQUEADA');
  });
});
