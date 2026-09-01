# Plano de Qualidade

## Objetivo do Plano

Este plano de qualidade estabelece a abordagem de validação do sistema QuimiPort, com foco em segurança operacional, rastreabilidade, conformidade documental e mitigação de riscos nos fluxos de carga química. O documento orienta a execução dos testes, define os objetivos de cobertura e consolida os critérios mínimos para aceitação da solução.

Garantir que o sistema QuimiPort opere com segurança, consistência e aderência às regras de negócio, validando fluxos críticos, documentação obrigatória, inspeções, liberação e movimentação de cargas químicas.


## Escopo e Fora de Escopo

Este plano contempla a validação das regras de negócio, dos fluxos críticos, da documentação obrigatória, das inspeções, da liberação, do bloqueio e da rastreabilidade das cargas químicas no sistema QuimiPort. Ficam fora deste plano testes de infraestrutura, homologação regulatória externa, testes de desempenho em ambiente produtivo, validações conduzidas por órgãos fiscalizadores e detalhamento passo a passo de cenários de teste.


## Matriz de Responsabilidades

A equipe de Qualidade define critérios de aceitação, avalia evidências e consolida a aprovação do plano. A equipe de Desenvolvimento corrige não conformidades identificadas durante os testes. O responsável técnico acompanha os fluxos críticos de segurança, documentação, inspeção e liberação. A aprovação final deve ser registrada pelo responsável pela Qualidade antes da liberação do plano.


## Regras de Negócio a Testar

- RN001-RN003 - Catálogo de Produtos Químicos
- RN004-RN012 - Ciclo de Vida da Carga Química
- RN013-RN019 - Documentação Obrigatória

## Cenários de Teste Planejados

Os cenários abaixo traduzem as regras de negócio da seção 4 em casos de teste concretos, cobrindo as combinações mais críticas de sucesso e bloqueio ao longo do ciclo de vida da carga química e do catálogo de risco. Cada cenário deve ser automatizado como teste unitário sobre a camada de domínio antes de qualquer integração externa.


| ID | RN | Caso de Uso | Cenário | Resultado Esperado | Prioridade |
|---|---|---|---|---|---|
| CT-01 | RN001 | US001 | Cadastrar produto químico sem informar nome | Sistema bloqueia o cadastro e exibe erro de campo obrigatório | Alta |
| CT-02 | RN002 | US001 | Cadastrar produto químico sem selecionar classificação de risco | Sistema bloqueia o cadastro | Crítica |
| CT-03 | RN003 | US003 | Registrar carga associando um produto químico inativo | Sistema bloqueia o registro da carga | Crítica |
| CT-04 | RN004 | US003 | Registrar carga sem produto, sem RT, sem classificação ou com quantidade = 0 | Sistema bloqueia o registro, apontando o(s) campo(s) ausente(s) | Crítica |
| CT-05 | RN005 | US012 | Tentar liberar ou movimentar uma carga com status "Bloqueada" | Sistema impede a ação até desbloqueio formal | Crítica |
| CT-06 | RN006 | US010 | Tentar liberar uma carga com status "Cancelada" | Sistema rejeita por ser estado terminal | Alta |
| CT-07 | RN007 | US010 | Liberar carga sem documentação obrigatória completa/vigente | Sistema bloqueia a liberação e lista os documentos pendentes | Crítica |
| CT-08 | RN007 | US010 | Liberar carga com inspeção aprovada e toda a documentação obrigatória completa e vigente | Sistema libera a carga somente com as duas condições satisfeitas (inspeção aprovada + documentação vigente) e registra evento no histórico | Crítica |
| CT-09 | RN008 | US010 | Tentar liberar carga em inspeção sem resultado de inspeção aprovado | Sistema bloqueia até inspeção ser registrada como aprovada | Alta |
| CT-10 | RN009 | US003 | Registrar carga sem responsável técnico ativo informado | Sistema bloqueia o registro | Alta |
| CT-11 | RN010 | US004 | Tentar transição de status fora da máquina de estados definida (ex.: Registrada → Liberada direto) | Sistema rejeita a transição inválida | Crítica |
| CT-12 | RN011 | US015 | Consultar histórico após qualquer mudança de status | Evento aparece de forma imutável e não pode ser editado/removido | Média |
| CT-13 | RN013 | US007 | Validar documentação de carga com documento anexado cuja validade expirou | Documento vencido não conta para completude; validação bloqueada | Crítica |
| CT-14 | RN019 | US006 / US007 | Anexar ou validar documento de tipo fora da cadeia Classificação → Risco → Documento Obrigatório do produto da carga | Sistema rejeita o tipo por não pertencer à exigência documental daquela carga | Alta |
| CT-15 | RN015 / RN017 | US018 | Excluir responsável técnico, risco ou classificação já vinculado a registros ativos | Sistema exige confirmação explícita com contagem de vínculos e realiza exclusão lógica (nunca física) | Média |
| CT-16 | RN020 | US004 / US010 / US019-US027 | Usuário autenticado com perfil não autorizado tenta executar uma ação fora da sua matriz de permissões (ex.: Operador tentando liberar carga, ou Analista de Qualidade tentando cadastrar produto) | Sistema rejeita a ação no domínio/backend, mesmo via chamada direta à API, independente da interface esconder ou não o botão | Crítica |
| CT-17 | RN012 | US003 | Registrar carga e, em seguida, alterar o nome/classe/unidade do produto químico no catálogo | A carga já registrada mantém o snapshot dos dados do produto capturados no momento do registro, sem sofrer efeito retroativo da edição no catálogo | Alta |
| CT-18 | RN005 | US013 | Desbloquear uma carga previamente bloqueada, informando justificativa | Sistema restaura o status anterior ao bloqueio (não um estado fixo), registra evento com autor/timestamp/justificativa e a carga retoma o fluxo normal | Alta |


