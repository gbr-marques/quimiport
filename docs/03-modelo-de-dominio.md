# Modelo de domínio

![Diagrama de Domínio](./diagrams/diagrama-de-dominio.jpg)

## Entidades

### Produto Químico
- **Responsabilidade:** representar uma substância química no catálogo, com identidade e propriedades técnicas invariantes.
- **Atributos principais:** `id`, `nome`, `classificacaoDeRiscoId`, `unidadeDeMedida`, `estadoFisico`, `status` (Ativo/Inativo), `criadoEm`, `autor`.
- **Regras relacionadas:** RN001, RN002, RN003.
- **Relacionamentos:** referencia Classificação de Risco (N..1); referenciado por Carga Química (1..N).

### Documento Obrigatório (catálogo)
- **Responsabilidade:** representar um tipo de documento que pode ser exigido de um risco (ex.: FISPQ, Nota Fiscal, Licença Ambiental). É a entidade-base da cadeia de exigência documental — não se confunde com o Documento da Carga (que é a instância anexada a uma carga específica).
- **Atributos principais:** `id`, `nome`, `exigeDataDeValidade` (booleano), `status` (Ativo/Inativo), `criadoEm`, `autor`.
- **Regras relacionadas:** RN014, RN015, RN018.
- **Relacionamentos:** referenciado por Risco (N..N — um documento pode ser exigido por vários riscos).

### Risco
- **Responsabilidade:** representar um tipo de risco químico (ex.: Corrosivos, Gases, Tóxicos), com o conjunto de documentos obrigatórios que ele exige. É o elo entre o catálogo de documentos e a classificação de risco formal (Classe 1 a 9).
- **Atributos principais:** `id`, `nome`, `documentosObrigatorios` (lista de referências a Documento Obrigatório), `status` (Ativo/Inativo), `criadoEm`, `autor`.
- **Regras relacionadas:** RN014, RN015, RN016, RN018.
- **Relacionamentos:** referencia Documento Obrigatório (N..N); referenciado por Classificação de Risco (1..N).

### Classificação de Risco
- **Responsabilidade:** representar a classe de risco oficial (Classe 1 a 9) associada a um Risco cadastrado. Não define documentos diretamente — herda a exigência documental do Risco associado.
- **Atributos principais:** `id`, `classe`, `riscoId`, `status` (Ativa/Inativa), `criadoEm`, `autor`.
- **Regras relacionadas:** RN002, RN014, RN015, RN016.
- **Relacionamentos:** referencia Risco (N..1); referenciada por Produto Químico (1..N); consultada pela Carga Química no momento da validação documental (US007).

### Carga Química (Agregado Raiz)
- **Responsabilidade:** representar uma unidade de carga em movimentação portuária. Concentra as regras que garantem consistência de todo o ciclo (documentação, inspeção, liberação, bloqueio, movimentação).
- **Atributos principais:** `id`, `produtoId`, `produtoSnapshot`, `quantidade`, `classificacaoDeRisco`, `responsavelTecnicoId`, `documentos`, `inspecoes`, `historico`, `status`, `motivoBloqueio`, `criadoEm`, `criadoPor`.
- **Regras relacionadas:** RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN012.
- **Relacionamentos:** referencia Produto Químico (N..1) e Responsável Técnico (N..1); contém Documento (1..N), Inspeção (1..N) e Evento (1..N).

### Responsável Técnico
- **Responsabilidade:** representar profissional habilitado que responde tecnicamente pelas cargas.
- **Atributos principais:** `id`, `nome`, `crq`, `email`, `telefone`, `status` (Ativo/Inativo).
- **Regras relacionadas:** RN009.
- **Relacionamentos:** referenciado por Carga Química (1..N).

### Documento da Carga
- **Responsabilidade:** representar um arquivo documental obrigatório anexado a uma carga, com metadados de tipo e validade. O tipo não é um valor livre — é sempre uma referência a um item do catálogo de Documento Obrigatório, restrito aos documentos exigidos pelo Risco da Classificação de Risco do produto da carga.
- **Atributos principais:** `id`, `cargaId`, `documentoObrigatorioId`, `arquivo`, `dataEmissao`, `dataValidade`, `statusValidade` (Vigente/Vencido), `anexadoEm`, `anexadoPor`.
- **Regras relacionadas:** RN007, RN013, RN019.
- **Relacionamentos:** pertence a Carga Química (N..1); referencia Documento Obrigatório (N..1).

