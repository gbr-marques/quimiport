import { describe, expect, it } from '@jest/globals';
import { ErroValidacao } from '../../../../shared/domain/errors/erro-dominio';
import { criarCargoProfissional } from './cargo-profissional';
import { Cpf } from './cpf';
import { Senha } from './senha';
import { criarStatusUsuario } from './status-usuario';

describe('Value Objects de usuário', () => {
  describe('Cpf', () => {
    // Aceita CPF com e sem máscara.
    it.each(['529.982.247-25', '52998224725'])(
      'Valida o CPF %s.',
      (entrada) => {
        const cpf = Cpf.criar(entrada);

        // Confere que fica apenas com dígitos e que formata com máscara.
        expect(cpf.valor).toBe('52998224725');
        expect(cpf.formatado()).toBe('529.982.247-25');
      },
    );

    // Rejeita CPF ausente, com tamanho errado, repetido ou com dígito errado.
    it.each([
      ['ausente', ''],
      ['com menos de 11 dígitos', '5299822472'],
      ['com dígitos repetidos', '111.111.111-11'],
      ['com dígito verificador errado', '529.982.247-26'],
    ])('Valida o bloqueio de CPF %s.', (_descricao, entrada) => {
      expect(() => Cpf.criar(entrada)).toThrow(
        expect.objectContaining({ codigo: 'CPF_INVALIDO' }),
      );
    });

    // Reconstrói um CPF persistido sem revalidar.
    it('Valida a restauração de um CPF persistido.', () => {
      expect(Cpf.restaurar('52998224725').valor).toBe('52998224725');
    });
  });

  describe('Senha', () => {
    // Aceita senha com letras e números no tamanho permitido.
    it('Valida uma senha forte.', () => {
      expect(Senha.criar('senhaForte123').valor).toBe('senhaForte123');
    });

    // Rejeita senha ausente, curta, longa ou sem letra e número.
    it.each([
      ['ausente', ''],
      ['com menos de 8 caracteres', 'abc123'],
      ['com mais de 72 caracteres', `a1${'b'.repeat(71)}`],
      ['sem número', 'somenteletras'],
      ['sem letra', '12345678'],
    ])('Valida o bloqueio de senha %s.', (_descricao, valor) => {
      expect(() => Senha.criar(valor)).toThrow(
        expect.objectContaining({ codigo: 'SENHA_INVALIDA' }),
      );
    });
  });

  describe('Cargo profissional e status', () => {
    // Normaliza os valores permitidos.
    it('Valida os valores permitidos.', () => {
      expect(criarCargoProfissional(' responsavel_tecnico ')).toBe(
        'RESPONSAVEL_TECNICO',
      );
      expect(criarStatusUsuario('inativo')).toBe('INATIVO');
    });

    // Rejeita valores fora da lista.
    it('Valida o bloqueio de valores inválidos.', () => {
      expect(() => criarCargoProfissional('DIRETOR')).toThrow(ErroValidacao);
      expect(() => criarStatusUsuario('SUSPENSO')).toThrow(ErroValidacao);
    });
  });
});
