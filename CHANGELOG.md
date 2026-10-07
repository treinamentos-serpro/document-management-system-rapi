# Changelog

Este arquivo registra as mudancas funcionais do DMS. Ainda nao ha releases
formais identificadas; o estado atual permanece em `Unreleased`.

## [Unreleased]

### Adicionado

- API Express para upload, listagem por usuario e download de documentos.
- Armazenamento local dos arquivos em `backend/storage`, com nomes internos
  gerados pelo sistema e metadados mantidos em memoria.
- Identificacao funcional via `X-User-Id`, isolamento de listagem e verificacao
  de propriedade no download.
- Limite configuravel de upload por `MAX_FILE_SIZE_BYTES` e porta configuravel
  por `PORT`.
- Interface React para upload, listagem e download, integrada a API por `/api`
  no desenvolvimento.
- Testes de integracao do backend para contratos, isolamento, limites e falhas
  de upload.

### Observacoes

- `X-User-Id` nao autentica o usuario; nao usar como controle de acesso em um
  ambiente exposto a usuarios nao confiaveis.
- Metadados em memoria sao perdidos ao reiniciar o backend. Arquivos locais
  podem permanecer sem referencia depois do reinicio.