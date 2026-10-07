# Especificacao - Document Management System

> Especificacao funcional e tecnica do MVP, elaborada a partir de
> `docs/specs/spec-template.md` para orientar as etapas seguintes do treinamento.
> Esta entrega conclui somente a etapa de especificacao; nao implementa codigo.

## 1. Objetivo

Disponibilizar uma aplicacao web simples para que usuarios enviem, listem e
baixem seus documentos, armazenando os arquivos no filesystem local e mantendo
os metadados em memoria durante a execucao do backend.

## 2. Escopo

### Dentro do escopo

- Receber um arquivo por requisicao de upload.
- Associar cada documento a um identificador de usuario informado na requisicao.
- Listar somente os documentos associados ao usuario da requisicao.
- Permitir o download de um documento somente ao usuario dono.
- Gravar os arquivos localmente com Multer e `diskStorage`.
- Manter metadados em memoria durante a vida do processo do backend.
- Disponibilizar uma interface React para upload, listagem e download, consumindo
  a API por meio do prefixo `/api` no ambiente de desenvolvimento.

### Fora do escopo

- Cadastro de usuarios, login, autenticacao e autorizacao baseada em credenciais.
- Armazenamento externo, em nuvem ou em servicos de terceiros.
- Banco de dados ou persistencia duravel dos metadados.
- Versionamento, edicao, exclusao ou compartilhamento de documentos.
- Busca, pastas, paginacao e filtros avancados.
- Garantia de recuperacao dos metadados depois que o backend reiniciar.

## 3. Requisitos funcionais

| ID | Requisito | Criterio de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve identificar o usuario da requisicao pelo cabecalho `X-User-Id`. | Requisicoes sem identificador valido nao executam operacoes de documento e recebem erro HTTP 400. |
| RF-02 | O usuario pode enviar um arquivo usando `multipart/form-data` no campo `file`. | Um upload valido retorna HTTP 201 e os metadados publicos do documento criado. |
| RF-03 | Cada documento deve receber um identificador unico e uma data/hora de upload. | O identificador nao depende do nome enviado; a data e retornada em ISO 8601. |
| RF-04 | O sistema deve associar o documento ao usuario que realizou o upload. | O campo `owner` da resposta corresponde ao `X-User-Id` da requisicao. |
| RF-05 | O sistema deve listar os documentos do usuario identificado. | A resposta contem somente documentos cujo `owner` corresponde ao usuario. |
| RF-06 | A listagem deve apresentar primeiro os documentos mais recentes. | A ordenacao e decrescente por `uploadedAt`; empates podem ser resolvidos pelo identificador. |
| RF-07 | O usuario pode baixar um documento pelo identificador. | Um documento existente e pertencente ao usuario retorna seu conteudo binario. |
| RF-08 | O sistema deve ocultar documentos inexistentes e documentos de outros usuarios da mesma forma. | Ambos os casos retornam HTTP 404 no endpoint de download. |
| RF-09 | O sistema deve rejeitar upload sem arquivo ou com arquivo vazio. | A requisicao recebe HTTP 400, sem registrar metadados nem deixar arquivo parcial. |
| RF-10 | O sistema deve impedir que o nome original determine o caminho fisico do arquivo. | O nome de armazenamento e unico e gerado pelo sistema; o caminho final permanece dentro de `backend/storage`. |

## 4. Requisitos nao funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local da aplicacao, em `backend/storage`, usando Multer com `diskStorage`. Nao usar provedores externos. |
| RNF-02 | Os metadados devem ser mantidos em memoria nesta fase. Reiniciar o backend limpa os metadados; os arquivos que permanecerem no disco podem ficar sem referencia. |
| RNF-03 | Configuracoes de ambiente devem seguir o principio 12-Factor. `PORT` define a porta do backend (padrao atual: `3000`) e `MAX_FILE_SIZE_BYTES` define o limite por arquivo (padrao inicial: `10485760`, 10 MiB). |
| RNF-04 | A camada de rotas deve delegar aos controllers; controllers tratam HTTP e validacao basica; services concentram regras de negocio; repositories tratam arquivos e metadados. Dependencias seguem `routes -> controllers -> services -> repositories`. |
| RNF-05 | Camadas internas nao devem depender de Express, detalhes de HTTP ou componentes do frontend. |
| RNF-06 | O nome original e dados fornecidos pelo cliente devem ser tratados como entrada nao confiavel. O nome original nao pode ser concatenado a caminhos do filesystem. |
| RNF-07 | Erros devem ser tratados nos limites do sistema; respostas nao devem incluir stack trace, caminhos locais ou nomes internos de armazenamento. |
| RNF-08 | Os testes automatizados do backend devem usar o runner nativo `node:test`. O frontend deve manter React + Vite e realizar chamadas HTTP com `fetch`. |
| RNF-09 | O identificador `X-User-Id` e apenas uma identidade funcional para o MVP. Como pode ser fornecido pelo cliente, nao representa autenticacao nem deve ser considerado uma fronteira de seguranca para producao. |