## Casos de Uso Mais Críticos

- US003 - Registrar carga química
- US004 - Atualizar status da carga
- US007 - Validar documentação
- US009 - Registrar inspeção
- US010 - Liberar carga química
- US012 - Impedir movimentação de carga bloqueada

## Tipos de Teste

- Testes Unitários — Validam componentes isolados, regras de negócio e funções críticas para garantir comportamento correto em nível de código.
- Testes de Integração — Verificam a comunicação entre módulos, APIs e serviços envolvidos nos fluxos do QuimiPort.
- Testes de Fluxo (E2E) — Simulam jornadas completas do usuário para validar processos críticos de ponta a ponta.
- Testes de Regressão — Confirmam que alterações ou correções não comprometeram funcionalidades já validadas.

#### Classificação de Defeitos

- Defeitos críticos - Impedem a liberação, movimentação segura ou bloqueio correto de cargas químicas.
- Defeitos altos - Afetam fluxos essenciais, mas possuem contorno operacional controlado.
- Defeitos médios - Prejudicam usabilidade, validação ou rastreabilidade sem comprometer diretamente a segurança.
- Defeitos baixos - Envolvem ajustes visuais, mensagens ou melhorias sem impacto operacional relevante.

#### Critérios de Evidência dos Testes

Cada teste executado deve possuir evidência registrada, incluindo identificação do cenário, massa de dados utilizada, resultado esperado, resultado obtido, responsável pela execução, data da execução e indicação de aprovação ou reprovação. Evidências de falhas devem conter a descrição do defeito, severidade, impacto no fluxo e referência ao item corrigido ou pendente.


### Aplicação de Testes Unitários (JS/TS)

- Tipagem forte com TypeScript
- Interfaces para entidades e VO
- Classes para agregados
- Enums para status e risco
- Funções puras para validações
- Generics para resultados
- Tratamento de erros padronizado
- Módulos ES6+ para organização

### Testes de Integração Futuros

Os testes de integração futuros devem validar a comunicação entre APIs, serviços e camadas de persistência relacionadas a produtos químicos, cargas, documentos, inspeções e responsáveis técnicos, garantindo consistência entre os módulos que sustentam os fluxos críticos do QuimiPort.


### Validação dos Fluxos Principais

A validação dos fluxos principais deve concentrar-se nos processos de maior risco operacional e regulatório do QuimiPort, garantindo que o ciclo de vida da carga química seja executado de forma segura, auditável e aderente às regras de negócio.

- Registro da carga
- Validação documental
- Inspeção
- Liberação
- Bloqueio e desbloqueio
- Movimentação e finalização
- Documentação obrigatória, atuação do responsável técnico e preservação do histórico imutável de eventos
A aprovação desses fluxos deve considerar a execução dos cenários críticos, o registro das evidências correspondentes, a ausência de defeitos críticos pendentes e a confirmação de que transições inválidas, cargas bloqueadas ou estados terminais sejam corretamente impedidos pelo sistema.


### Organização de Mocks e Dados Simulados

- Mocks de produtos, documentos, RTs e cargas
- Fixtures de cargas completas/incompletas
- Stubs de inspeção e validação documental