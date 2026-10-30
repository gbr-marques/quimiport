import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { criarApp } from '../../src/app';

function obterUrlBancoDeTeste(): string {
  const caminhoEnv = resolve(__dirname, '../../.env');
  let conteudoEnv = '';
  if (existsSync(caminhoEnv)) {
    process.loadEnvFile(caminhoEnv);
    conteudoEnv = readFileSync(caminhoEnv, 'utf8');
  }

  const obterValor = (nome: string): string | undefined => {
    const valorDoProcesso = process.env[nome];
    if (valorDoProcesso) return valorDoProcesso;

    const linha = conteudoEnv
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${nome}=`));
    return linha
      ?.slice(nome.length + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
  };
  const urlConfigurada = obterValor('DATABASE_URL_E2E');
  const urlBase = urlConfigurada ?? obterValor('DATABASE_URL');
  if (!urlBase) {
    throw new Error(
      'Configure DATABASE_URL ou DATABASE_URL_E2E para os testes.',
    );
  }

  const url = new URL(urlBase);
  if (!urlConfigurada) {
    const bancoBase = url.pathname.slice(1);
    if (!bancoBase) {
      throw new Error('DATABASE_URL precisa informar o nome do banco.');
    }
    url.pathname = `/${bancoBase.endsWith('_test') ? bancoBase : `${bancoBase}_test`}`;
  }

  const nomeBanco = decodeURIComponent(url.pathname.slice(1));
  if (!nomeBanco.endsWith('_test')) {
    throw new Error(
      `Os testes de API exigem um banco com sufixo "_test"; recebido: ${nomeBanco}`,
    );
  }

  return url.toString();
}

export const prismaTeste = new PrismaClient({
  datasourceUrl: obterUrlBancoDeTeste(),
});
export const appTeste = criarApp(prismaTeste);

export function corpo<T>(resposta: { body: unknown }): T {
  return resposta.body as T;
}

export async function conectarBancoDeTeste(): Promise<void> {
  await prismaTeste.$connect();
  const bancos = await prismaTeste.$queryRaw<{ nome: string }[]>`
    SELECT current_database() AS nome`;
  if (!bancos[0]?.nome.endsWith('_test')) {
    throw new Error('Conexão recusada: o banco não é identificado como teste.');
  }

  const tabelas = await prismaTeste.$queryRaw<{ nome: string }[]>`
    SELECT tablename AS nome
    FROM pg_tables
    WHERE schemaname = 'public'`;
  const tabelasNecessarias = [
    'usuarios',
    'produtos_quimicos',
    'cargas_quimicas',
    'historico_carga',
  ];
  if (
    tabelasNecessarias.some(
      (tabela) => !tabelas.some((item) => item.nome === tabela),
    )
  ) {
    throw new Error(
      'O banco de teste não possui o schema. Aplique database/schema.sql nele antes de executar os testes.',
    );
  }
}

export async function desconectarBancoDeTeste(): Promise<void> {
  await prismaTeste.$disconnect();
}

export function novoNome(prefixo: string): string {
  return `${prefixo}-${randomUUID()}`;
}

export function novoCodigoCarga(): string {
  return `C-${randomUUID().replaceAll('-', '').slice(0, 24)}`;
}

function criarCpfValido(): string {
  const digitos = randomUUID()
    .replace(/\D/g, '')
    .slice(0, 9)
    .split('')
    .map(Number);
  const calcularDigito = (base: number[], pesoInicial: number): number => {
    const soma = base.reduce(
      (total, digito, indice) => total + digito * (pesoInicial - indice),
      0,
    );
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  digitos.push(calcularDigito(digitos, 10));
  digitos.push(calcularDigito(digitos, 11));
  return digitos.join('');
}

export async function criarUsuario(
  cargoProfissional: 'OPERADOR' | 'RESPONSAVEL_TECNICO',
): Promise<string> {
  const resposta = await request(appTeste)
    .post('/usuarios')
    .send({
      nome: novoNome('Usuário E2E'),
      cpf: criarCpfValido(),
      cargoProfissional,
      dataNascimento: '1990-01-01',
      senha: 'SenhaTeste123',
    });

  if (resposta.status !== 201) {
    throw new Error(
      `Não foi possível criar usuário de teste: ${JSON.stringify(resposta.body)}`,
    );
  }
  return corpo<{ id: string }>(resposta).id;
}

export async function criarProduto(
  status: 'ATIVO' | 'INATIVO' = 'ATIVO',
): Promise<{ id: string; nome: string }> {
  const nome = novoNome('Produto E2E');
  const resposta = await request(appTeste).post('/produtos-quimicos').send({
    nome,
    numeroOnu: '1830',
    classeRisco: 'CLASSE_3',
    grupoCompatibilidade: 'CORROSIVOS',
    estadoFisico: 'LIQUIDO',
    status,
  });

  if (resposta.status !== 201) {
    throw new Error(
      `Não foi possível criar produto de teste: ${JSON.stringify(resposta.body)}`,
    );
  }
  return { id: corpo<{ id: string }>(resposta).id, nome };
}

export async function criarCarga(
  produtoId: string,
  responsavelTecnicoId: string,
  autorId: string,
  documentacaoValida = true,
): Promise<{ id: string; codigo: string; status: string }> {
  const resposta = await request(appTeste).post('/cargas-quimicas').send({
    codigo: novoCodigoCarga(),
    produtoId,
    quantidade: 10,
    unidadeMedida: 'KG',
    origem: 'Origem de teste',
    destino: 'Destino de teste',
    responsavelTecnicoId,
    autorId,
    documentacaoValida,
  });

  if (resposta.status !== 201) {
    throw new Error(
      `Não foi possível criar carga de teste: ${JSON.stringify(resposta.body)}`,
    );
  }
  return corpo<{ id: string; codigo: string; status: string }>(resposta);
}
