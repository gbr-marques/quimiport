# Quimiport

Repositório destinado à entrega do Tech Challenge do curso de pós-graduação em Desenvolvimento Fullstack, e evolução da solução nas próximas fases.

## Contexto do problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil, e parte dessas cargas são produtos químicos que exigem documentação adequada, classificação de risco e acompanhamento técnico. Hoje, o registro dessas cargas costuma ser feito de forma manual ou descentralizada, o que dificulta a consulta de informações, o acompanhamento do status e a validação das regras de segurança.

## Descrição da solução

O **QuimiPort** é uma API REST para o gerenciamento de cargas químicas no porto. Nesta fase, a API permite:

- Cadastrar, consultar, atualizar e inativar produtos químicos;
- Registrar e consultar cargas químicas, associadas a um produto químico ativo e a um responsável técnico;
- Atualizar o status da carga, bloqueá-la, liberá-la ou cancelá-la, conforme a máquina de estados definida nas regras de negócio;
- Registrar o histórico de cada mudança de status, com autor, data e motivo;
- Cadastrar os usuários que atuam como responsáveis técnicos e autores das operações.

As regras de negócio ficam no domínio da aplicação, os dados são persistidos em PostgreSQL e os endpoints são documentados com Swagger.

## Sumário

1. [Contexto do problema](./docs/01-dominio-e-problema.md)
2. [Usuários do sistema](./docs/01-dominio-e-problema.md#2-usuários-do-sistema)
3. [Linguagem ubíqua](./docs/02-linguagem-ubiqua.md)
4. [Entidades e Value Objects (DDD)](./docs/03-modelo-de-dominio.md)
5. [Casos de uso (BDD)](./docs/04-casos-de-uso.md)
6. [Regras de negócio](./docs/05-regras-de-negocio.md)
7. [Requisitos não funcionais](./docs/04-casos-de-uso.md#2-requisitos-não-funcionais)
8. [Arquitetura e ADRs](./docs/06-arquitetura-e-adrs.md)
9. [Plano de qualidade](./docs/07-plano-de-qualidade.md)
10. [Modelagem de dados](./docs/09-modelagem-de-dados.md)

## Tecnologias utilizadas

| Categoria | Tecnologia |
| --- | --- |
| Linguagem | [TypeScript](https://www.typescriptlang.org/) 5 |
| Runtime | [Node.js](https://nodejs.org/) 22 |
| Framework HTTP | [Express](https://expressjs.com/) 5 |
| Banco de dados | [PostgreSQL](https://www.postgresql.org/) 17 |
| ORM | [Prisma](https://www.prisma.io/) 6, com models espelhando o [database/schema.sql](./database/schema.sql) |
| Validação de entrada | [Zod](https://zod.dev/) 4, restrito aos adapters HTTP |
| Containers | [Docker](https://www.docker.com/) e Docker Compose |
| Testes | [Jest](https://jestjs.io/) e [Supertest](https://github.com/ladjs/supertest) |
| Qualidade de código | [ESLint](https://eslint.org/) e [Prettier](https://prettier.io/) |
| Execução em desenvolvimento | [tsx](https://tsx.is/) |

A aplicação segue a **Arquitetura Hexagonal (Ports and Adapters)**. As decisões arquiteturais estão registradas em [Arquitetura e ADRs](./docs/06-arquitetura-e-adrs.md).

O framework escolhido foi o **Express**, em vez de NestJS ou Fastify. Por ser minimalista, ele não impõe estrutura de módulos, decorators ou injeção de dependências, então a organização do projeto fica a cargo da Arquitetura Hexagonal. O Express fica restrito aos adapters de entrada (rotas e controllers), sem alcançar o domínio nem os casos de uso. A decisão completa está na [ADR-003](./docs/06-arquitetura-e-adrs.md#adr-003--backend-com-nodejs-e-express).

## Como rodar o projeto

O projeto pode ser executado de duas formas:

- [**Localmente**](#rodando-localmente): a API roda direto na máquina, com recarregamento automático a cada alteração no código. Indicado para desenvolvimento.
- [**Via Docker**](#rodando-via-docker): a API e o banco de dados rodam em containers, sem precisar instalar Node.js nem PostgreSQL.

Em ambos os casos, a API fica disponível em http://localhost:3000.

### Rodando localmente

#### Pré-requisitos

- [Node.js](https://nodejs.org/) 22 ou superior;
- Um PostgreSQL 17 acessível em `localhost:5432`. Pode ser uma instalação local ou o banco do Docker (veja o passo 3).

#### Passo a passo

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz do projeto com o conteúdo abaixo:

   ```env
   NODE_ENV=development
   PORT=3000

   POSTGRES_USER=quimiport
   POSTGRES_PASSWORD=quimiport
   POSTGRES_DB=quimiport
   DATABASE_URL=postgresql://quimiport:quimiport@localhost:5432/quimiport?schema=public
   ```

   Cada variável está descrita em [Variáveis de ambiente](#variáveis-de-ambiente).

3. Suba o banco de dados. A forma mais simples é subir apenas o container do banco:

   ```bash
   docker compose up -d db
   ```

   Se preferir usar um PostgreSQL instalado na máquina, crie o usuário e o banco `quimiport` e execute o script [database/schema.sql](./database/schema.sql):

   ```bash
   psql -U quimiport -d quimiport -f database/schema.sql
   ```

4. Gere o client do Prisma (repita sempre que alterar o `prisma/schema.prisma`):

   ```bash
   npm run prisma:generate
   ```

5. Inicie a API em modo de desenvolvimento:

   ```bash
   npm run start:dev
   ```

#### Verificação

```bash
# Deve responder {"status":"ok"}
curl http://localhost:3000/health
```

#### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NODE_ENV` | Não | Ambiente de execução. Padrão: `development` |
| `PORT` | Não | Porta em que a API responde. Padrão: `3000` |
| `DATABASE_URL` | Sim | URL de conexão com o PostgreSQL, usada pela API e pelo Prisma |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Não | Usuário, senha e banco criados pelo container do PostgreSQL no Docker Compose. Padrão: `quimiport` |
| `DATABASE_URL_E2E` | Não | URL do banco usado pelos testes e2e. Se ausente, os testes usam a `DATABASE_URL` com o sufixo `_test` no nome do banco (veja [Testes](#testes)) |
| `BASE_URL` | Não | Endereço da API usado pelo teste de fumaça. Padrão: `http://localhost:3000` |
| `NO_COLOR` | Não | Se definida, desativa as cores dos logs no terminal |

O arquivo `.env` é lido automaticamente na inicialização da API e não deve ser versionado.

#### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run start:dev` | Inicia a API em modo de desenvolvimento, com recarregamento automático |
| `npm run build` | Gera o client do Prisma e compila o projeto para a pasta `dist/` |
| `npm run prisma:generate` | Gera o client do Prisma a partir do `prisma/schema.prisma` |
| `npm start` | Executa a versão compilada |
| `npm test` | Executa os testes unitários |
| `npm run test:e2e` | Executa os testes end-to-end (veja [Testes](#testes)) |
| `npm run test:cov` | Executa os testes com relatório de cobertura |
| `npm run test:smoke` | Executa o teste de fumaça contra a API em execução |
| `npm run lint` | Analisa e corrige o código com ESLint |
| `npm run lint:ci` | Analisa o código sem corrigir, como no pipeline de CI |
| `npm run format` | Formata o código com Prettier |

### Rodando via Docker

#### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução. No Windows, é necessário o backend WSL 2.

Não é necessário criar o arquivo `.env`: o Docker Compose já define valores padrão para as variáveis de ambiente.

#### Passo a passo

1. Na raiz do projeto, construa as imagens e suba os containers:

   ```bash
   docker compose up -d --build
   ```

   Atalho equivalente, se o Node.js estiver instalado: `npm run docker:up`.

2. Aguarde os containers iniciarem. A API só sobe depois que o banco estiver pronto para receber conexões.

Serviços disponíveis:

| Serviço | Container | Endereço |
| --- | --- | --- |
| API | `quimiport-api` | http://localhost:3000 |
| PostgreSQL | `quimiport-db` | `localhost:5432` (usuário, senha e banco: `quimiport`) |

Na primeira inicialização, as tabelas do banco são criadas a partir do script [database/schema.sql](./database/schema.sql).

#### Verificação

```bash
# Status dos containers: ambos devem aparecer como "healthy"
docker compose ps

# API: deve responder {"status":"ok"}
curl http://localhost:3000/health

# Banco: deve listar as tabelas criadas pelo schema.sql
docker exec quimiport-db psql -U quimiport -c "\dt"
```

#### Comandos úteis

| Comando | Atalho npm | Descrição |
| --- | --- | --- |
| `docker compose logs -f` | `npm run docker:logs` | Acompanha os logs dos containers |
| `docker compose down` | `npm run docker:down` | Para e remove os containers. Os dados do banco são mantidos |
| `docker compose down -v` | — | Para os containers e apaga os dados do banco |
| `docker compose down -v && docker compose up -d --build` | `npm run docker:reset` | Recria o banco do zero. Necessário após alterar o `schema.sql`, que só é executado com o banco vazio |

## Documentação da API

Com a aplicação rodando (localmente ou com Docker), a documentação fica disponível em:

| Endereço | Conteúdo |
| --- | --- |
| [http://localhost:3000/docs](http://localhost:3000/docs) | Swagger UI: lista de endpoints, parâmetros, exemplos de request e response, códigos de erro e regras aplicadas. Permite testar as rotas pelo botão **Try it out** |
| [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json) | Especificação OpenAPI 3 em JSON, para importar no Postman ou no Insomnia |

A especificação fica em [`src/shared/infrastructure/http/openapi.ts`](./src/shared/infrastructure/http/openapi.ts). Os valores de enum (status, classes de risco, unidades etc.) são importados dos Value Objects do domínio, então a documentação acompanha as regras do código.

## Principais endpoints

| Recurso | Método e rota | Descrição |
| --- | --- | --- |
| Usuários | `POST /usuarios` | Cadastra um usuário |
| | `GET /usuarios` | Lista usuários (filtro `status`, paginação `pagina` e `porPagina`) |
| | `GET /usuarios/:id` | Busca um usuário |
| | `PATCH /usuarios/:id` | Atualiza nome, cargo ou data de nascimento |
| | `PATCH /usuarios/:id/inativar` e `/ativar` | Inativa ou reativa (exclusão lógica) |
| Produtos químicos | `POST /produtos-quimicos` | Cadastra um produto |
| | `GET /produtos-quimicos` | Lista produtos (filtros `status` e `classeRisco`) |
| | `GET /produtos-quimicos/:id` | Busca um produto |
| | `PUT /produtos-quimicos/:id` | Substitui os dados cadastrais |
| | `PATCH /produtos-quimicos/:id/inativar` | Inativa (exclusão lógica) |
| Cargas químicas | `POST /cargas-quimicas` | Registra uma carga |
| | `GET /cargas-quimicas` | Lista cargas (filtros `status`, `produtoId` e `responsavelTecnicoId`) |
| | `GET /cargas-quimicas/:id` | Busca uma carga |
| | `PATCH /cargas-quimicas/:id/status` | Muda o status, conforme a máquina de estados |
| | `PATCH /cargas-quimicas/:id/bloquear` | Bloqueia (exige `motivo`) |
| | `PATCH /cargas-quimicas/:id/liberar` | Libera (exige documentação válida) |
| | `PATCH /cargas-quimicas/:id/cancelar` | Cancela (exige `motivo`) |

Como ainda não há autenticação, toda operação que altera uma carga recebe no corpo o campo obrigatório `autorId`, com o UUID do usuário que a executa. Ele é gravado no histórico da carga. Exemplo de registro:

```json
POST /cargas-quimicas
{
  "codigo": "CG-2026-0001",
  "produtoId": "<id do produto ativo>",
  "quantidade": 1500.5,
  "unidadeMedida": "KG",
  "origem": "Terminal A",
  "destino": "Navio X",
  "responsavelTecnicoId": "<id de usuário ativo com cargo RESPONSAVEL_TECNICO>",
  "documentacaoValida": true,
  "autorId": "<id do usuário que registra a carga>"
}
```

## Banco de dados

A aplicação utiliza o **PostgreSQL 17**, acessado por meio do Prisma ORM. O script [database/schema.sql](./database/schema.sql) cria as tabelas `usuarios`, `produtos_quimicos`, `cargas_quimicas`, `historico_carga`, `documentos_carga` e `inspecoes`, e o [prisma/schema.prisma](./prisma/schema.prisma) espelha esse script.

A escolha por um banco relacional considerou:

- **Tipo de dado:** usuários, produtos e cargas têm estrutura fixa, com campos tipados (texto, decimal, data e valores enumerados). A quantidade da carga usa `numeric`, sem erros de arredondamento;
- **Relacionamentos:** toda carga referencia um produto e um responsável técnico, e o histórico pertence a uma carga e a um autor. As chaves estrangeiras impedem que uma carga aponte para um produto ou usuário inexistente;
- **Consistência:** a mudança de status e o registro no histórico são gravados na mesma transação. Enums, CHECKs e triggers reforçam no banco os status válidos, a quantidade positiva e a imutabilidade do histórico;
- **Evolução futura:** novas funcionalidades, como autenticação com perfis e anexo de documentos, entram como novas tabelas e chaves estrangeiras, sem reestruturar os dados existentes.

O MongoDB foi descartado porque produtos e usuários são compartilhados por muitas cargas e as regras exigem integridade referencial e atomicidade entre carga e histórico, garantias que ficariam a cargo do código da aplicação.

O modelo de dados, a máquina de estados da carga e a divisão das validações entre banco e domínio estão descritos em [Modelagem de dados](./docs/09-modelagem-de-dados.md).

## Testes

| Tipo | Comando | Onde ficam | O que precisa |
| --- | --- | --- | --- |
| Unitários | `npm test` (ou `npm run test:cov`, com cobertura em `coverage/`) | `src/**/*.spec.ts` | Nada além das dependências instaladas |
| Integração (e2e) | `npm run test:e2e` | `test/api/*.e2e-spec.ts` | Um PostgreSQL com um banco de sufixo `_test` e o `database/schema.sql` aplicado |
| Fumaça | `npm run test:smoke` | `scripts/smoke-test.mjs` | A API em execução (`BASE_URL`, padrão `http://localhost:3000`) |

O `npm run test:cov` falha se a cobertura da camada de domínio de algum módulo ficar abaixo de 80%, como prevê a RNF004. A relação entre os cenários exigidos e os testes está no [Plano de qualidade](./docs/07-plano-de-qualidade.md#testes-automatizados-implementados-fase-2).

Os testes e2e usam a URL de `DATABASE_URL_E2E` ou, na falta dela, a `DATABASE_URL` com o sufixo `_test` no nome do banco. Por segurança, recusam qualquer banco que não termine em `_test`. Com o banco do Docker em execução, o banco de teste é criado assim:

```bash
docker compose exec -T db psql -U quimiport -d quimiport -c "CREATE DATABASE quimiport_test"
docker compose exec -T db psql -U quimiport -d quimiport_test < database/schema.sql
npm run test:e2e
```

O teste de fumaça cadastra um responsável técnico e um produto, registra uma carga e a leva de `REGISTRADA` até `FINALIZADA`. Ele também confere a documentação OpenAPI e as regras RN001, RN003, RN004 e RN010. Cada execução usa dados novos, então pode rodar mais de uma vez no mesmo banco.

## CI/CD com GitHub Actions

O pipeline fica em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) e roda a cada push e pull request para a `main`. Também pode ser disparado manualmente na aba **Actions** (botão **Run workflow**).

| Job | Etapas |
| --- | --- |
| **Lint, build e testes** | `npm ci` → `prisma validate` → lint → build → testes unitários com cobertura (o relatório fica disponível como artefato da execução) |
| **Docker e testes de integração** | Valida o `docker-compose.yml` → sobe API e PostgreSQL com `docker compose up --wait` (aguarda os healthchecks) → cria o banco `quimiport_test` com o `schema.sql` → testes e2e → teste de fumaça → derruba o ambiente. Em caso de falha, mostra os logs dos containers |
| **Publicar imagem** | Só em push na `main` e com os dois jobs anteriores aprovados: publica a imagem da API em `ghcr.io/gbr-marques/quimiport` com as tags `latest` e o SHA do commit |

Decisões:

- **Deploy:** não há deploy em servidor nesta fase, como permite o enunciado. A entrega contínua para em uma imagem Docker versionada e pronta para ser executada.
- **Docker no pipeline:** o mesmo `docker-compose.yml` usado no desenvolvimento local é usado no pipeline, o que valida a containerização a cada alteração.
- **Lint:** no pipeline o lint roda sem `--fix`, para falhar em vez de corrigir os arquivos silenciosamente.
- **Testes:** todo arquivo `*.spec.ts` (unitário) e `*.e2e-spec.ts` (integração) é executado automaticamente. Se nenhum teste for encontrado, o pipeline falha.
- **Banco dos testes e2e:** é separado do banco da API (`quimiport_test`), para os testes não interferirem nos dados do teste de fumaça.

## Integrantes do grupo

- Gabriel Marques Silva - RM374482
- Ionara Ferreira de Lima - RM374697
- Matheus Felipe Santos Pereira - RM376292
- Wender Santos Guimarães - RM374718