### Inspeção
- **Responsabilidade:** representar a verificação técnica formal de uma carga, com resultado e trilha.
- **Atributos principais:** `id`, `cargaId`, `solicitadaPor`, `dataPrevista`, `dataRealizada`, `resultado` (Pendente/Aprovada/Reprovada), `observacoes`.
- **Regras relacionadas:** RN008.
- **Relacionamentos:** pertence a Carga Química (N..1).

### Evento (Histórico da Carga)
- **Responsabilidade:** registro imutável de qualquer ação ou transição sobre uma Carga. Base da rastreabilidade.
- **Atributos principais:** `id`, `cargaId`, `tipo`, `de`, `para`, `autor`, `timestamp`, `motivo`.
- **Regras relacionadas:** RN011.
- **Relacionamentos:** pertence a Carga Química (N..1). Nunca alterado após criação (append-only).

## Value Objects

Estruturas imutáveis, identificadas por seus valores (não por ID):

- **Quantidade** — encapsula `valor` + `unidade` com validação de valor > 0
- **ClasseDeRisco** — enum imutável definido pela equipe
- **CRQ** — identificador profissional com validação de formato
- **PeriodoDeValidade** — encapsula data de emissão + validade + status (vigente/vencido)

## Justificativa do agregado raiz

O agregado escolhido é **Carga Química**, e essa escolha protege as seguintes invariantes que precisam ser garantidas atomicamente:

1. Carga não existe sem produto químico ativo associado.
2. Transições de status seguem a máquina de estados definida.
3. Nenhuma liberação acontece sem documentação válida e (quando exigido) inspeção aprovada.
4. Carga bloqueada não entra em movimentação nem é liberada; a única transição permitida a partir do bloqueio é o cancelamento.
5. Todo evento é registrado no histórico da própria carga (append-only).

Produto Químico e Responsável Técnico são agregados menores (só a si mesmos) — carga referencia esses agregados por identificador, respeitando o princípio DDD de referenciar outros agregados apenas por ID.

## Implementação na Fase 2

O modelo acima foi definido na Fase 1. Na Fase 2, parte dele foi implementada, com as adaptações abaixo.

### Entidades implementadas

| Modelo da Fase 1 | Implementação | Diferenças |
|---|---|---|
| Produto Químico | Entidade `ProdutoQuimico` (`src/modules/produtos/domain/entities`) | Atributos `id`, `nome`, `descricao`, `numeroOnu`, `classeRisco`, `grupoCompatibilidade`, `estadoFisico`, `status`, `criadoEm` e `atualizadoEm`. A classe de risco é um valor enumerado, e não uma referência à Classificação de Risco. A unidade de medida passou para a quantidade da carga |
| Carga Química | Agregado `CargaQuimica` (`src/modules/cargas/domain/aggregates`) | Atributos `id`, `codigo`, `produto` (snapshot com nome, número ONU e classe de risco), `quantidade`, `origem`, `destino`, `responsavelTecnicoId`, `status`, `documentacaoValida`, `dataEntrada`, `criadoEm` e `atualizadoEm`. Documentos e inspeções são representados pelo indicador `documentacaoValida`, e o motivo do bloqueio fica no evento do histórico |
| Responsável Técnico | Entidade `Usuario` (`src/modules/usuarios/domain/entities`) | O responsável técnico é um usuário ativo com o cargo `RESPONSAVEL_TECNICO`. Atributos `id`, `nome`, `cpf`, `cargoProfissional`, `dataNascimento`, `senhaHash`, `status`, `criadoEm` e `atualizadoEm`. O CPF substitui o CRQ como identificador validado |
| Evento | `EventoCarga` (`src/modules/cargas/domain/events`) | Atributos `tipo`, `statusAnterior`, `statusNovo`, `motivo`, `autorId` e `ocorridoEm`, gravados de forma imutável na tabela `historico_carga` |

Documento Obrigatório, Risco, Classificação de Risco, Documento da Carga e Inspeção ainda não foram implementados. As tabelas `documentos_carga` e `inspecoes` já existem no banco, conforme a [Modelagem de dados](./09-modelagem-de-dados.md#12-como-os-dados-poderão-evoluir-nas-próximas-fases).

### Value Objects implementados

- **Quantidade** e **UnidadeMedida** — valor maior que zero, com até 3 casas decimais, e unidade (`KG`, `T`, `L`, `M3`);
- **StatusCarga** — status da máquina de estados e mapa de transições permitidas;
- **ClasseRisco**, **GrupoCompatibilidade**, **EstadoFisico** e **StatusProduto** — valores enumerados do produto químico;
- **Cpf**, **Senha**, **CargoProfissional** e **StatusUsuario** — dados do usuário.

CRQ e PeriodoDeValidade ainda não foram implementados.
