import '../../config/env';
import { AtualizarStatusCarga } from '../../../modules/cargas/application/use-cases/atualizar-status-carga';
import { BloquearCarga } from '../../../modules/cargas/application/use-cases/bloquear-carga';
import { CancelarCarga } from '../../../modules/cargas/application/use-cases/cancelar-carga';
import { LiberarCarga } from '../../../modules/cargas/application/use-cases/liberar-carga';
import { RegistrarCargaQuimica } from '../../../modules/cargas/application/use-cases/registrar-carga-quimica';
import { PrismaProdutoQuimicoGateway } from '../../../modules/cargas/infrastructure/adapters/outbound/prisma-produto-quimico.gateway';
import { PrismaUsuarioGateway } from '../../../modules/cargas/infrastructure/adapters/outbound/prisma-usuario.gateway';
import { PrismaCargaQuimicaRepository } from '../../../modules/cargas/infrastructure/persistence/prisma-carga-quimica.repository';
import { CriarProdutoQuimico } from '../../../modules/produtos/application/use-cases/criar-produto-quimico';
import { InativarProdutoQuimico } from '../../../modules/produtos/application/use-cases/inativar-produto-quimico';
import { PrismaProdutoQuimicoRepository } from '../../../modules/produtos/infrastructure/persistence/prisma-produto-quimico.repository';
import { CriarUsuario } from '../../../modules/usuarios/application/use-cases/criar-usuario';
import { InativarUsuario } from '../../../modules/usuarios/application/use-cases/inativar-usuario';
import { Cpf } from '../../../modules/usuarios/domain/value-objects/cpf';
import { ScryptHashSenha } from '../../../modules/usuarios/infrastructure/adapters/outbound/scrypt-hash-senha';
import { PrismaUsuarioRepository } from '../../../modules/usuarios/infrastructure/persistence/prisma-usuario.repository';
import { logger } from '../logging/logger';
import { prisma } from './prisma';

/**
 * Dados de exemplo para demonstrar o CRUD (npm run db:seed).
 * Tudo passa pelos casos de uso, então os dados respeitam as mesmas regras
 * da API, e cada mudança de status gera seu histórico.
 * Idempotente: se o primeiro usuário já existe, o seed não roda de novo.
 */

const SENHA_PADRAO = 'senhaForte123';

const usuarioRepositorio = new PrismaUsuarioRepository(prisma);
const produtoRepositorio = new PrismaProdutoQuimicoRepository(prisma);
const cargaRepositorio = new PrismaCargaQuimicaRepository(prisma);
const usuarioGateway = new PrismaUsuarioGateway(prisma);

const criarUsuario = new CriarUsuario(
  usuarioRepositorio,
  new ScryptHashSenha(),
);
const inativarUsuario = new InativarUsuario(usuarioRepositorio);
const criarProduto = new CriarProdutoQuimico(produtoRepositorio);
const inativarProduto = new InativarProdutoQuimico(produtoRepositorio);
const registrarCarga = new RegistrarCargaQuimica(
  cargaRepositorio,
  new PrismaProdutoQuimicoGateway(prisma),
  usuarioGateway,
);
const atualizarStatus = new AtualizarStatusCarga(
  cargaRepositorio,
  usuarioGateway,
);
const liberar = new LiberarCarga(cargaRepositorio, usuarioGateway);
const bloquear = new BloquearCarga(cargaRepositorio, usuarioGateway);
const cancelar = new CancelarCarga(cargaRepositorio, usuarioGateway);

// CPFs fictícios, com dígitos verificadores válidos
const USUARIOS = {
  ana: {
    nome: 'Ana Ribeiro',
    cpf: '52998224725',
    cargoProfissional: 'RESPONSAVEL_TECNICO',
    dataNascimento: new Date('1985-03-12'),
  },
  carlos: {
    nome: 'Carlos Mendes',
    cpf: '12345678143',
    cargoProfissional: 'RESPONSAVEL_TECNICO',
    dataNascimento: new Date('1979-11-02'),
  },
  beatriz: {
    nome: 'Beatriz Lima',
    cpf: '98765432029',
    cargoProfissional: 'OPERADOR',
    dataNascimento: new Date('1994-07-25'),
  },
  diego: {
    nome: 'Diego Alves',
    cpf: '45612378955',
    cargoProfissional: 'RESPONSAVEL_TECNICO',
    dataNascimento: new Date('1988-01-30'),
  },
} as const;

