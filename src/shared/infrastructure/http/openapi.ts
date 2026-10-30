import { STATUS_CARGA } from '../../../modules/cargas/domain/value-objects/status-carga';
import { UNIDADES_MEDIDA } from '../../../modules/cargas/domain/value-objects/unidade-medida';
import { CLASSES_RISCO } from '../../../modules/produtos/domain/value-objects/classe-risco';
import { ESTADOS_FISICOS } from '../../../modules/produtos/domain/value-objects/estado-fisico';
import { GRUPOS_COMPATIBILIDADE } from '../../../modules/produtos/domain/value-objects/grupo-compatibilidade';
import { STATUS_PRODUTO } from '../../../modules/produtos/domain/value-objects/status-produto';
import { CARGOS_PROFISSIONAIS } from '../../../modules/usuarios/domain/value-objects/cargo-profissional';
import { STATUS_USUARIO } from '../../../modules/usuarios/domain/value-objects/status-usuario';

/**
 * Especificação OpenAPI 3 da API, servida em /docs (Swagger UI) e
 * /openapi.json. Os enums vêm dos Value Objects, para não divergirem do domínio.
 */

const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });
const resposta = (nome: string) => ({ $ref: `#/components/responses/${nome}` });
const param = (nome: string) => ({ $ref: `#/components/parameters/${nome}` });

const json = (schema: object, examples?: Record<string, object>) => ({
  'application/json': {
    schema,
    ...(examples && {
      examples: Object.fromEntries(
        Object.entries(examples).map(([nome, value]) => [nome, { value }]),
      ),
    }),
  },
});

const erro = (
  codigo: string,
  mensagem: string,
  extra: { regra?: string; detalhes?: unknown } = {},
) => ({ codigo, mensagem, ...extra });

/** Resposta de erro com um ou mais exemplos nomeados */
const respostaErro = (descricao: string, exemplos: Record<string, object>) => ({
  description: descricao,
  content: json(ref('Erro'), exemplos),
});

const UUID_PRODUTO = '3f6b2c1e-8a4d-4e7f-9b21-5c0d7e8f9a10';
const UUID_CARGA = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const UUID_RESPONSAVEL = 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const UUID_AUTOR = 'd4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70';

const exemploProduto = {
  id: UUID_PRODUTO,
  nome: 'Ácido Sulfúrico',
  descricao: 'Ácido mineral forte, corrosivo',
  numeroOnu: 'UN1830',
  classeRisco: 'CLASSE_8',
  grupoCompatibilidade: 'CORROSIVOS',
  estadoFisico: 'LIQUIDO',
  status: 'ATIVO',
  criadoEm: '2026-10-20T10:00:00.000Z',
  atualizadoEm: '2026-10-20T10:00:00.000Z',
};

const exemploCarga = {
  id: UUID_CARGA,
  codigo: 'CG-2026-0001',
  produto: {
    id: UUID_PRODUTO,
    nome: 'Ácido Sulfúrico',
    numeroOnu: 'UN1830',
    classeRisco: 'CLASSE_8',
  },
  quantidade: 1500.5,
  unidadeMedida: 'KG',
  origem: 'Terminal A',
  destino: 'Navio X',
  responsavelTecnicoId: UUID_RESPONSAVEL,
  status: 'REGISTRADA',
  documentacaoValida: true,
  dataEntrada: '2026-10-22T10:00:00.000Z',
  criadoEm: '2026-10-22T10:05:00.000Z',
  atualizadoEm: '2026-10-22T10:05:00.000Z',
};

const exemploUsuario = {
  id: UUID_RESPONSAVEL,
  nome: 'Maria Souza',
  cpf: '529.982.247-25',
  cargoProfissional: 'RESPONSAVEL_TECNICO',
  dataNascimento: '1990-05-14',
  status: 'ATIVO',
  criadoEm: '2026-10-20T09:00:00.000Z',
  atualizadoEm: '2026-10-20T09:00:00.000Z',
};

const lista = (item: object) => ({
  itens: [item],
  total: 1,
  pagina: 1,
  porPagina: 20,
  totalPaginas: 1,
});

const comCarga = (status: string, extra: object = {}) => ({
  ...exemploCarga,
  status,
  atualizadoEm: '2026-10-23T14:30:00.000Z',
  ...extra,
});

const ERROS_AUTOR = {
  autorNaoEncontrado: erro(
    'AUTOR_NAO_ENCONTRADO',
    'O usuário autor da operação não foi encontrado',
  ),
  autorInativo: erro(
    'AUTOR_INATIVO',
    'O usuário autor da operação está inativo',
  ),
};

const ERRO_TERMINAL = erro(
  'CARGA_EM_ESTADO_TERMINAL',
  'Carga com status CANCELADA não pode sofrer novas alterações de status',
  {
    regra: 'RN010',
    detalhes: { statusAtual: 'CANCELADA', statusSolicitado: 'LIBERADA' },
  },
);

const TABELA_TRANSICOES = `
| Status atual | Pode ir para |
| --- | --- |
| REGISTRADA | EM_ANALISE, CANCELADA |
| EM_ANALISE | EM_INSPECAO, CANCELADA |
| EM_INSPECAO | LIBERADA, BLOQUEADA, CANCELADA |
| LIBERADA | EM_MOVIMENTACAO, CANCELADA |
| BLOQUEADA | CANCELADA |
| EM_MOVIMENTACAO | FINALIZADA |
| FINALIZADA | — (terminal) |
| CANCELADA | — (terminal) |
`;

