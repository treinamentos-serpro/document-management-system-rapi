# Avaliacao tecnica

Revisao documental e estatica do estado do repositorio em 2026-10-06. O objetivo
e orientar a organizacao e a evolucao do MVP, nao certificar seguranca ou
prontidao para producao.

## Resumo

O projeto esta bem organizado para um MVP de treinamento: usa camadas backend
coerentes com as instrucoes, respeita o armazenamento local, separa os dados
publicos dos internos e tem testes de integracao para fluxos e falhas relevantes.
Ainda nao esta pronto para uso multiusuario confiavel ou recuperacao de dados em
producao, principalmente por identidade fornecida pelo cliente e metadados
volateis.

## Aderencias observadas

- **Arquitetura:** rotas delegam aos controllers; regras de documentos ficam no
  service; persistencia e filesystem ficam no repository.
- **Upload local:** Multer usa `diskStorage`, nome interno UUID, limite de
  tamanho e remocao do arquivo se o registro falhar.
- **Isolamento funcional:** listagem filtra pelo usuario; download verifica o
  dono e responde 404 tanto para documento ausente quanto alheio.
- **Tratamento de entrada e erros:** identificador e tamanho sao validados;
  respostas nao expoem caminhos internos.
- **Testes:** `node:test` cobre contratos, limites, isolamento e cenarios de
  falha. A compilacao de producao do Vite tambem foi verificada.

## Lacunas e riscos

| Prioridade | Achado | Consequencia |
| --- | --- | --- |
| P0 para exposicao publica | `X-User-Id` e aceito diretamente do cliente e pode ser falsificado. | Um cliente pode se passar por outro usuario; a separacao atual nao e autorizacao real. |
| P0 para durabilidade | Metadados existem somente em memoria, enquanto arquivos ficam no disco. | Reiniciar o processo remove a referencia dos documentos e pode deixar arquivos orfaos. |
| P1 | Nao foi encontrada pipeline de CI para executar testes e build; os workflows atuais automatizam etapas do treinamento. | Alteracoes podem ser integradas sem verificacao automatica consistente. |
| P1 | Frontend nao declara script ou suite de testes; tambem nao ha script de lint nos pacotes. | Comportamentos de interface e convencoes nao tem gate automatizado. |
| P1 | README raiz ainda descreve o exercicio, nao a operacao do DMS. | Novas pessoas nao encontram rapidamente setup, configuracao ou limites do MVP. |
| P2 | Os dados locais nao possuem estrategia documentada de backup, recuperacao ou limpeza auditavel de arquivos sem metadados. | Recuperacao e uso de disco ficam dependentes de intervencao manual. |

As prioridades P0 descrevem bloqueios para exposicao a usuarios nao confiaveis;
nao invalidam os objetivos didaticos do MVP local. A especificacao ja declara
essas limitacoes, portanto a lacuna e principalmente de evolucao e governanca,
nao uma divergencia acidental do contrato atual.

## Verificacoes realizadas

- Backend: `npm test` em `backend/` passou com 9 testes.
- Frontend: `npm run build` em `frontend/` concluiu com sucesso.
- Revisados os contratos em `docs/specs/dms-spec.md`, os pacotes, o fluxo
  principal do backend e os componentes principais do frontend.
- Nao foram executados testes em navegador, scanners de seguranca, lint ou testes
  automatizados de frontend; nao ha configuracao desses gates nos pacotes.