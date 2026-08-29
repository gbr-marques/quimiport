# Linguagem ubíqua

> Termos de negócio usados de forma consistente no código, na documentação e no discurso da equipe.

| Termo | Definição |
|-------|-----------|
| **Produto Químico** | Substância cadastrada no catálogo, com nome, classe de risco e demais atributos técnicos |
| **Carga Química** | Unidade movimentada no porto, sempre associada a um produto químico, com quantidade, responsável técnico e documentação. É o **agregado raiz** do domínio |
| **Classe de Risco** | Classificação atribuída ao produto químico conforme enum definido pela equipe |
| **Responsável Técnico (RT)** | Profissional habilitado que responde tecnicamente pela carga |
| **Documento da Carga** | Arquivo documental obrigatório vinculado a uma carga |
| **Inspeção** | Verificação técnica formal antes da liberação |
| **Liberação** | Ato formal que autoriza a carga a entrar em movimentação |
| **Bloqueio** | Ato de suspender a carga por suspeita ou risco identificado |
| **Movimentação** | Deslocamento físico da carga no ambiente portuário |
| **Status da Carga** | Estado atual da carga na máquina de estados (Registrada, Em Validação Documental, Em Inspeção, Liberada, Em Movimentação, Bloqueada, Cancelada, Finalizada) |
| **Evento** | Registro imutável de uma ação ou transição realizada sobre uma carga |
| **Documentação Obrigatória** | Conjunto de documentos exigidos para a carga ser liberada |