export const documentoOpenApi = {
  openapi: '3.0.3',
  info: {
    title: 'QuimiPort API',
    version: '1.0.0',
    description: `API backend do **QuimiPort**: gerenciamento de produtos químicos e cargas químicas em contexto portuário, inspirado nas operações do Porto de Santos.

## Convenções
- Corpo e respostas em JSON. Datas em ISO 8601 (UTC).
- Valores de enum aceitam maiúsculas ou minúsculas e são normalizados para maiúsculas.
- Listagens são paginadas com \`pagina\` (padrão 1) e \`porPagina\` (padrão 20, máximo 100).
- Ainda não há autenticação: operações que alteram uma carga recebem \`autorId\` (UUID de um usuário ativo), gravado no histórico da carga.

## Erros
Todos os erros seguem o schema \`Erro\`:

| HTTP | Quando |
| --- | --- |
| 400 | Formato inválido (\`DADOS_INVALIDOS\`, \`JSON_INVALIDO\`) ou dado que viola uma invariante do domínio |
| 404 | Recurso ou rota inexistente |
| 409 | Duplicidade (nome de produto ativo, código de carga, CPF) ou alteração concorrente |
| 422 | Regra de negócio ou transição de status inválida |
| 500 | Erro interno |

## Máquina de estados da carga (RN010)
${TABELA_TRANSICOES}
Qualquer transição fora da tabela retorna **422 \`TRANSICAO_STATUS_INVALIDA\`**, com as transições permitidas em \`detalhes\`.`,
  },
  servers: [{ url: 'http://localhost:3000', description: 'Ambiente local' }],
  tags: [
    { name: 'Saúde', description: 'Verificação de disponibilidade' },
    {
      name: 'Usuários',
      description: 'Usuários que operam e respondem pelas cargas',
    },
    { name: 'Produtos químicos', description: 'Cadastro de produtos químicos' },
    {
      name: 'Cargas químicas',
      description: 'Registro de cargas e controle de status',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Saúde'],
        summary: 'Verifica se a API está no ar',
        operationId: 'health',
        responses: {
          '200': {
            description: 'API disponível',
            content: json(
              {
                type: 'object',
                properties: { status: { type: 'string', example: 'ok' } },
              },
              { ok: { status: 'ok' } },
            ),
          },
        },
      },
    },

    // ----- Usuários --------------------------------------------------
    '/usuarios': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastrar usuário',
        description: `- \`cpf\` aceita com ou sem máscara e precisa ter dígitos verificadores válidos;
- \`senha\` deve ter de 8 a 72 caracteres, com ao menos uma letra e um número. Ela é guardada como hash e nunca é devolvida;
- \`dataNascimento\` no formato AAAA-MM-DD e anterior à data atual.`,
        operationId: 'criarUsuario',
        requestBody: {
          required: true,
          content: json(ref('CriarUsuarioEntrada'), {
            responsavelTecnico: {
              nome: 'Maria Souza',
              cpf: '529.982.247-25',
              cargoProfissional: 'RESPONSAVEL_TECNICO',
              dataNascimento: '1990-05-14',
              senha: 'senhaForte123',
            },
          }),
        },
        responses: {
          '201': {
            description: 'Usuário cadastrado',
            content: json(ref('Usuario'), { criado: exemploUsuario }),
          },
          '400': respostaErro('Dados inválidos', {
            cpfInvalido: erro('CPF_INVALIDO', 'CPF inválido'),
            senhaFraca: erro(
              'SENHA_INVALIDA',
              'A senha deve conter ao menos uma letra e um número',
            ),
            cargoInvalido: erro(
              'CARGO_PROFISSIONAL_INVALIDO',
              `Cargo profissional inválido: ESTAGIARIO. Valores permitidos: ${CARGOS_PROFISSIONAIS.join(', ')}`,
              { detalhes: { valoresPermitidos: CARGOS_PROFISSIONAIS } },
            ),
          }),
          '409': respostaErro('CPF já cadastrado', {
            cpfDuplicado: erro(
              'CPF_JA_CADASTRADO',
              'Já existe um usuário cadastrado com este CPF',
            ),
          }),
          '500': resposta('ErroInterno'),
        },
      },
      get: {
        tags: ['Usuários'],
        summary: 'Listar usuários',
        operationId: 'listarUsuarios',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filtra por status',
            schema: ref('StatusUsuario'),
          },
          param('Pagina'),
          param('PorPagina'),
        ],
        responses: {
          '200': {
            description: 'Página de usuários',
            content: json(ref('ListaUsuarios'), {
              pagina: lista(exemploUsuario),
            }),
          },
          '400': resposta('PaginacaoInvalida'),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/usuarios/{id}': {
      parameters: [param('Id')],
      get: {
        tags: ['Usuários'],
        summary: 'Buscar usuário',
        operationId: 'buscarUsuario',
        responses: {
          '200': {
            description: 'Usuário encontrado',
            content: json(ref('Usuario'), { encontrado: exemploUsuario }),
          },
          '400': resposta('IdInvalido'),
          '404': resposta('UsuarioNaoEncontrado'),
          '500': resposta('ErroInterno'),
        },
      },
      patch: {
        tags: ['Usuários'],
        summary: 'Atualizar usuário',
        description:
          'Atualização parcial. Informe ao menos um entre `nome`, `cargoProfissional` e `dataNascimento`. CPF e senha não são alterados por aqui.',
        operationId: 'atualizarUsuario',
        requestBody: {
          required: true,
          content: json(ref('AtualizarUsuarioEntrada'), {
            mudarCargo: { cargoProfissional: 'GESTOR' },
          }),
        },
        responses: {
          '200': {
            description: 'Usuário atualizado',
            content: json(ref('Usuario'), {
              atualizado: { ...exemploUsuario, cargoProfissional: 'GESTOR' },
            }),
          },
          '400': respostaErro('Dados inválidos', {
            semCampos: erro(
              'NENHUM_CAMPO_PARA_ATUALIZAR',
              'Informe ao menos um campo para atualizar: nome, cargoProfissional ou dataNascimento',
            ),
          }),
          '404': resposta('UsuarioNaoEncontrado'),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/usuarios/{id}/inativar': {
      parameters: [param('Id')],
      patch: {
        tags: ['Usuários'],
        summary: 'Inativar usuário',
        description:
          'Exclusão lógica. Usuários inativos não podem ser autores de operações nem responsáveis técnicos de novas cargas.',
        operationId: 'inativarUsuario',
        responses: {
          '200': {
            description: 'Usuário inativado',
            content: json(ref('Usuario'), {
              inativado: { ...exemploUsuario, status: 'INATIVO' },
            }),
          },
          '404': resposta('UsuarioNaoEncontrado'),
          '422': respostaErro('Usuário já inativo', {
            jaInativo: erro('USUARIO_JA_INATIVO', 'Usuário já está inativo'),
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/usuarios/{id}/ativar': {
      parameters: [param('Id')],
      patch: {
        tags: ['Usuários'],
        summary: 'Reativar usuário',
        operationId: 'ativarUsuario',
        responses: {
          '200': {
            description: 'Usuário reativado',
            content: json(ref('Usuario'), { ativado: exemploUsuario }),
          },
          '404': resposta('UsuarioNaoEncontrado'),
          '422': respostaErro('Usuário já ativo', {
            jaAtivo: erro('USUARIO_JA_ATIVO', 'Usuário já está ativo'),
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },

    // ----- Produtos químicos -----------------------------------------
    '/produtos-quimicos': {
      post: {
        tags: ['Produtos químicos'],
        summary: 'Cadastrar produto químico',
        description: `Regras:
- **RN001** \`nome\` é obrigatório (até 150 caracteres) e não pode repetir o de outro produto ativo;
- **RN002** \`classeRisco\` é obrigatória e deve ser uma classe ONU válida;
- **RN021** \`status\` deve ser \`ATIVO\` ou \`INATIVO\` (padrão \`ATIVO\`);
- \`numeroOnu\` (até 10 caracteres) e \`grupoCompatibilidade\` são obrigatórios.`,
        operationId: 'criarProdutoQuimico',
        requestBody: {
          required: true,
          content: json(ref('CriarProdutoQuimicoEntrada'), {
            acidoSulfurico: {
              nome: 'Ácido Sulfúrico',
              descricao: 'Ácido mineral forte, corrosivo',
              numeroOnu: 'UN1830',
              classeRisco: 'CLASSE_8',
              grupoCompatibilidade: 'CORROSIVOS',
              estadoFisico: 'LIQUIDO',
            },
          }),
        },
        responses: {
          '201': {
            description: 'Produto cadastrado',
            content: json(ref('ProdutoQuimico'), { criado: exemploProduto }),
          },
          '400': respostaErro('Dados inválidos', {
            semNome: erro(
              'DADOS_INVALIDOS',
              'Nome do produto químico é obrigatório',
              {
                detalhes: [
                  {
                    campo: 'nome',
                    mensagem: 'Nome do produto químico é obrigatório',
                  },
                ],
              },
            ),
            semClasseRisco: erro(
              'DADOS_INVALIDOS',
              'Classe de risco é obrigatória',
              {
                detalhes: [
                  {
                    campo: 'classeRisco',
                    mensagem: 'Classe de risco é obrigatória',
                  },
                ],
              },
            ),
            classeInvalida: erro(
              'CLASSE_RISCO_INVALIDA',
              `Classe de risco inválida: CLASSE_10. Valores permitidos: ${CLASSES_RISCO.join(', ')}`,
              {
                regra: 'RN002',
                detalhes: { valoresPermitidos: CLASSES_RISCO },
              },
            ),
            statusInvalido: erro(
              'STATUS_PRODUTO_INVALIDO',
              'Status do produto químico inválido: SUSPENSO. Valores permitidos: ATIVO, INATIVO',
              {
                regra: 'RN021',
                detalhes: { valoresPermitidos: STATUS_PRODUTO },
              },
            ),
          }),
          '409': respostaErro('Nome já usado por produto ativo', {
            nomeDuplicado: erro(
              'NOME_PRODUTO_DUPLICADO',
              'Já existe produto químico ativo com este nome',
            ),
          }),
          '500': resposta('ErroInterno'),
        },
      },
      get: {
        tags: ['Produtos químicos'],
        summary: 'Listar produtos químicos',
        operationId: 'listarProdutosQuimicos',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filtra por status',
            schema: ref('StatusProduto'),
          },
          {
            name: 'classeRisco',
            in: 'query',
            description: 'Filtra por classe de risco',
            schema: ref('ClasseRisco'),
          },
          param('Pagina'),
          param('PorPagina'),
        ],
        responses: {
          '200': {
            description: 'Página de produtos',
            content: json(ref('ListaProdutosQuimicos'), {
              pagina: lista(exemploProduto),
            }),
          },
          '400': resposta('PaginacaoInvalida'),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/produtos-quimicos/{id}': {
      parameters: [param('Id')],
      get: {
        tags: ['Produtos químicos'],
        summary: 'Buscar produto químico',
        operationId: 'buscarProdutoQuimico',
        responses: {
          '200': {
            description: 'Produto encontrado',
            content: json(ref('ProdutoQuimico'), {
              encontrado: exemploProduto,
            }),
          },
          '400': resposta('IdInvalido'),
          '404': resposta('ProdutoNaoEncontrado'),
          '500': resposta('ErroInterno'),
        },
      },
      put: {
        tags: ['Produtos químicos'],
        summary: 'Atualizar produto químico',
        description:
          'Substitui todos os dados cadastrais, com as mesmas validações do cadastro. O status não muda por aqui (use `/inativar`). Cargas já registradas guardam um snapshot do produto e não são afetadas (RN012).',
        operationId: 'atualizarProdutoQuimico',
        requestBody: {
          required: true,
          content: json(ref('DadosProdutoQuimico'), {
            novaDescricao: {
              nome: 'Ácido Sulfúrico',
              descricao: 'Ácido sulfúrico concentrado 98%',
              numeroOnu: 'UN1830',
              classeRisco: 'CLASSE_8',
              grupoCompatibilidade: 'CORROSIVOS',
              estadoFisico: 'LIQUIDO',
            },
          }),
        },
        responses: {
          '200': {
            description: 'Produto atualizado',
            content: json(ref('ProdutoQuimico'), {
              atualizado: {
                ...exemploProduto,
                descricao: 'Ácido sulfúrico concentrado 98%',
                atualizadoEm: '2026-10-21T08:00:00.000Z',
              },
            }),
          },
          '400': resposta('DadosInvalidos'),
          '404': resposta('ProdutoNaoEncontrado'),
          '409': respostaErro('Nome já usado por produto ativo', {
            nomeDuplicado: erro(
              'NOME_PRODUTO_DUPLICADO',
              'Já existe produto químico ativo com este nome',
            ),
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/produtos-quimicos/{id}/inativar': {
      parameters: [param('Id')],
      patch: {
        tags: ['Produtos químicos'],
        summary: 'Inativar produto químico',
        description:
          'Exclusão lógica (RN015). Um produto inativo não pode ser usado em novas cargas (RN003). As cargas já registradas continuam válidas.',
        operationId: 'inativarProdutoQuimico',
        responses: {
          '200': {
            description: 'Produto inativado',
            content: json(ref('ProdutoQuimico'), {
              inativado: { ...exemploProduto, status: 'INATIVO' },
            }),
          },
          '400': resposta('IdInvalido'),
          '404': resposta('ProdutoNaoEncontrado'),
          '422': respostaErro('Produto já inativo', {
            jaInativo: erro(
              'PRODUTO_QUIMICO_JA_INATIVO',
              'Produto químico já está inativo',
            ),
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },

    // ----- Cargas químicas -------------------------------------------
    '/cargas-quimicas': {
      post: {
        tags: ['Cargas químicas'],
        summary: 'Registrar carga química',
        description: `A carga nasce com status \`REGISTRADA\` e guarda um snapshot do produto (RN012).

Regras:
- **RN004** \`produtoId\` é obrigatório e deve existir; \`quantidade\` deve ser maior que zero (até 3 casas decimais);
- **RN003** o produto deve estar \`ATIVO\`;
- **RN009** \`responsavelTecnicoId\` deve ser um usuário ativo com cargo \`RESPONSAVEL_TECNICO\`;
- **RN026** \`codigo\` (até 30 caracteres) é único;
- \`documentacaoValida\` indica se a documentação obrigatória foi apresentada (padrão \`false\`) e é exigida para liberar a carga;
- \`dataEntrada\` é opcional (padrão: momento do registro).`,
        operationId: 'registrarCargaQuimica',
        requestBody: {
          required: true,
          content: json(ref('RegistrarCargaQuimicaEntrada'), {
            comDocumentacao: {
              codigo: 'CG-2026-0001',
              produtoId: UUID_PRODUTO,
              quantidade: 1500.5,
              unidadeMedida: 'KG',
              origem: 'Terminal A',
              destino: 'Navio X',
              responsavelTecnicoId: UUID_RESPONSAVEL,
              documentacaoValida: true,
              dataEntrada: '2026-10-22T10:00:00Z',
              autorId: UUID_AUTOR,
            },
          }),
        },
        responses: {
          '201': {
            description: 'Carga registrada',
            content: json(ref('CargaQuimica'), { registrada: exemploCarga }),
          },
          '400': respostaErro('Dados inválidos', {
            semProduto: erro(
              'DADOS_INVALIDOS',
              'Produto químico é obrigatório para registrar carga',
              {
                detalhes: [
                  {
                    campo: 'produtoId',
                    mensagem:
                      'Produto químico é obrigatório para registrar carga',
                  },
                ],
              },
            ),
            quantidadeZero: erro(
              'QUANTIDADE_INVALIDA',
              'Quantidade da carga deve ser maior que zero',
              { regra: 'RN004' },
            ),
            semResponsavel: erro(
              'DADOS_INVALIDOS',
              'Responsável técnico é obrigatório para toda carga química',
              {
                detalhes: [
                  {
                    campo: 'responsavelTecnicoId',
                    mensagem:
                      'Responsável técnico é obrigatório para toda carga química',
                  },
                ],
              },
            ),
            unidadeInvalida: erro(
              'UNIDADE_MEDIDA_INVALIDA',
              `Unidade de medida inválida: G. Valores permitidos: ${UNIDADES_MEDIDA.join(', ')}`,
              { detalhes: { valoresPermitidos: UNIDADES_MEDIDA } },
            ),
          }),
          '404': respostaErro('Produto ou responsável técnico inexistente', {
            produtoNaoEncontrado: erro(
              'PRODUTO_QUIMICO_NAO_ENCONTRADO',
              'Produto químico não encontrado',
              { regra: 'RN004' },
            ),
            responsavelNaoEncontrado: erro(
              'RESPONSAVEL_TECNICO_NAO_ENCONTRADO',
              'Responsável técnico não encontrado',
              { regra: 'RN009' },
            ),
          }),
          '409': respostaErro('Código de carga já usado', {
            codigoDuplicado: erro(
              'CODIGO_CARGA_DUPLICADO',
              'Já existe uma carga química com este código',
              { regra: 'RN026' },
            ),
          }),
          '422': respostaErro('Regra de negócio violada', {
            produtoInativo: erro(
              'PRODUTO_QUIMICO_INATIVO',
              'Produto químico está inativo e não pode ser usado em novas cargas',
              { regra: 'RN003' },
            ),
            naoEhResponsavel: erro(
              'RESPONSAVEL_TECNICO_INVALIDO',
              'O usuário informado não possui o cargo de responsável técnico',
              { regra: 'RN009' },
            ),
            responsavelInativo: erro(
              'RESPONSAVEL_TECNICO_INATIVO',
              'Responsável técnico está inativo',
              { regra: 'RN009' },
            ),
            ...ERROS_AUTOR,
          }),
          '500': resposta('ErroInterno'),
        },
      },
      get: {
        tags: ['Cargas químicas'],
        summary: 'Listar cargas químicas',
        operationId: 'listarCargasQuimicas',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filtra por status da carga',
            schema: ref('StatusCarga'),
          },
          {
            name: 'produtoId',
            in: 'query',
            description: 'Filtra por produto químico',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'responsavelTecnicoId',
            in: 'query',
            description: 'Filtra por responsável técnico',
            schema: { type: 'string', format: 'uuid' },
          },
          param('Pagina'),
          param('PorPagina'),
        ],
        responses: {
          '200': {
            description: 'Página de cargas',
            content: json(ref('ListaCargasQuimicas'), {
              pagina: lista(exemploCarga),
            }),
          },
          '400': resposta('PaginacaoInvalida'),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/cargas-quimicas/{id}': {
      parameters: [param('Id')],
      get: {
        tags: ['Cargas químicas'],
        summary: 'Buscar carga química',
        operationId: 'buscarCargaQuimica',
        responses: {
          '200': {
            description: 'Carga encontrada',
            content: json(ref('CargaQuimica'), { encontrada: exemploCarga }),
          },
          '400': resposta('IdInvalido'),
          '404': resposta('CargaNaoEncontrada'),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/cargas-quimicas/{id}/status': {
      parameters: [param('Id')],
      patch: {
        tags: ['Cargas químicas'],
        summary: 'Atualizar status da carga',
        description: `Aplica uma transição da máquina de estados (RN010):
${TABELA_TRANSICOES}
- Para \`LIBERADA\`, \`BLOQUEADA\` e \`CANCELADA\` valem as mesmas regras dos endpoints dedicados (documentação válida; \`motivo\` obrigatório para bloquear e cancelar);
- **RN005** carga bloqueada não pode entrar em movimentação;
- \`FINALIZADA\` e \`CANCELADA\` são terminais.`,
        operationId: 'atualizarStatusCarga',
        requestBody: {
          required: true,
          content: json(ref('AtualizarStatusCargaEntrada'), {
            iniciarAnalise: { status: 'EM_ANALISE', autorId: UUID_AUTOR },
            enviarParaInspecao: {
              status: 'EM_INSPECAO',
              motivo: 'Análise documental concluída',
              autorId: UUID_AUTOR,
            },
          }),
        },
        responses: {
          '200': {
            description: 'Status atualizado',
            content: json(ref('CargaQuimica'), {
              emAnalise: comCarga('EM_ANALISE'),
            }),
          },
          '400': respostaErro('Dados inválidos', {
            statusInvalido: erro(
              'STATUS_CARGA_INVALIDO',
              `Status da carga inválido: EM_TRANSITO. Valores permitidos: ${STATUS_CARGA.join(', ')}`,
              { regra: 'RN022', detalhes: { valoresPermitidos: STATUS_CARGA } },
            ),
            semAutor: erro(
              'DADOS_INVALIDOS',
              'O autor da operação (autorId) é obrigatório',
              {
                detalhes: [
                  {
                    campo: 'autorId',
                    mensagem: 'O autor da operação (autorId) é obrigatório',
                  },
                ],
              },
            ),
            semMotivo: erro(
              'MOTIVO_OBRIGATORIO',
              'Motivo é obrigatório para bloquear a carga',
            ),
          }),
          '404': resposta('CargaNaoEncontrada'),
          '409': resposta('AlteracaoConcorrente'),
          '422': respostaErro('Transição ou regra de negócio violada', {
            transicaoInvalida: erro(
              'TRANSICAO_STATUS_INVALIDA',
              'Transição de status inválida: REGISTRADA → FINALIZADA',
              {
                regra: 'RN010',
                detalhes: {
                  statusAtual: 'REGISTRADA',
                  statusSolicitado: 'FINALIZADA',
                  transicoesPermitidas: ['EM_ANALISE', 'CANCELADA'],
                },
              },
            ),
            movimentarBloqueada: erro(
              'CARGA_BLOQUEADA',
              'Carga bloqueada — movimentação proibida',
              { regra: 'RN005' },
            ),
            finalizarSemLiberar: erro(
              'CARGA_NAO_LIBERADA',
              'Carga em inspeção não pode ser finalizada sem antes ser liberada',
              { regra: 'RN010' },
            ),
            estadoTerminal: ERRO_TERMINAL,
            ...ERROS_AUTOR,
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/cargas-quimicas/{id}/bloquear': {
      parameters: [param('Id')],
      patch: {
        tags: ['Cargas químicas'],
        summary: 'Bloquear carga química',
        description:
          'Permitido somente a partir de `EM_INSPECAO`. Exige `motivo`. Carga bloqueada não pode entrar em movimentação (RN005) e só pode ser cancelada.',
        operationId: 'bloquearCarga',
        requestBody: {
          required: true,
          content: json(ref('MotivoEntrada'), {
            divergencia: {
              motivo: 'Divergência na ficha de emergência',
              autorId: UUID_AUTOR,
            },
          }),
        },
        responses: {
          '200': {
            description: 'Carga bloqueada',
            content: json(ref('CargaQuimica'), {
              bloqueada: comCarga('BLOQUEADA'),
            }),
          },
          '400': respostaErro('Dados inválidos', {
            semMotivo: erro(
              'DADOS_INVALIDOS',
              'Motivo é obrigatório para bloquear a carga',
              {
                detalhes: [
                  {
                    campo: 'motivo',
                    mensagem: 'Motivo é obrigatório para bloquear a carga',
                  },
                ],
              },
            ),
          }),
          '404': resposta('CargaNaoEncontrada'),
          '409': resposta('AlteracaoConcorrente'),
          '422': respostaErro('Transição ou regra de negócio violada', {
            jaBloqueada: erro('CARGA_JA_BLOQUEADA', 'Carga já está bloqueada', {
              regra: 'RN010',
            }),
            finalizada: erro(
              'CARGA_FINALIZADA',
              'Carga finalizada não pode ser bloqueada',
              {
                regra: 'RN010',
              },
            ),
            transicaoInvalida: erro(
              'TRANSICAO_STATUS_INVALIDA',
              'Transição de status inválida: REGISTRADA → BLOQUEADA',
              {
                regra: 'RN010',
                detalhes: {
                  statusAtual: 'REGISTRADA',
                  statusSolicitado: 'BLOQUEADA',
                  transicoesPermitidas: ['EM_ANALISE', 'CANCELADA'],
                },
              },
            ),
            ...ERROS_AUTOR,
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/cargas-quimicas/{id}/liberar': {
      parameters: [param('Id')],
      patch: {
        tags: ['Cargas químicas'],
        summary: 'Liberar carga química',
        description: `Permitido somente a partir de \`EM_INSPECAO\`.
- **RN007** a carga precisa ter \`documentacaoValida = true\`;
- **RN006** carga cancelada não pode ser liberada;
- **RN005** carga bloqueada não pode ser liberada.`,
        operationId: 'liberarCarga',
        requestBody: {
          required: true,
          content: json(ref('AutorEntrada'), {
            liberar: { autorId: UUID_AUTOR },
          }),
        },
        responses: {
          '200': {
            description: 'Carga liberada',
            content: json(ref('CargaQuimica'), {
              liberada: comCarga('LIBERADA'),
            }),
          },
          '400': resposta('DadosInvalidos'),
          '404': resposta('CargaNaoEncontrada'),
          '409': resposta('AlteracaoConcorrente'),
          '422': respostaErro('Transição ou regra de negócio violada', {
            semDocumentacao: erro(
              'DOCUMENTACAO_PENDENTE',
              'Não é possível liberar: a carga não possui documentação obrigatória válida',
              { regra: 'RN007' },
            ),
            cancelada: erro(
              'CARGA_CANCELADA',
              'Carga cancelada não pode ser liberada',
              {
                regra: 'RN006',
              },
            ),
            bloqueada: erro(
              'CARGA_BLOQUEADA',
              'Carga bloqueada não pode ser liberada',
              {
                regra: 'RN005',
              },
            ),
            ...ERROS_AUTOR,
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
    '/cargas-quimicas/{id}/cancelar': {
      parameters: [param('Id')],
      patch: {
        tags: ['Cargas químicas'],
        summary: 'Cancelar carga química',
        description:
          'Cancelamento lógico, permitido a partir de `REGISTRADA`, `EM_ANALISE`, `EM_INSPECAO`, `LIBERADA` e `BLOQUEADA`. Exige `motivo`. `CANCELADA` é terminal.',
        operationId: 'cancelarCarga',
        requestBody: {
          required: true,
          content: json(ref('MotivoEntrada'), {
            pedidoImportador: {
              motivo: 'Cancelado a pedido do importador',
              autorId: UUID_AUTOR,
            },
          }),
        },
        responses: {
          '200': {
            description: 'Carga cancelada',
            content: json(ref('CargaQuimica'), {
              cancelada: comCarga('CANCELADA'),
            }),
          },
          '400': respostaErro('Dados inválidos', {
            semMotivo: erro(
              'DADOS_INVALIDOS',
              'Motivo é obrigatório para cancelar a carga',
              {
                detalhes: [
                  {
                    campo: 'motivo',
                    mensagem: 'Motivo é obrigatório para cancelar a carga',
                  },
                ],
              },
            ),
          }),
          '404': resposta('CargaNaoEncontrada'),
          '409': resposta('AlteracaoConcorrente'),
          '422': respostaErro('Transição ou regra de negócio violada', {
            jaCancelada: erro('CARGA_JA_CANCELADA', 'Carga já está cancelada', {
              regra: 'RN006',
            }),
            finalizada: erro(
              'CARGA_FINALIZADA',
              'Carga já finalizada não pode ser cancelada',
              { regra: 'RN010' },
            ),
            emMovimentacao: erro(
              'TRANSICAO_STATUS_INVALIDA',
              'Transição de status inválida: EM_MOVIMENTACAO → CANCELADA',
              {
                regra: 'RN010',
                detalhes: {
                  statusAtual: 'EM_MOVIMENTACAO',
                  statusSolicitado: 'CANCELADA',
                  transicoesPermitidas: ['FINALIZADA'],
                },
              },
            ),
            ...ERROS_AUTOR,
          }),
          '500': resposta('ErroInterno'),
        },
      },
    },
  },

  components: {
    parameters: {
      Id: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Identificador (UUID) do recurso',
        schema: { type: 'string', format: 'uuid' },
      },
      Pagina: {
        name: 'pagina',
        in: 'query',
        description: 'Número da página',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      PorPagina: {
        name: 'porPagina',
        in: 'query',
        description: 'Itens por página',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },

    schemas: {
      StatusUsuario: { type: 'string', enum: STATUS_USUARIO },
      CargoProfissional: { type: 'string', enum: CARGOS_PROFISSIONAIS },
      StatusProduto: { type: 'string', enum: STATUS_PRODUTO },
      ClasseRisco: {
        type: 'string',
        enum: CLASSES_RISCO,
        description: 'Classe de produto perigoso da ONU para transporte',
      },
      GrupoCompatibilidade: { type: 'string', enum: GRUPOS_COMPATIBILIDADE },
      EstadoFisico: { type: 'string', enum: ESTADOS_FISICOS },
      StatusCarga: { type: 'string', enum: STATUS_CARGA },
      UnidadeMedida: { type: 'string', enum: UNIDADES_MEDIDA },

      AutorId: {
        type: 'string',
        format: 'uuid',
        description:
          'Usuário ativo que executa a operação, gravado no histórico da carga (RNF005). Enquanto não há autenticação, vem no corpo.',
      },

      CriarUsuarioEntrada: {
        type: 'object',
        required: [
          'nome',
          'cpf',
          'cargoProfissional',
          'dataNascimento',
          'senha',
        ],
        properties: {
          nome: { type: 'string', maxLength: 150 },
          cpf: {
            type: 'string',
            description: 'Com ou sem máscara',
            example: '529.982.247-25',
          },
          cargoProfissional: ref('CargoProfissional'),
          dataNascimento: {
            type: 'string',
            format: 'date',
            example: '1990-05-14',
          },
          senha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            description: 'Ao menos uma letra e um número',
          },
        },
      },
      AtualizarUsuarioEntrada: {
        type: 'object',
        minProperties: 1,
        properties: {
          nome: { type: 'string', maxLength: 150 },
          cargoProfissional: ref('CargoProfissional'),
          dataNascimento: { type: 'string', format: 'date' },
        },
      },
      Usuario: {
        type: 'object',
        required: [
          'id',
          'nome',
          'cpf',
          'cargoProfissional',
          'dataNascimento',
          'status',
          'criadoEm',
          'atualizadoEm',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          cpf: {
            type: 'string',
            description: 'Sempre formatado (000.000.000-00)',
          },
          cargoProfissional: ref('CargoProfissional'),
          dataNascimento: { type: 'string', format: 'date' },
          status: ref('StatusUsuario'),
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
      },
      ListaUsuarios: listaPaginada('Usuario'),

      DadosProdutoQuimico: {
        type: 'object',
        required: ['nome', 'numeroOnu', 'classeRisco', 'grupoCompatibilidade'],
        properties: {
          nome: { type: 'string', maxLength: 150, example: 'Ácido Sulfúrico' },
          descricao: { type: 'string', nullable: true },
          numeroOnu: {
            type: 'string',
            maxLength: 10,
            description: 'Número ONU ou código de identificação simulado',
            example: 'UN1830',
          },
          classeRisco: ref('ClasseRisco'),
          grupoCompatibilidade: ref('GrupoCompatibilidade'),
          estadoFisico: { ...ref('EstadoFisico'), nullable: true },
        },
      },
      CriarProdutoQuimicoEntrada: {
        allOf: [
          ref('DadosProdutoQuimico'),
          {
            type: 'object',
            properties: {
              status: { ...ref('StatusProduto'), default: 'ATIVO' },
            },
          },
        ],
      },
      ProdutoQuimico: {
        type: 'object',
        required: [
          'id',
          'nome',
          'descricao',
          'numeroOnu',
          'classeRisco',
          'grupoCompatibilidade',
          'estadoFisico',
          'status',
          'criadoEm',
          'atualizadoEm',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          descricao: { type: 'string', nullable: true },
          numeroOnu: { type: 'string' },
          classeRisco: ref('ClasseRisco'),
          grupoCompatibilidade: ref('GrupoCompatibilidade'),
          estadoFisico: { ...ref('EstadoFisico'), nullable: true },
          status: ref('StatusProduto'),
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
      },
      ListaProdutosQuimicos: listaPaginada('ProdutoQuimico'),

      RegistrarCargaQuimicaEntrada: {
        type: 'object',
        required: [
          'codigo',
          'produtoId',
          'quantidade',
          'unidadeMedida',
          'origem',
          'destino',
          'responsavelTecnicoId',
          'autorId',
        ],
        properties: {
          codigo: { type: 'string', maxLength: 30, example: 'CG-2026-0001' },
          produtoId: {
            type: 'string',
            format: 'uuid',
            description: 'Produto químico ativo',
          },
          quantidade: {
            type: 'number',
            minimum: 0,
            exclusiveMinimum: true,
            maximum: 99999999999.999,
            description: 'Maior que zero, até 3 casas decimais',
            example: 1500.5,
          },
          unidadeMedida: ref('UnidadeMedida'),
          origem: { type: 'string', maxLength: 150 },
          destino: { type: 'string', maxLength: 150 },
          responsavelTecnicoId: {
            type: 'string',
            format: 'uuid',
            description: 'Usuário ativo com cargo RESPONSAVEL_TECNICO',
          },
          documentacaoValida: {
            type: 'boolean',
            default: false,
            description:
              'Documentação obrigatória apresentada. Exigida para liberar',
          },
          dataEntrada: {
            type: 'string',
            format: 'date-time',
            description: 'Padrão: momento do registro',
          },
          autorId: ref('AutorId'),
        },
      },
      AtualizarStatusCargaEntrada: {
        type: 'object',
        required: ['status', 'autorId'],
        properties: {
          status: ref('StatusCarga'),
          motivo: {
            type: 'string',
            description:
              'Obrigatório quando o novo status é BLOQUEADA ou CANCELADA',
          },
          autorId: ref('AutorId'),
        },
      },
      MotivoEntrada: {
        type: 'object',
        required: ['motivo', 'autorId'],
        properties: {
          motivo: { type: 'string', minLength: 1 },
          autorId: ref('AutorId'),
        },
      },
      AutorEntrada: {
        type: 'object',
        required: ['autorId'],
        properties: { autorId: ref('AutorId') },
      },
      CargaQuimica: {
        type: 'object',
        required: [
          'id',
          'codigo',
          'produto',
          'quantidade',
          'unidadeMedida',
          'origem',
          'destino',
          'responsavelTecnicoId',
          'status',
          'documentacaoValida',
          'dataEntrada',
          'criadoEm',
          'atualizadoEm',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo: { type: 'string' },
          produto: {
            type: 'object',
            description: 'Snapshot do produto no momento do registro (RN012)',
            required: ['id', 'nome', 'numeroOnu', 'classeRisco'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              numeroOnu: { type: 'string' },
              classeRisco: ref('ClasseRisco'),
            },
          },
          quantidade: { type: 'number' },
          unidadeMedida: ref('UnidadeMedida'),
          origem: { type: 'string' },
          destino: { type: 'string' },
          responsavelTecnicoId: { type: 'string', format: 'uuid' },
          status: ref('StatusCarga'),
          documentacaoValida: { type: 'boolean' },
          dataEntrada: { type: 'string', format: 'date-time' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
      },
      ListaCargasQuimicas: listaPaginada('CargaQuimica'),

      Erro: {
        type: 'object',
        required: ['codigo', 'mensagem'],
        properties: {
          codigo: {
            type: 'string',
            description:
              'Código estável do erro, para tratamento por quem consome a API',
            example: 'TRANSICAO_STATUS_INVALIDA',
          },
          mensagem: { type: 'string' },
          regra: {
            type: 'string',
            description: 'Regra de negócio violada, quando houver',
            example: 'RN010',
          },
          detalhes: {
            description:
              'Erros de formato: lista de campos inválidos. Regras de negócio: contexto do erro (ex.: transições permitidas)',
            oneOf: [
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    campo: { type: 'string' },
                    mensagem: { type: 'string' },
                  },
                },
              },
              { type: 'object', additionalProperties: true },
            ],
          },
        },
      },
    },

    responses: {
      DadosInvalidos: respostaErro('Dados inválidos', {
        formato: erro('DADOS_INVALIDOS', 'Dados inválidos', {
          detalhes: [
            {
              campo: 'autorId',
              mensagem: 'O autor da operação (autorId) é obrigatório',
            },
            { campo: 'nome', mensagem: 'Deve ser um texto' },
          ],
        }),
        jsonInvalido: erro(
          'JSON_INVALIDO',
          'Corpo da requisição não é um JSON válido',
        ),
      }),
      IdInvalido: respostaErro('Identificador inválido', {
        idInvalido: erro(
          'DADOS_INVALIDOS',
          'O identificador informado não é um UUID válido',
          {
            detalhes: [
              {
                campo: 'id',
                mensagem: 'O identificador informado não é um UUID válido',
              },
            ],
          },
        ),
      }),
      PaginacaoInvalida: respostaErro('Paginação ou filtro inválido', {
        porPagina: erro(
          'POR_PAGINA_INVALIDO',
          'A quantidade por página deve ser um número inteiro entre 1 e 100',
        ),
        pagina: erro(
          'PAGINA_INVALIDA',
          'A página deve ser um número inteiro maior que zero',
        ),
      }),
      UsuarioNaoEncontrado: respostaErro('Usuário não encontrado', {
        naoEncontrado: erro('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado'),
      }),
      ProdutoNaoEncontrado: respostaErro('Produto químico não encontrado', {
        naoEncontrado: erro(
          'PRODUTO_QUIMICO_NAO_ENCONTRADO',
          'Produto químico não encontrado',
        ),
      }),
      CargaNaoEncontrada: respostaErro('Carga química não encontrada', {
        naoEncontrada: erro(
          'CARGA_QUIMICA_NAO_ENCONTRADA',
          'Carga química não encontrada',
        ),
      }),
      AlteracaoConcorrente: respostaErro('Carga alterada por outra operação', {
        concorrencia: erro(
          'CARGA_ALTERADA_CONCORRENTEMENTE',
          'A carga foi alterada por outra operação. Consulte-a novamente e repita a ação',
        ),
      }),
      ErroInterno: respostaErro('Erro interno', {
        interno: erro('ERRO_INTERNO', 'Erro interno do servidor'),
      }),
    },
  },
};

function listaPaginada(item: string) {
  return {
    type: 'object',
    required: ['itens', 'total', 'pagina', 'porPagina', 'totalPaginas'],
    properties: {
      itens: { type: 'array', items: ref(item) },
      total: {
        type: 'integer',
        description: 'Total de registros com os filtros',
      },
      pagina: { type: 'integer' },
      porPagina: { type: 'integer' },
      totalPaginas: { type: 'integer' },
    },
  };
}
