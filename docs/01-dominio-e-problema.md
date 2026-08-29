# Domínio e problema

## Contexto do problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil. Entre os diversos tipos de cargas movimentadas, existem produtos químicos que exigem controle cuidadoso, documentação adequada, classificação de risco e acompanhamento técnico.

Uma empresa que atua no controle de cargas químicas precisa organizar melhor o fluxo e logística dessas cargas. Hoje, o registro é feito de forma manual ou descentralizada, dificultando a consulta de informações, o acompanhamento do status e a validação de regras importantes de segurança.

O **QuimiPort** é o sistema que resolve esse problema, permitindo:

- Cadastrar produtos químicos
- Registrar cargas químicas
- Associar uma carga a um produto químico
- Informar classificação de risco
- Registrar documentação obrigatória
- Definir responsável técnico
- Acompanhar o status da carga
- Bloquear ou liberar uma carga conforme regras de negócio
- Validar regras de segurança
- Consultar cargas e histórico

## Domínio

> É a área de conhecimento, negócio ou atividade que representa o contexto no qual o sistema está inserido. O domínio engloba os conceitos, processos, regras e comportamentos relevantes para compreender e solucionar o problema de negócio.

Gestão de cargas químicas num ambiente portuário, assim como processos relacionados à tais cargas, como cadastro de produtos químicos, registro de cargas, acompanhamento, classificação de riscos, etc.

## Subdomínios principais

> São as partes do domínio que concentram os processos mais estratégicos do negócio, representando as atividades que geram maior valor para a organização e que justificam a existência da solução ou do sistema.

- **Gestão de Cargas Químicas:** registro, acompanhamento e controle do ciclo de vida das cargas.
- **Controle de Segurança e Riscos:** classificação de risco e validação das condições necessárias para movimentação.
- **Controle de Documentação:** registro e validação da documentação obrigatória.
- **Liberação e Bloqueio de Cargas:** aplicação das regras necessárias para determinar se uma carga pode ser liberada ou deve permanecer bloqueada.

## Subdomínios de suporte

> São partes do domínio que apoiam os processos principais, fornecendo funcionalidades e informações necessárias para o funcionamento do negócio, mas que não representam o seu objetivo central.

- **Gestão de Responsáveis Técnicos:** controle dos responsáveis associados às cargas.
- **Gestão de Inspeções:** registro e acompanhamento das inspeções realizadas nas cargas.
- **Histórico e Rastreabilidade:** registro das alterações e do ciclo de vida das cargas.
- **Gestão de Produtos Químicos:** cadastro e manutenção dos produtos que poderão ser associados às cargas.