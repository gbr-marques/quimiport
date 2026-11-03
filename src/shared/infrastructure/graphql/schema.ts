import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  type GraphQLFieldConfig,
} from 'graphql';
import type {
  CargaQuimicaSaida,
  ListaCargasQuimicasSaida,
  ListarCargasQuimicasEntrada,
} from '../../../modules/cargas/application/dto/carga-quimica.dto';
import {
  STATUS_CARGA,
  TRANSICOES_PERMITIDAS,
} from '../../../modules/cargas/domain/value-objects/status-carga';
import { UNIDADES_MEDIDA } from '../../../modules/cargas/domain/value-objects/unidade-medida';
import type { ProdutoQuimicoSaida } from '../../../modules/produtos/application/dto/produto-quimico.dto';
import { CLASSES_RISCO } from '../../../modules/produtos/domain/value-objects/classe-risco';
import { ESTADOS_FISICOS } from '../../../modules/produtos/domain/value-objects/estado-fisico';
import { GRUPOS_COMPATIBILIDADE } from '../../../modules/produtos/domain/value-objects/grupo-compatibilidade';
import { STATUS_PRODUTO } from '../../../modules/produtos/domain/value-objects/status-produto';
import { paramsComId, validar } from '../http/validacao';

/** Casos de uso consumidos pelo adapter GraphQL (os mesmos da API REST) */
export interface CasosDeUsoGraphql {
  listarCargas: {
    executar(
      entrada: ListarCargasQuimicasEntrada,
    ): Promise<ListaCargasQuimicasSaida>;
  };
  buscarProduto: { executar(id: string): Promise<ProdutoQuimicoSaida> };
}

/**
 * Contexto de cada requisição GraphQL. É um `type`, e não uma `interface`,
 * porque o graphql-http exige um Record como contexto.
 */
export type ContextoGraphql = {
  /** Evita buscar o mesmo produto mais de uma vez na mesma consulta */
  produtosCarregados: Map<string, Promise<ProdutoQuimicoSaida>>;
};

// Os valores dos enums vêm dos Value Objects, como na especificação OpenAPI
function criarEnum(
  name: string,
  description: string,
  valores: readonly string[],
): GraphQLEnumType {
  return new GraphQLEnumType({
    name,
    description,
    values: Object.fromEntries(valores.map((valor) => [valor, {}])),
  });
}

const texto = { type: new GraphQLNonNull(GraphQLString) };

function naoNulo<T extends GraphQLEnumType | GraphQLObjectType>(tipo: T) {
  return { type: new GraphQLNonNull(tipo) };
}

