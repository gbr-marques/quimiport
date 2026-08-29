# Plano de qualidade 

Os testes têm como principal objetivo garantir que as regras de negócio e os fluxos mais importantes do QuimiPort funcionem conforme o esperado. O foco está em validar comportamentos críticos do sistema, como o cadastro de produtos químicos, registro de cargas, validação documental, bloqueios operacionais e transições de status.

Além de identificar possíveis falhas, os testes ajudam a garantir a consistência das regras de negócio e dão mais segurança para a evolução do projeto, evitando que novas alterações comprometam funcionalidades já existentes.

## Cenários de teste


### 3.1 CT-02 — Bloquear cadastro de produto químico sem classe de risco

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-02 |
| **Regra de Negócio** | RN002 — Catálogo de Produtos Químicos |
| **Caso de Uso** | US001 — Cadastrar produto químico |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Usuário autenticado com permissão para gestão de produtos químicos.
- Acesso à funcionalidade de cadastro de produto químico.

#### Massa de Dados / Fixtures

- **Nome do Produto:** Ácido Sulfúrico Concentrado
- **Classe de Risco:** Não selecionada / Nulo

#### Passos de Execução

1. Acessar a tela de cadastro de produto químico.
2. Preencher o campo de nome do produto com `Ácido Sulfúrico Concentrado`.
3. Deixar o campo/seleção de `Classificação de Risco` em branco.
4. Submeter o formulário / disparar a criação da entidade.

#### Resultado Esperado

- O sistema bloqueia a criação/cadastro do produto.
- É lançada uma exceção de validação e exibida mensagem sobre a obrigatoriedade da classe de risco.
- Nenhum registro é gravado na base de dados.

---


### 3.2 CT-03 — Bloquear registro de carga com produto químico inativo

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-03 |
| **Regra de Negócio** | RN003 — Catálogo de Produtos Químicos |
| **Caso de Uso** | US003 — Registrar carga química |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Existe um produto químico previamente cadastrado com status igual a `Inativo`.
- Responsável Técnico ativo disponível no sistema.

#### Massa de Dados / Fixtures

- **Produto Químico:** ID `PROD-099` — Status: Inativo
- **Responsável Técnico:** ID `RT-001` — Status: Ativo
- **Quantidade:** `5000 kg`

#### Passos de Execução

1. Iniciar o processo de registro de uma nova carga química.
2. Selecionar o produto químico `PROD-099` (Inativo).
3. Preencher a quantidade válida e associar o RT ativo `RT-001`.
4. Confirmar a tentativa de registro da carga.

#### Resultado Esperado

- O sistema bloqueia o registro da carga.
- Exibe mensagem informando que produtos inativos não podem ser associados a novas cargas.
- A carga não é gravada nem ganha status inicial.

---


### 3.3 CT-04 — Validar quantidade de carga maior que zero no registro

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-04 |
| **Regra de Negócio** | RN004 — Ciclo de Vida da Carga Química |
| **Caso de Uso** | US003 — Registrar carga química |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Produto químico ativo e com classe de risco válida.
- Responsável técnico ativo cadastrado.

#### Massa de Dados / Fixtures

- **Caso A:** Quantidade = `0 kg`
- **Caso B:** Quantidade = `-10 kg`
- **Produto:** Cloro Líquido — Ativo

#### Passos de Execução

1. Tentar registrar a carga informando produto e RT válidos.
2. Informar no campo de quantidade o valor `0` ou valor negativo.
3. Submeter a requisição de registro da carga.

#### Resultado Esperado

- O sistema bloqueia o registro.
- Aponta inconsistência no campo de quantidade, informando que o valor deve ser estritamente maior que zero (`> 0`).

---


### 3.4 CT-05 — Bloquear movimentação ou liberação de carga com status "Bloqueada"

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-05 |
| **Regra de Negócio** | RN005 — Ciclo de Vida da Carga Química |
| **Caso de Uso** | US012 — Impedir movimentação de carga bloqueada |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Existe uma carga registrada no sistema com status atual igual a `Bloqueada`.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-777` — Status: Bloqueada

#### Passos de Execução

1. Tentar executar a ação de `Liberar Carga` para a carga `CARGA-777`.
2. Tentar executar a ação de `Movimentar Carga` para o pátio/armazém destino.

#### Resultado Esperado

- O sistema impede e rejeita imediatamente ambas as ações.
- Exibe mensagem informando que a carga encontra-se bloqueada e exige procedimento formal de desbloqueio.

---

### 3.5 CT-07 — Bloquear liberação de carga sem documentação obrigatória

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-07 |
| **Regra de Negócio** | RN007 — Documentação Obrigatória |
| **Caso de Uso** | US007 — Validar documentação |

#### Pré-condições

- Carga cadastrada e aguardando validação documental.
- Documento obrigatório pendente de envio.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-102`
- **Documentação:** Documento obrigatório pendente de envio.

#### Passos de Execução

1. Submeter a carga `CARGA-102` para validação documental.
2. Executar a verificação dos documentos obrigatórios.

#### Resultado Esperado

- O sistema detecta ausência de documento obrigatório.
- Bloqueia o processo de liberação.
- Exibe a lista detalhada dos documentos ausentes.

---


