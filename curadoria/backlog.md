# Backlog priorizado

Itens propostos a partir da [avaliacao tecnica](avaliacao.md). Prioridade
considera risco e dependencias, nao representa compromisso de release.

## P0 - Antes de acesso publico

| ID | Item | Criterio de aceite |
| --- | --- | --- |
| DMS-01 | Definir autenticacao e derivar a identidade do usuario de uma credencial validada, nunca de um cabecalho arbitrario do cliente. | Testes provam que um usuario nao lista nem baixa documentos de outro; cabecalhos falsificados nao alteram a identidade. |
| DMS-02 | Persistir metadados localmente e definir recuperacao consistente com os arquivos em `backend/storage`. | Apos reiniciar o backend, documentos validos continuam listaveis e baixaveis; falhas entre gravacao e registro tem comportamento recuperavel e testado. |

## P1 - Confiabilidade e manutencao

| ID | Item | Criterio de aceite |
| --- | --- | --- |
| DMS-03 | Criar CI de aplicacao para backend e frontend. | Pull requests executam `npm test` no backend e `npm run build` no frontend; falha em qualquer etapa bloqueia o gate. |
| DMS-04 | Documentar setup, configuracao, endpoints e limitacoes operacionais do DMS. | README explica instalacao, comandos, `PORT`, `MAX_FILE_SIZE_BYTES`, armazenamento local e ausencia atual de autenticacao/persistencia duravel. |
| DMS-05 | Definir politicas de capacidade e recuperacao para disco local. | Limites, espaco em disco, backup/restauracao e tratamento de arquivos sem metadados estao documentados e tem verificacao operacional sem exclusao automatica silenciosa. |
| DMS-06 | Adicionar testes de interface para estados de carregamento, erro, upload e download. | Testes cobrem os caminhos principais e suas falhas sem depender de um backend externo real. |

## P2 - Evolucao do produto

| ID | Item | Criterio de aceite |
| --- | --- | --- |
| DMS-07 | Introduzir paginacao e busca quando o volume de documentos justificar. | API define ordenacao estavel, limites maximos e testes para paginas vazias, limites e resultados filtrados. |
| DMS-08 | Avaliar exclusao, quotas por usuario e politicas de retencao. | Regras de negocio, autorizacao, confirmacao e comportamento de recuperacao sao especificados antes da implementacao; exclusao nao remove arquivos de terceiros. |
| DMS-09 | Adicionar observabilidade operacional sem registrar conteudo ou dados pessoais desnecessarios. | Logs estruturados e metricas permitem diagnosticar falhas de upload/download e saude do processo sem expor caminhos ou credenciais. |

## Ordem sugerida

1. DMS-03 e DMS-04 para estabelecer feedback automatico e onboarding claro.
2. DMS-01 e DMS-02 antes de qualquer uso com dados ou usuarios reais.
3. DMS-05 e DMS-06 para reduzir riscos operacionais e de regressao.
4. DMS-07 a DMS-09 conforme demanda observada e capacidade do MVP.