const PRODUTOS = {
  hidroxidoSodio: {
    nome: 'Hidróxido de Sódio',
    descricao: 'Soda cáustica em escamas',
    numeroOnu: 'UN1823',
    classeRisco: 'CLASSE_8',
    grupoCompatibilidade: 'CORROSIVOS',
    estadoFisico: 'SOLIDO',
  },
  acetona: {
    nome: 'Acetona',
    descricao: 'Solvente orgânico',
    numeroOnu: 'UN1090',
    classeRisco: 'CLASSE_3',
    grupoCompatibilidade: 'LIQUIDOS_INFLAMAVEIS',
    estadoFisico: 'LIQUIDO',
  },
  metanol: {
    nome: 'Metanol',
    numeroOnu: 'UN1230',
    classeRisco: 'CLASSE_3',
    grupoCompatibilidade: 'LIQUIDOS_INFLAMAVEIS',
    estadoFisico: 'LIQUIDO',
  },
  amonia: {
    nome: 'Amônia Anidra',
    numeroOnu: 'UN1005',
    classeRisco: 'CLASSE_2',
    grupoCompatibilidade: 'GASES',
    estadoFisico: 'GASOSO',
  },
  nitratoAmonio: {
    nome: 'Nitrato de Amônio',
    descricao: 'Fertilizante oxidante',
    numeroOnu: 'UN1942',
    classeRisco: 'CLASSE_5',
    grupoCompatibilidade: 'OXIDANTES_PEROXIDOS_ORGANICOS',
    estadoFisico: 'SOLIDO',
  },
  benzeno: {
    nome: 'Benzeno',
    numeroOnu: 'UN1114',
    classeRisco: 'CLASSE_3',
    grupoCompatibilidade: 'LIQUIDOS_INFLAMAVEIS',
    estadoFisico: 'LIQUIDO',
  },
} as const;