export function criarSchemaGraphql(casos: CasosDeUsoGraphql): GraphQLSchema {
  const statusCarga = criarEnum(
    'StatusCarga',
    'Status da carga química (RN022)',
    STATUS_CARGA,
  );
  const unidadeMedida = criarEnum(
    'UnidadeMedida',
    'Unidade de medida da quantidade',
    UNIDADES_MEDIDA,
  );
  const classeRisco = criarEnum(
    'ClasseRisco',
    'Classe de risco ONU',
    CLASSES_RISCO,
  );
  const grupoCompatibilidade = criarEnum(
    'GrupoCompatibilidade',
    'Grupo de compatibilidade do produto',
    GRUPOS_COMPATIBILIDADE,
  );
  const estadoFisico = criarEnum(
    'EstadoFisico',
    'Estado físico do produto',
    ESTADOS_FISICOS,
  );
  const statusProduto = criarEnum(
    'StatusProduto',
    'Status do produto químico (RN021)',
    STATUS_PRODUTO,
  );

  const buscarProduto = (
    id: string,
    contexto: ContextoGraphql,
  ): Promise<ProdutoQuimicoSaida> => {
    let produto = contexto.produtosCarregados.get(id);
    if (!produto) {
      produto = casos.buscarProduto.executar(id);
      contexto.produtosCarregados.set(id, produto);
    }
    return produto;
  };

  const produtoQuimico = new GraphQLObjectType<ProdutoQuimicoSaida>({
    name: 'ProdutoQuimico',
    description: 'Produto químico do catálogo',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      nome: texto,
      descricao: { type: GraphQLString },
      numeroOnu: texto,
      classeRisco: naoNulo(classeRisco),
      grupoCompatibilidade: naoNulo(grupoCompatibilidade),
      estadoFisico: { type: estadoFisico },
      status: naoNulo(statusProduto),
      criadoEm: texto,
      atualizadoEm: texto,
    },
  });

  const produtoDaCarga = new GraphQLObjectType({
    name: 'ProdutoDaCarga',
    description:
      'Dados do produto copiados no registro da carga, imunes a edições posteriores no catálogo (RN012)',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      nome: texto,
      numeroOnu: texto,
      classeRisco: naoNulo(classeRisco),
    },
  });

  const cargaQuimica = new GraphQLObjectType<
    CargaQuimicaSaida,
    ContextoGraphql
  >({
    name: 'CargaQuimica',
    description: 'Carga química registrada no porto',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      codigo: texto,
      produto: naoNulo(produtoDaCarga),
      produtoAtual: {
        type: new GraphQLNonNull(produtoQuimico),
        description:
          'Produto como está hoje no catálogo, incluindo o status atual',
        resolve: (carga, _args, contexto) =>
          buscarProduto(carga.produto.id, contexto),
      },
      quantidade: { type: new GraphQLNonNull(GraphQLFloat) },
      unidadeMedida: naoNulo(unidadeMedida),
      origem: texto,
      destino: texto,
      responsavelTecnicoId: { type: new GraphQLNonNull(GraphQLID) },
      status: naoNulo(statusCarga),
      transicoesPermitidas: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(statusCarga)),
        ),
        description:
          'Próximos status aceitos pela máquina de estados (RN010). Vazio em estados terminais',
        resolve: (carga) => TRANSICOES_PERMITIDAS[carga.status],
      },
      documentacaoValida: { type: new GraphQLNonNull(GraphQLBoolean) },
      dataEntrada: texto,
      criadoEm: texto,
      atualizadoEm: texto,
    },
  });

  const listaCargas = new GraphQLObjectType({
    name: 'ListaCargasQuimicas',
    fields: {
      itens: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(cargaQuimica)),
        ),
      },
      total: { type: new GraphQLNonNull(GraphQLInt) },
      pagina: { type: new GraphQLNonNull(GraphQLInt) },
      porPagina: { type: new GraphQLNonNull(GraphQLInt) },
      totalPaginas: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  const cargasPorStatus: GraphQLFieldConfig<
    unknown,
    ContextoGraphql,
    { status: string; pagina?: number; porPagina?: number }
  > = {
    type: new GraphQLNonNull(listaCargas),
    description: 'Lista as cargas químicas com o status informado',
    args: {
      status: naoNulo(statusCarga),
      pagina: { type: GraphQLInt, description: 'Padrão: 1' },
      porPagina: { type: GraphQLInt, description: 'Padrão: 20, máximo: 100' },
    },
    resolve: (_raiz, args) =>
      casos.listarCargas.executar({
        status: args.status,
        pagina: args.pagina ?? undefined,
        porPagina: args.porPagina ?? undefined,
      }),
  };

  const buscarProdutoQuimico: GraphQLFieldConfig<
    unknown,
    ContextoGraphql,
    { id: string }
  > = {
    type: new GraphQLNonNull(produtoQuimico),
    description: 'Busca um produto químico pelo identificador',
    args: { id: { type: new GraphQLNonNull(GraphQLID) } },
    resolve: (_raiz, args, contexto) =>
      buscarProduto(validar(paramsComId, args).id, contexto),
  };

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        cargasPorStatus,
        produtoQuimico: buscarProdutoQuimico,
      },
    }),
  });
}
