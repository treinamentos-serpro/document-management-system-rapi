# Visao futura

Evoluir o DMS de demonstracao local para uma aplicacao confiavel de gestao de
documentos, mantendo uma arquitetura simples e fazendo mudancas somente depois
de validar requisitos, ameacas e operacao. Esta visao nao altera as restricoes
atuais: os arquivos continuam no filesystem local e nao se introduz provedor de
armazenamento externo sem revisao explicita do escopo.

## Fase 1 - MVP verificavel

- Automatizar testes do backend e build do frontend em CI.
- Documentar instalacao, configuracao, endpoints e limitacoes conhecidas.
- Definir uma rotina manual e segura para observar espaco e preservar os dados
  locais.

## Fase 2 - Dados duraveis e identidade confiavel

- Substituir o mapa em memoria por persistencia local adequada ao volume
  esperado, mantendo os metadados separados dos arquivos.
- Definir consistencia entre metadados e arquivo, migracao, backup, restauracao e
  recuperacao apos falhas; nao apagar arquivos desconhecidos automaticamente.
- Adotar autenticacao e obter o identificador do usuario de uma identidade
  verificada. `X-User-Id` passa a ser apenas um detalhe interno/teste, se ainda
  necessario.

## Fase 3 - Operacao e crescimento controlado

- Medir volume, tamanho dos arquivos, espaco em disco e padroes de consulta.
- Acrescentar quotas, paginacao, busca, retencao ou exclusao somente com regras
  de negocio e criterios de autorizacao definidos.
- Instrumentar saude, erros e tempos das operacoes sem registrar conteudo de
  documentos ou segredos.

## Diretrizes para decisoes futuras

- Manter as camadas atuais enquanto reduzirem acoplamento; nao adicionar
  abstracoes sem uma necessidade concreta.
- Preservar arquivos locais em `backend/storage` como requisito vigente.
- Tratar autenticacao, persistencia duravel e operacao como decisoes de produto
  que exigem revisao da especificacao e criterios de aceite antes de alterar o
  MVP.
- Atualizar changelog e backlog quando uma capacidade for implementada ou uma
  prioridade mudar.