async function seed(): Promise<void> {
  const jaAplicado = await usuarioRepositorio.buscarPorCpf(
    Cpf.criar(USUARIOS.ana.cpf),
  );
  if (jaAplicado) {
    logger.info(
      { event: 'seed.skipped' },
      'Dados de exemplo já existem, nada a fazer',
    );
    return;
  }

  const ana = await criarUsuario.executar({
    ...USUARIOS.ana,
    senha: SENHA_PADRAO,
  });
  const carlos = await criarUsuario.executar({
    ...USUARIOS.carlos,
    senha: SENHA_PADRAO,
  });
  await criarUsuario.executar({ ...USUARIOS.beatriz, senha: SENHA_PADRAO });
  const diego = await criarUsuario.executar({
    ...USUARIOS.diego,
    senha: SENHA_PADRAO,
  });
  // RT inativo: demonstra a RN009 no registro de carga
  await inativarUsuario.executar(diego.id);

  const hidroxidoSodio = await criarProduto.executar(PRODUTOS.hidroxidoSodio);
  const acetona = await criarProduto.executar(PRODUTOS.acetona);
  const metanol = await criarProduto.executar(PRODUTOS.metanol);
  const amonia = await criarProduto.executar(PRODUTOS.amonia);
  const nitratoAmonio = await criarProduto.executar(PRODUTOS.nitratoAmonio);
  const benzeno = await criarProduto.executar(PRODUTOS.benzeno);
  // Produto inativo: demonstra a RN003 no registro de carga
  await inativarProduto.executar(benzeno.id);

  const autorId = ana.id;
  const registrar = (
    codigo: string,
    produtoId: string,
    responsavelTecnicoId: string,
    dados: {
      quantidade: number;
      unidadeMedida: string;
      origem: string;
      destino: string;
      documentacaoValida: boolean;
    },
  ) =>
    registrarCarga.executar(
      { codigo, produtoId, responsavelTecnicoId, ...dados },
      autorId,
    );
  const avancar = async (id: string, ...status: string[]) => {
    for (const novo of status) {
      await atualizarStatus.executar(id, { status: novo }, autorId);
    }
  };

  // Uma carga em cada status da máquina de estados
  await registrar('CG-DEMO-001', hidroxidoSodio.id, ana.id, {
    quantidade: 2500,
    unidadeMedida: 'KG',
    origem: 'Terminal A',
    destino: 'Navio Atlântico',
    documentacaoValida: true,
  });

  const emAnalise = await registrar('CG-DEMO-002', acetona.id, carlos.id, {
    quantidade: 12,
    unidadeMedida: 'M3',
    origem: 'Armazém 3',
    destino: 'Navio Boreal',
    documentacaoValida: true,
  });
  await avancar(emAnalise.id, 'EM_ANALISE');

  // Sem documentação válida: liberar retorna 422 (RN007)
  const semDocumentacao = await registrar('CG-DEMO-003', metanol.id, ana.id, {
    quantidade: 8000,
    unidadeMedida: 'L',
    origem: 'Navio Cruzeiro do Sul',
    destino: 'Tanque 7',
    documentacaoValida: false,
  });
  await avancar(semDocumentacao.id, 'EM_ANALISE', 'EM_INSPECAO');

  const liberada = await registrar('CG-DEMO-004', nitratoAmonio.id, carlos.id, {
    quantidade: 30,
    unidadeMedida: 'T',
    origem: 'Terminal B',
    destino: 'Navio Pacífico',
    documentacaoValida: true,
  });
  await avancar(liberada.id, 'EM_ANALISE', 'EM_INSPECAO');
  await liberar.executar(liberada.id, autorId);

  const emMovimentacao = await registrar(
    'CG-DEMO-005',
    hidroxidoSodio.id,
    carlos.id,
    {
      quantidade: 1200,
      unidadeMedida: 'KG',
      origem: 'Armazém 1',
      destino: 'Navio Atlântico',
      documentacaoValida: true,
    },
  );
  await avancar(emMovimentacao.id, 'EM_ANALISE', 'EM_INSPECAO');
  await liberar.executar(emMovimentacao.id, autorId);
  await avancar(emMovimentacao.id, 'EM_MOVIMENTACAO');

  const finalizada = await registrar('CG-DEMO-006', acetona.id, ana.id, {
    quantidade: 5,
    unidadeMedida: 'M3',
    origem: 'Navio Boreal',
    destino: 'Armazém 3',
    documentacaoValida: true,
  });
  await avancar(finalizada.id, 'EM_ANALISE', 'EM_INSPECAO');
  await liberar.executar(finalizada.id, autorId);
  await avancar(finalizada.id, 'EM_MOVIMENTACAO', 'FINALIZADA');

  // Bloqueada: movimentar ou liberar retorna 422 (RN005)
  const bloqueada = await registrar('CG-DEMO-007', amonia.id, ana.id, {
    quantidade: 18,
    unidadeMedida: 'T',
    origem: 'Navio Cruzeiro do Sul',
    destino: 'Esfera 2',
    documentacaoValida: true,
  });
  await avancar(bloqueada.id, 'EM_ANALISE', 'EM_INSPECAO');
  await bloquear.executar(
    bloqueada.id,
    { motivo: 'Vazamento identificado na válvula do contêiner' },
    autorId,
  );

  const cancelada = await registrar('CG-DEMO-008', metanol.id, carlos.id, {
    quantidade: 3000,
    unidadeMedida: 'L',
    origem: 'Tanque 7',
    destino: 'Navio Pacífico',
    documentacaoValida: true,
  });
  await cancelar.executar(
    cancelada.id,
    { motivo: 'Operação cancelada pelo cliente' },
    autorId,
  );

  logger.info(
    { event: 'seed.completed', usuarios: 4, produtos: 6, cargas: 8 },
    'Dados de exemplo cadastrados',
  );
}

seed()
  .catch((erro: unknown) => {
    logger.error(
      {
        event: 'seed.failed',
        erro: erro instanceof Error ? erro.message : erro,
      },
      'Falha ao cadastrar os dados de exemplo',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