### 3.6 CT-08 — Permitir liberação de carga com documentação completa e válida

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-08 |
| **Regra de Negócio** | RN007 — Documentação Obrigatória |
| **Caso de Uso** | US010 — Liberar carga química |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Carga apta para liberação.
- Todos os documentos obrigatórios estão anexados e vigentes.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-200` — Status: Aguardando Liberação
- **Documentos:**
  - Licença Ambiental;
  - FISPQ;
  - Certificado de Análise.

Todos os documentos são válidos.

#### Passos de Execução

1. Solicitar liberação operacional da carga `CARGA-200`.
2. Revalidar o checklist de documentos vigentes.

#### Resultado Esperado

- O sistema aprova a transição e altera o status para `Liberada`.
- Registra evento imutável no histórico auditável da carga.

---

### 3.7 CT-06 — Validar transição direta indevida de carga registrada para liberada

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-06 |
| **Regra de Negócio** | RN006 — Ciclo de Vida da Carga Química |
| **Caso de Uso** | US004 — Atualizar status da carga |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Carga recém-registrada no sistema.
- Status atual da carga igual a `Registrada`.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-101` — Status: Registrada

#### Passos de Execução

1. Tentar alterar diretamente `CARGA-101` de `Registrada` para `Liberada`.

#### Resultado Esperado

- O sistema rejeita a transição direta.
- Emite mensagem de erro sobre transição de status proibida.
- O status original da carga permanece inalterado.

---

### 3.8 CT-11 — Impedir reativação ou liberação de carga em estado terminal

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-11 |
| **Regra de Negócio** | RN010 — Ciclo de Vida da Carga Química |
| **Caso de Uso** | US010 — Liberar carga química |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

#### Pré-condições

- Carga em estado terminal.
- Status atual da carga igual a `Cancelada`.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-303` — Status: Cancelada

#### Passos de Execução

1. Tentar alterar `CARGA-303` de `Cancelada` para `Liberada`.

#### Resultado Esperado

- O sistema rejeita a transição a partir de estado terminal.
- Emite mensagem de erro informando que cargas canceladas não podem ser liberadas.
- O status original da carga permanece inalterado.

---

### 3.9 CT-13 — Bloquear liberação de carga com documentação vencida

| Campo | Informação |
|---|---|
| **ID do Cenário** | CT-13 |
| **Regra de Negócio** | RN013 — Documentação Obrigatória |
| **Caso de Uso** | US010 — Liberar carga química |
| **Prioridade / Severidade** | Crítica |
| **Tipo de Teste** | Teste Unitário / Regra de Negócio |

##### Pré-condições

- Carga cadastrada e aguardando liberação.
- Documento obrigatório anexado, porém fora do prazo de validade.

#### Massa de Dados / Fixtures

- **Carga:** ID `CARGA-102`
- **Documentação:** FISPQ vencida.

#### Passos de Execução

1. Submeter a carga `CARGA-102` para o fluxo de liberação.
2. Executar validação da vigência documental.

#### Resultado Esperado

- O sistema detecta documento obrigatório vencido.
- Bloqueia o processo de liberação.
- Exibe a lista detalhada dos documentos expirados.

---

## 4. Critérios de Aprovação

Os cenários serão considerados aprovados quando:

- Todos os passos de execução forem concluídos com sucesso;
- Os resultados esperados forem confirmados;
- Não houver defeitos críticos ou bloqueantes em aberto;
- As evidências mínimas de execução estiverem registradas conforme as diretrizes deste documento.

---

## 5. Matriz de Rastreabilidade

| ID Cenário | ID Plano QA | Regra de Negócio | Caso de Uso | Prioridade | Tipo de Teste |
|---|---|---|---|---|---|
| CT-02 | CT-02 | RN002 | US001 | Crítica | Unitário / Regra de Negócio |
| CT-03 | CT-03 | RN003 | US003 | Crítica | Unitário / Regra de Negócio |
| CT-04 | CT-04 | RN004 | US003 | Crítica | Unitário / Regra de Negócio |
| CT-05 | CT-05 | RN005 | US012 | Crítica | Unitário / Regra de Negócio |
| CT-06 | CT-06 | RN006 | US004 | Crítica | Unitário / Regra de Negócio |
| CT-07 | CT-07 | RN007 | US007 | Crítica | Unitário / Regra de Negócio |
| CT-08 | CT-08 | RN007 | US010 | Crítica | Unitário / Regra de Negócio |
| CT-11 | CT-11 | RN010 | US010 | Crítica | Unitário / Regra de Negócio |
| CT-13 | CT-13 | RN013 | US010 | Crítica | Unitário / Regra de Negócio |

---

## 6. Diretrizes de Execução e Evidências

### Automação de Domínio

Conforme o item 4.1 do Plano de Qualidade, cada cenário deve ser implementado inicialmente como **teste unitário isolado em Node.js/TypeScript**, aplicado às entidades de domínio e aos agregados correspondentes.

Somente após essa validação os cenários devem evoluir para fluxos de integração ou testes E2E.

### Critérios de Registro de Evidências

Cada teste deve gerar uma evidência contendo:

- **ID do cenário**;
- **Massa utilizada**;
- **Resultado obtido**;
- **Data/hora da execução**;
- **Responsável**;
- **Log/print de validação**, conforme a seção 6.2 do Plano de Qualidade.

## Futuros testes de integração

Os testes de integração serão utilizados para validar a comunicação entre os principais componentes da aplicação, garantindo que os casos de uso funcionem corretamente junto aos repositórios, banco de dados e demais dependências.

## Validação de fluxos principais 

Os principais fluxos serão validados com base nos casos de uso e regras de negócio críticas, como registro de cargas, validação documental, bloqueios e transições de status, verificando o comportamento esperado em cada etapa.

## Mocks e dados simulados 

Mocks e dados simulados serão centralizados e reutilizáveis, contemplando cenários válidos e inválidos, como produtos ativos e inativos e cargas com diferentes situações documentais e status.