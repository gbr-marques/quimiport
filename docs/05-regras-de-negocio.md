
## Regras de negócio

> Regras que definem o limite sistêmico do QuimiPort — transversais a múltiplos casos de uso.

- **RN001** — Um produto químico não pode ser cadastrado sem nome.
- **RN002** — Um produto químico não pode ser cadastrado sem classe de risco.
- **RN003** — Um produto químico inativo não pode ser usado em novas cargas químicas. Cargas anteriores permanecem intactas.
- **RN004** — Uma carga química não pode ser registrada sem produto químico associado, sem quantidade maior que zero, sem classificação de risco e sem responsável técnico.
- **RN005** — Uma carga bloqueada não pode entrar em movimentação nem ser liberada até que seja formalmente desbloqueada.
- **RN006** — Uma carga cancelada não pode ser liberada ou modificada — é estado terminal.
- **RN007** — Uma carga só pode ser liberada se possuir documentação obrigatória completa e vigente.
- **RN008** — Uma carga em inspeção só transiciona para "Liberada" após inspeção aprovada.
- **RN009** — Toda carga química deve possuir um responsável técnico ativo informado.
- **RN010** — Transições de status seguem uma máquina de estados definida; transições fora da máquina são rejeitadas.
- **RN011** — Toda mudança de status gera um evento imutável no histórico da carga (append-only).
- **RN012** — Snapshot dos dados críticos do produto (nome, classe, unidade) deve ser preservado no momento do registro da carga, para não sofrer efeitos retroativos de edições no catálogo.
- **RN013** — Documentos com validade vencida não contam para a checagem de completude documental.
- **RN014** — Um produto químico deve referenciar uma classificação de risco cadastrada; classificações inativas não podem ser usadas em novos cadastros de produto. Uma classificação de risco deve, por sua vez, referenciar um Risco cadastrado, e um Risco deve referenciar pelo menos um Documento Obrigatório do catálogo.
- **RN015** — A exclusão de uma classificação de risco, de um risco, de um documento obrigatório, de um responsável técnico ou de um produto químico é sempre lógica (nunca física) quando já houver referência em registros dependentes — preserva a integridade do histórico e da auditoria (RN011).
- **RN016** — Alterações nos documentos obrigatórios de um Risco (ou na troca do Risco associado a uma Classificação) não são retroativas: cargas com documentação já validada mantêm a exigência vigente no momento do registro.
- **RN017** — Exclusão de responsável técnico, classificação de risco, risco ou documento obrigatório vinculado a registros ativos exige confirmação explícita do administrador, informando a quantidade de vínculos afetados.
- **RN018** — Somente documentos ativos do catálogo (Documento Obrigatório) podem ser associados a um Risco; somente riscos ativos podem ser associados a uma nova Classificação de Risco.
- **RN019** — Os documentos obrigatórios exigidos para o anexo e a validação documental de uma carga são determinados pela cadeia Classificação de Risco (do produto da carga) → Risco → Documento Obrigatório — nunca uma lista fixa ou texto livre. Essa lista é registrada em snapshot no momento do registro da carga (RN012) e não sofre efeito retroativo de mudanças posteriores no Risco ou na Classificação (RN016).
- **RN020** — Cada ação do sistema é restrita a um subconjunto de perfis autorizados (RNF002), conforme a matriz abaixo. A validação de perfil deve ocorrer no domínio/backend — nunca apenas ocultando o botão na interface — pois um acesso direto à API não pode contornar a regra.

  | Ação | Perfis autorizados |
  |---|---|
  | Cadastrar / inativar produto químico (US001, US002) | Administrador do Sistema |
  | Cadastrar / editar / excluir responsável técnico (US016-US018) | Administrador do Sistema |
  | Cadastrar / editar / excluir documento obrigatório, risco e classificação de risco (US019-US027) | Administrador do Sistema |
  | Registrar carga química (US003) | Operador Portuário |
  | Anexar documentação obrigatória à carga (US006) | Operador Portuário, Analista de Documentação |
  | Validar documentação da carga (US007) | Analista de Documentação |
  | Solicitar inspeção (US008) | Responsável Técnico |
  | Registrar resultado da inspeção (US009) | Responsável Técnico |
  | Liberar carga química (US010) | Responsável Técnico |
  | Bloquear carga química (US011) | Responsável Técnico |
  | Desbloquear carga química (US013) | Responsável Técnico |
  | Atualizar status operacional / cancelar carga (US004, US005) | Operador Portuário, Responsável Técnico |
  | Consultar cargas por status e histórico da carga (US014, US015) | Todos os perfis (leitura) — Analista de Qualidade e Gestor Operacional em modo somente-auditoria |

## 7. Requisitos não funcionais

- **RNF001 — Usabilidade:** interface responsiva, mensagens de erro em português claro.
- **RNF002 — Segurança:** autenticação obrigatória, autorização por perfil, senhas com hash, HTTPS em todos os ambientes.
- **RNF003 — Performance:** tempo de resposta médio menor que 500ms para operações simples e menor que 2s para operações compostas.
- **RNF004 — Manutenibilidade:** código TypeScript com tipagem forte, arquitetura em camadas (Domain, Application, Infrastructure, Interface), cobertura de testes de pelo menos 80% no domínio.
- **RNF005 — Auditabilidade:** trilha imutável de todos os eventos de mudança de status, com autor, timestamp e motivo quando aplicável.
