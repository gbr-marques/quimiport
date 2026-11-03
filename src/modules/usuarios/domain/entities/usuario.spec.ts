import { describe, expect, it } from '@jest/globals';
import {
  ErroRegraNegocio,
  ErroValidacao,
} from '../../../../shared/domain/errors/erro-dominio';
import { Cpf } from '../value-objects/cpf';
import { Usuario } from './usuario';

describe('Usuario', () => {
  // Dados de um usuário válido.
  const dados = {
    nome: '  Maria da Silva  ',
    cpf: Cpf.criar('529.982.247-25'),
    cargoProfissional: 'RESPONSAVEL_TECNICO' as const,
    dataNascimento: new Date('1990-05-14T00:00:00.000Z'),
    senhaHash: 'hash-da-senha',
  };

  // Cria um usuário válido.
  it('Valida o cadastro de usuário.', () => {
    const usuario = Usuario.criar(dados);

    // Confere os dados normalizados e o status inicial.
    expect(usuario.id).toBeDefined();
    expect(usuario.nome).toBe('Maria da Silva');
    expect(usuario.cpf.valor).toBe('52998224725');
    expect(usuario.cargoProfissional).toBe('RESPONSAVEL_TECNICO');
    expect(usuario.dataNascimento).toEqual(dados.dataNascimento);
    expect(usuario.senhaHash).toBe('hash-da-senha');
    expect(usuario.status).toBe('ATIVO');
    expect(usuario.estaAtivo()).toBe(true);
    expect(usuario.criadoEm).toEqual(usuario.atualizadoEm);
  });

  // Rejeita nome vazio ou longo demais.
  it.each([
    ['vazio', '   '],
    ['com mais de 150 caracteres', 'a'.repeat(151)],
  ])('Valida o bloqueio de cadastro com nome %s.', (_descricao, nome) => {
    expect(() => Usuario.criar({ ...dados, nome })).toThrow(ErroValidacao);
  });

  // Rejeita data de nascimento inválida ou futura.
  it.each([
    ['inválida', new Date('data-invalida')],
    ['futura', new Date(Date.now() + 86_400_000)],
  ])(
    'Valida o bloqueio de cadastro com data de nascimento %s.',
    (_descricao, dataNascimento) => {
      expect(() => Usuario.criar({ ...dados, dataNascimento })).toThrow(
        expect.objectContaining({ codigo: 'DATA_NASCIMENTO_INVALIDA' }),
      );
    },
  );

  // Atualiza somente os campos informados.
  it('Valida a atualização dos dados do usuário.', () => {
    const usuario = Usuario.criar(dados);
    const novaData = new Date('1985-01-01T00:00:00.000Z');

    usuario.atualizar({
      nome: 'Maria Souza',
      cargoProfissional: 'INSPETOR',
      dataNascimento: novaData,
    });

    // Confere os novos dados e que o CPF não mudou.
    expect(usuario.nome).toBe('Maria Souza');
    expect(usuario.cargoProfissional).toBe('INSPETOR');
    expect(usuario.dataNascimento).toEqual(novaData);
    expect(usuario.cpf.valor).toBe('52998224725');
  });

  // Mantém os dados quando nada é informado.
  it('Valida a atualização sem campos informados.', () => {
    const usuario = Usuario.criar(dados);

    usuario.atualizar({});

    expect(usuario.nome).toBe('Maria da Silva');
    expect(usuario.cargoProfissional).toBe('RESPONSAVEL_TECNICO');
  });

  // Inativa e reativa o usuário (exclusão lógica).
  it('Valida a inativação e a reativação do usuário.', () => {
    const usuario = Usuario.criar(dados);

    usuario.inativar();
    expect(usuario.status).toBe('INATIVO');
    expect(usuario.estaAtivo()).toBe(false);

    usuario.ativar();
    expect(usuario.status).toBe('ATIVO');
  });

  // Rejeita inativar um usuário inativo e ativar um usuário ativo.
  it('Valida o bloqueio de inativação e ativação repetidas.', () => {
    const usuario = Usuario.criar(dados);

    expect(() => usuario.ativar()).toThrow(ErroRegraNegocio);
    usuario.inativar();
    expect(() => usuario.inativar()).toThrow(ErroRegraNegocio);
  });

  // Reconstrói um usuário persistido sem alterar os dados.
  it('Valida a restauração de um usuário persistido.', () => {
    const original = Usuario.criar(dados);
    const restaurado = Usuario.restaurar({
      id: original.id,
      nome: original.nome,
      cpf: original.cpf,
      cargoProfissional: original.cargoProfissional,
      dataNascimento: original.dataNascimento,
      senhaHash: original.senhaHash,
      status: 'INATIVO',
      criadoEm: original.criadoEm,
      atualizadoEm: original.atualizadoEm,
    });

    expect(restaurado.id).toBe(original.id);
    expect(restaurado.status).toBe('INATIVO');
  });
});
