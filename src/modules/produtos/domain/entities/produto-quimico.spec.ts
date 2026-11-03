import { describe, expect, it } from '@jest/globals';
import {
  ErroRegraNegocio,
  ErroValidacao,
} from '../../../../shared/domain/errors/erro-dominio';
import { ProdutoQuimico } from './produto-quimico';

describe('ProdutoQuimico', () => {
  // Dados de um produto válido.
  const dados = {
    nome: '  Ácido Sulfúrico  ',
    descricao: '  Corrosivo  ',
    numeroOnu: ' UN1830 ',
    classeRisco: 'CLASSE_8' as const,
    grupoCompatibilidade: 'CORROSIVOS' as const,
    estadoFisico: 'LIQUIDO' as const,
  };

  // Cria um produto válido.
  it('Valida o cadastro com dados normalizados.', () => {
    const produto = ProdutoQuimico.criar(dados);

    // Confere os dados sem espaços nas pontas e o status padrão.
    expect(produto.nome).toBe('Ácido Sulfúrico');
    expect(produto.descricao).toBe('Corrosivo');
    expect(produto.numeroOnu).toBe('UN1830');
    expect(produto.classeRisco).toBe('CLASSE_8');
    expect(produto.grupoCompatibilidade).toBe('CORROSIVOS');
    expect(produto.estadoFisico).toBe('LIQUIDO');
    expect(produto.status).toBe('ATIVO');
    expect(produto.criadoEm).toEqual(produto.atualizadoEm);
  });

  // Campos opcionais ausentes viram null.
  it('Valida o cadastro sem descrição e sem estado físico.', () => {
    const produto = ProdutoQuimico.criar({
      ...dados,
      descricao: '   ',
      estadoFisico: undefined,
    });

    expect(produto.descricao).toBeNull();
    expect(produto.estadoFisico).toBeNull();
  });

  // Rejeita nome longo e número ONU ausente ou longo.
  it.each([
    ['nome com mais de 150 caracteres', { nome: 'a'.repeat(151) }],
    ['número ONU ausente', { numeroOnu: '  ' }],
    ['número ONU com mais de 10 caracteres', { numeroOnu: 'UN18301830X' }],
  ])('Valida o bloqueio de cadastro com %s.', (_descricao, alteracao) => {
    expect(() => ProdutoQuimico.criar({ ...dados, ...alteracao })).toThrow(
      ErroValidacao,
    );
  });

  // Atualiza os dados cadastrais sem mudar o status.
  it('Valida a atualização dos dados cadastrais.', () => {
    const produto = ProdutoQuimico.criar(dados);

    produto.atualizar({ ...dados, nome: 'Ácido Nítrico', numeroOnu: 'UN2031' });

    expect(produto.nome).toBe('Ácido Nítrico');
    expect(produto.numeroOnu).toBe('UN2031');
    expect(produto.status).toBe('ATIVO');
  });

  // Rejeita atualização sem nome (RN001).
  it('Valida o bloqueio de atualização sem nome.', () => {
    const produto = ProdutoQuimico.criar(dados);

    expect(() => produto.atualizar({ ...dados, nome: '' })).toThrow(
      expect.objectContaining({ regra: 'RN001' }),
    );
  });

  // Inativa o produto (exclusão lógica) e rejeita inativar de novo.
  it('Valida a inativação do produto.', () => {
    const produto = ProdutoQuimico.criar(dados);

    produto.inativar();
    expect(produto.status).toBe('INATIVO');
    expect(produto.estaAtivo()).toBe(false);
    expect(() => produto.inativar()).toThrow(ErroRegraNegocio);
  });

  // Reconstrói um produto persistido sem alterar os dados.
  it('Valida a restauração de um produto persistido.', () => {
    const original = ProdutoQuimico.criar(dados);
    const restaurado = ProdutoQuimico.restaurar({
      id: original.id,
      nome: original.nome,
      descricao: original.descricao,
      numeroOnu: original.numeroOnu,
      classeRisco: original.classeRisco,
      grupoCompatibilidade: original.grupoCompatibilidade,
      estadoFisico: original.estadoFisico,
      status: 'INATIVO',
      criadoEm: original.criadoEm,
      atualizadoEm: original.atualizadoEm,
    });

    expect(restaurado.id).toBe(original.id);
    expect(restaurado.status).toBe('INATIVO');
  });
});