## 5. Modelo de dados

### 5.1 Metadados publicos do documento

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador unico gerado pelo sistema, preferencialmente UUID. |
| `originalName` | string | Sim | Nome original recebido no upload; usado como nome sugerido para download, nunca como caminho de armazenamento. |
| `size` | number | Sim | Tamanho do arquivo em bytes, inteiro maior que zero. |
| `uploadedAt` | string | Sim | Data e hora de criacao em formato ISO 8601 UTC. |
| `owner` | string | Sim | Valor validado de `X-User-Id` que enviou o documento. |

Exemplo:

```json
{
  "id": "7f6d30f0-0f3b-4ecf-87ac-6912aa7b2e65",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-06T14:30:00.000Z",
  "owner": "usuario-demo"
}
```

### 5.2 Dados internos de armazenamento

O repository de documentos deve associar os metadados a um nome interno de
armazenamento opaco e unico (por exemplo, `storageName`). Esse dado e o caminho
fisico nao fazem parte das respostas da API. O repository de arquivos resolve
o nome interno dentro de `backend/storage` e rejeita qualquer caminho que saia
desse diretorio.

Os arquivos sao gravados com nomes gerados pelo sistema, sem confiar no nome
original. A gravacao e feita em `backend/storage` por Multer `diskStorage`.
Se o registro dos metadados falhar depois da gravacao, o arquivo recem-criado
deve ser removido para evitar um artefato sem registro.

## 6. Contratos de API

### 6.1 Convencoes comuns

- Os endpoints do backend sao relativos a raiz: `/upload`, `/documents` e
  `/documents/:id/download`.
- O frontend usa o prefixo `/api`; o proxy de desenvolvimento do Vite remove
  esse prefixo ao encaminhar a requisicao ao backend.
- Operacoes de documento exigem `X-User-Id` com valor nao vazio, sem espacos nas
  extremidades e com tamanho maximo de 128 caracteres.
- O MVP nao implementa autenticacao. O valor do cabecalho e uma identificacao
  funcional para separar documentos durante o treinamento.
- Respostas JSON de erro seguem o formato `{ "error": { "code": "...", "message": "..." } }`.
- Erros internos nao devem retornar stack traces ou informacoes do filesystem.

### 6.2 `POST /upload`

Envia um documento para o usuario identificado.

**Requisicao**

- `Content-Type: multipart/form-data`
- Cabecalho obrigatorio: `X-User-Id`
- Campo multipart obrigatorio: `file` (um arquivo)
- Tamanho permitido: maior que zero e ate `MAX_FILE_SIZE_BYTES`.
- Tipos de arquivo: sem allowlist nesta fase.

**Sucesso - `201 Created`**

```json
{
  "document": {
    "id": "7f6d30f0-0f3b-4ecf-87ac-6912aa7b2e65",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-06T14:30:00.000Z",
    "owner": "usuario-demo"
  }
}
```

**Erros**

| HTTP | Codigo | Quando |
| --- | --- | --- |
| 400 | `INVALID_USER` | `X-User-Id` ausente, vazio ou acima do limite definido. |
| 400 | `FILE_REQUIRED` | Campo `file` ausente ou arquivo vazio. |
| 413 | `FILE_TOO_LARGE` | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| 500 | `UPLOAD_FAILED` | Falha inesperada ao gravar o arquivo ou registrar metadados. |

### 6.3 `GET /documents`

Lista os documentos do usuario identificado, ordenados por data de upload
decrescente. Uma lista vazia e uma resposta valida.

