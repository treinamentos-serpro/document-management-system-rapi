---
description: Implementa uma entrega pequena do DMS, valida as mudancas e prepara uma pull request.
name: preparar-pr
argument-hint: objetivo da entrega (inclua issue e criterios de aceite, se houver)
agent: agent
---

# Preparar uma pull request

Conduza a entrega solicitada: `${input:objetivo:descreva o objetivo da mudanca}`. Se houver uma issue ou criterios de aceite no contexto, use-os como fonte de verdade.

## 1. Entender e limitar o escopo

- Leia as instrucoes aplicaveis em `.github/copilot-instructions.md` e consulte a especificacao, o backlog e os arquivos proximos ao comportamento solicitado.
- Verifique `git status` antes de editar. Preserve alteracoes preexistentes; nao as reverta, inclua ou reformate se forem alheias a entrega.
- Resuma o resultado esperado e os criterios de aceite. Se faltar uma decisao que afete comportamento, seguranca ou compatibilidade, pergunte antes de assumir.
- Prefira uma entrega pequena, vertical e demonstravel. Evite refatoracoes e dependencias que nao sejam necessarias; divida propostas grandes em incrementos.

## 2. Implementar

- Siga a arquitetura e as convencoes existentes. No backend, respeite o fluxo `routes -> controllers -> services -> repositories`; no frontend, reutilize os componentes e o cliente `fetch` existentes.
- Preserve os contratos atuais e o armazenamento estritamente local em `backend/storage`. Nao introduza provedores externos, autenticacao ou persistencia nova sem que o escopo e a especificacao autorizem essa mudanca.
- Escreva ou ajuste testes focados nos criterios de aceite e nos casos de erro relevantes. Nao altere testes apenas para ocultar uma regressao.
- Atualize `CHANGELOG.md` para mudancas funcionais visiveis ao usuario. Atualize especificacoes ou backlog somente quando a entrega mudar esses contratos ou prioridades. Nao use `historico-treinamento.md` como changelog.
- Nao inclua segredos, dados pessoais reais ou artefatos gerados na entrega.

## 3. Validar e revisar

- Depois de editar, execute primeiro a verificacao mais especifica disponivel para a mudanca.
- Para mudancas no backend, execute `cd backend && npm test`.
- Para mudancas no frontend, execute `cd frontend && npm run build`.
- Se algum comando nao puder ser executado, informe o motivo e nao declare a verificacao como aprovada.
- Revise o diff e confirme que cada alteracao pertence ao escopo, que os criterios de aceite foram atendidos e que nenhuma mudanca do usuario foi perdida.
- Nao corrija problemas preexistentes sem relacao com a entrega; registre-os separadamente quando forem relevantes.

## 4. Preparar a PR

Apresente um titulo curto e um corpo de PR pronto para revisao, sem inventar issue, resultados ou evidencias. Use este formato:

```markdown
## Objetivo
[Problema ou necessidade atendida]

## O que mudou
- [Mudanca observavel e relevante]

## Validacao
- [Comando executado e resultado]

## Criterios de aceite
- [x] [Criterio atendido]

## Riscos ou observacoes
- [Limitacoes, migracoes ou verificacoes pendentes; remova a secao se nao houver]
```

Use uma categoria coerente no titulo (`feat`, `fix`, `docs`, `test` ou `chore`) e inclua o identificador da issue somente quando ele tiver sido fornecido. Nao faca commit, push, abra ou mescle uma PR sem autorizacao explicita para a respectiva acao. Se a publicacao nao estiver autorizada ou nao for possivel, entregue o titulo e o corpo sugeridos e explique o que falta.