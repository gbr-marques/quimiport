import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  appTeste,
  conectarBancoDeTeste,
  corpo,
  criarCpfValido,
  desconectarBancoDeTeste,
  novoNome,
} from './support';

interface UsuarioResposta {
  id: string;
  nome: string;
  cpf: string;
  cargoProfissional: string;
  dataNascimento: string;
  status: string;
}

describe('API de usuários', () => {
  // Conecta ao banco antes dos testes.
  beforeAll(conectarBancoDeTeste);
  afterAll(desconectarBancoDeTeste);

  // Monta os dados de um usuário válido.
  function dadosUsuario(cpf = criarCpfValido()) {
    return {
      nome: novoNome('Usuário E2E'),
      cpf,
      cargoProfissional: 'OPERADOR',
      dataNascimento: '1990-01-01',
      senha: 'SenhaTeste123',
    };
  }

  // Cria um usuário pela rota HTTP e devolve o corpo da resposta.
  async function cadastrar(): Promise<UsuarioResposta> {
    const resposta = await request(appTeste)
      .post('/usuarios')
      .send(dadosUsuario());
    expect(resposta.status).toBe(201);
    return corpo<UsuarioResposta>(resposta);
  }

  // Cadastra um usuário sem expor a senha.
  it('Valida o cadastro de usuário.', async () => {
    const dados = dadosUsuario();

    const resposta = await request(appTeste).post('/usuarios').send(dados);

    // Confere os dados, o CPF formatado e que a senha não é retornada.
    expect(resposta.status).toBe(201);
    const usuario = corpo<UsuarioResposta & Record<string, unknown>>(resposta);
    expect(usuario).toMatchObject({
      nome: dados.nome,
      cargoProfissional: 'OPERADOR',
      dataNascimento: '1990-01-01',
      status: 'ATIVO',
    });
    expect(usuario.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(usuario).not.toHaveProperty('senha');
    expect(usuario).not.toHaveProperty('senhaHash');
  });

  // Rejeita CPF inválido.
  it('Valida o bloqueio de cadastro com CPF inválido.', async () => {
    const resposta = await request(appTeste)
      .post('/usuarios')
      .send(dadosUsuario('111.111.111-11'));

    expect(resposta.status).toBe(400);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe('CPF_INVALIDO');
  });

  // Rejeita CPF já cadastrado.
  it('Valida o bloqueio de cadastro com CPF duplicado.', async () => {
    const cpf = criarCpfValido();
    await request(appTeste).post('/usuarios').send(dadosUsuario(cpf));

    const resposta = await request(appTeste)
      .post('/usuarios')
      .send(dadosUsuario(cpf));

    expect(resposta.status).toBe(409);
    expect(corpo<{ codigo: string }>(resposta).codigo).toBe(
      'CPF_JA_CADASTRADO',
    );
  });

  // Busca um usuário existente e rejeita um inexistente.
  it('Valida a busca de usuário por identificador.', async () => {
    const usuario = await cadastrar();

    const encontrado = await request(appTeste).get(`/usuarios/${usuario.id}`);
    const inexistente = await request(appTeste).get(
      `/usuarios/${randomUUID()}`,
    );

    expect(encontrado.status).toBe(200);
    expect(corpo<UsuarioResposta>(encontrado).id).toBe(usuario.id);
    expect(inexistente.status).toBe(404);
    expect(corpo<{ codigo: string }>(inexistente).codigo).toBe(
      'USUARIO_NAO_ENCONTRADO',
    );
  });

  // Atualiza apenas os campos informados.
  it('Valida a atualização de usuário.', async () => {
    const usuario = await cadastrar();

    const resposta = await request(appTeste)
      .patch(`/usuarios/${usuario.id}`)
      .send({ cargoProfissional: 'RESPONSAVEL_TECNICO' });

    expect(resposta.status).toBe(200);
    expect(corpo<UsuarioResposta>(resposta)).toMatchObject({
      nome: usuario.nome,
      cargoProfissional: 'RESPONSAVEL_TECNICO',
    });
  });

  // Inativa e reativa o usuário (exclusão lógica).
  it('Valida a inativação e a reativação de usuário.', async () => {
    const usuario = await cadastrar();

    const inativado = await request(appTeste).patch(
      `/usuarios/${usuario.id}/inativar`,
    );
    const repetido = await request(appTeste).patch(
      `/usuarios/${usuario.id}/inativar`,
    );
    const reativado = await request(appTeste).patch(
      `/usuarios/${usuario.id}/ativar`,
    );

    expect(inativado.status).toBe(200);
    expect(corpo<UsuarioResposta>(inativado).status).toBe('INATIVO');
    expect(repetido.status).toBe(422);
    expect(corpo<{ codigo: string }>(repetido).codigo).toBe(
      'USUARIO_JA_INATIVO',
    );
    expect(reativado.status).toBe(200);
    expect(corpo<UsuarioResposta>(reativado).status).toBe('ATIVO');
  });

  // Lista usuários filtrando por status.
  it('Valida a listagem de usuários por status.', async () => {
    const usuario = await cadastrar();
    await request(appTeste).patch(`/usuarios/${usuario.id}/inativar`);

    const resposta = await request(appTeste)
      .get('/usuarios')
      .query({ status: 'INATIVO', porPagina: 100 });

    expect(resposta.status).toBe(200);
    const { itens } = corpo<{ itens: UsuarioResposta[] }>(resposta);
    expect(itens.every((item) => item.status === 'INATIVO')).toBe(true);
  });
});