**Requisicao**

- Cabecalho obrigatorio: `X-User-Id`

**Sucesso - `200 OK`**

```json
{
  "documents": [
    {
      "id": "7f6d30f0-0f3b-4ecf-87ac-6912aa7b2e65",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-06T14:30:00.000Z",
      "owner": "usuario-demo"
    }
  ]
}
```

**Erros**

| HTTP | Codigo | Quando |
| --- | --- | --- |
| 400 | `INVALID_USER` | `X-User-Id` ausente, vazio ou acima do limite definido. |
| 500 | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar os metadados. |

### 6.4 `GET /documents/:id/download`

Retorna o conteudo binario de um documento pertencente ao usuario identificado.

**Requisicao**

- Cabecalho obrigatorio: `X-User-Id`
- Parametro `id`: identificador do documento.

**Sucesso - `200 OK`**

- Corpo: bytes do arquivo, sem envelope JSON.
- `Content-Type: application/octet-stream`.
- `Content-Disposition: attachment`, com `originalName` codificado com seguranca
  como nome sugerido para download.

**Erros**

| HTTP | Codigo | Quando |
| --- | --- | --- |
| 400 | `INVALID_USER` | `X-User-Id` ausente, vazio ou acima do limite definido. |
| 404 | `DOCUMENT_NOT_FOUND` | Documento inexistente, de outro usuario ou sem arquivo local correspondente. |
| 500 | `DOWNLOAD_FAILED` | Falha inesperada ao ler ou transmitir o arquivo. |

Retornar `404` tanto para um documento inexistente quanto para um documento de
outro usuario evita revelar a existencia de documentos alheios.

## 7. Decisoes arquiteturais

- Backend em Node.js + Express, CommonJS, com quatro camadas: `routes/`,
  `controllers/`, `services/` e `repositories/`.
- `routes/` declara os endpoints e conecta middlewares/controllers; nao contem
  regras de negocio.
- `controllers/` leem cabecalhos, parametros e arquivos da requisicao, validam
  o basico e traduzem resultados/erros para HTTP.
- `services/` aplicam regras de upload, propriedade, listagem e autorizacao do
  download, sem conhecer Express ou o filesystem diretamente.
- `repositories/` mantem metadados em memoria e grava/le arquivos no filesystem
  local. Nenhuma dependencia de armazenamento externo e permitida.
- Frontend em React + Vite, com componentes funcionais e Hooks. A comunicacao
  com o backend usa `fetch` e o prefixo `/api`.
- Configuracao operacional por variaveis de ambiente; o backend usa `PORT` e
  `MAX_FILE_SIZE_BYTES` conforme definidos nesta especificacao.
- A perda de metadados no restart e uma limitacao assumida do MVP. Nao executar
  limpeza automatica de arquivos sem metadados, pois ela poderia apagar dados
  locais sem confirmacao.

## 8. Plano de execucao

As etapas abaixo sao um roteiro futuro em nivel de capacidade. Esta entrega
realiza somente a especificacao; nao cria nem altera arquivos de backend ou
frontend.

1. **Concluir a especificacao:** revisar requisitos, modelo, contratos, limites
   e criterios de aceite antes de iniciar implementacao.
2. **Construir o fluxo de backend:** implementar upload local e metadados em
   memoria, preservando a separacao entre rotas, controllers, services e
   repositories.
3. **Completar consulta e acesso:** implementar listagem por usuario e download
   com verificacao de propriedade e respostas consistentes.
4. **Construir a experiencia web:** integrar upload, listagem e download ao
   backend pela API `/api`, apresentando estados de sucesso e erro.
5. **Validar a entrega:** testar os contratos, isolamento entre usuarios,
   limites de upload, integridade dos arquivos e fluxo completo no navegador.

## 9. Criterios de aceite da especificacao

- Este documento atende as secoes do modelo em `docs/specs/spec-template.md`.
- Os tres contratos de API definem entrada, saida, cabecalhos e erros esperados.
- Metadados publicos estao separados dos dados internos de armazenamento.
- O plano deixa claro que a implementacao de backend e frontend pertence a
  etapas posteriores.
- Nenhum codigo de aplicacao e alterado para concluir esta etapa.