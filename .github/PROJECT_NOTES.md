# Notas de manutenção e evolução

Este arquivo concentra decisões, mudanças de plano e trabalho pendente. Ele é público, mas fica fora do README para que a página inicial do repositório permaneça objetiva. Atualize a data e a situação de cada item ao mudar o produto.

## Objetivo ativo: primeira oferta comercial responsável

O plano visual, os donos e o roteiro de teste estão em [`guias-cloudflare/08-plano-testes.html`](../guias-cloudflare/08-plano-testes.html). As datas são alvos de trabalho; nenhum deploy, aprovação escolar ou pagamento ocorre automaticamente.

| Marco | Dono | Evidência necessária | Situação em 01/10/2026 |
|---|---|---|---|
| Infraestrutura Pages + D1 | Jonathan + Codex | URL pública, deploy bem-sucedido, `/api/health` 200 em Production e Preview | Frontend publicado; API 503, esquema D1 a conferir |
| Fluxo de dados fictícios | Jonathan + Codex | Perfil, quiz, ranking, exclusão e sala com duas identidades de teste | Aguardando infraestrutura |
| Produto pedagógico | Professor/escola + Codex | Questões revisadas, direitos de uso esclarecidos e piloto supervisionado | Inventário visual pronto; aprovação pendente |
| Privacidade e papel docente | Responsável institucional | Regras para menores, retenção, moderação e concessão/revogação de acesso | Decisão institucional pendente |
| Oferta Premium | Responsável pelo projeto + Codex | Pagamento conferido, aprovação auditável, suporte e custos ensaiados | Ainda não pronto para venda |

No próximo retorno, continuar pelo primeiro marco não comprovado. Registrar falhas concretas e corrigir antes de avançar; não inferir sucesso a partir de testes locais.

## Caminho atual — 01/10/2026

- A URL pública `https://linux-flow.pages.dev/` abre o frontend, mas `/api/health` retornou HTTP 503 novamente em 03/10/2026. A captura mostra binding `DB` para `linux-flow-db`; ainda falta inventariar o esquema remoto e aplicar apenas as migrações ausentes. O guia `guias-cloudflare/11-validacao-publica.html` orienta o diagnóstico.
- Ranking compartilhado agora exige perfil sincronizado e rodada verificada; a migração 004 remove entradas anônimas legadas. A migração 003 guarda pedidos e eventos financeiros por pelo menos um ano após o último evento, independentemente da exclusão do perfil. Ambos passaram em SQLite local; Pix e exclusão com pedido agora falham se o arquivo financeiro estiver incompleto. A nuvem ainda precisa de migração e teste.

- A migração `sql/migrations/002-educator-access.sql` cria concessões docentes revogáveis. O criador comum ainda controla a sala, mas só um criador com concessão ativa lê logs nominativos ou resultados individuais do grupo. Testes locais cobrem concessão, isolamento e revogação; a escola ainda precisa definir e executar aprovação de pessoas reais. O roteiro está em `guias-cloudflare/10-acesso-docente.html`.

- O inventário `guias-cloudflare/09-revisao-conteudo.html` apresenta questões Free, níveis, fontes e os 19 objetivos relacionados para revisão do professor. O livro oficial do LPI consultado indica CC BY-NC-ND 4.0; referências curriculares não autorizam copiar/adaptar o livro em produto pago. Confirmar direitos dos materiais de aula e do logo antes da oferta.
- As respostas da comunidade omitem IDs internos dos perfis. A lotação de salas e grupos é validada no próprio `INSERT`, inclusive diante de entradas simultâneas; os corpos JSON são cortados durante a leitura ao superar o limite em bytes. Testes locais cobrem esses comportamentos. Proteção contra spam distribuído e moderação institucional continuam pendentes.
- A migração `sql/migrations/001-premium-approval.sql` torna a aprovação Premium uma única atualização com concessão automática no mesmo passo e referência única do extrato. O teste SQLite cobre reversão em falhas; aplicar uma vez em cada D1 após backup e validar no Preview antes de operar pagamento real.
- A migração 003 arquiva pedidos e eventos financeiros por pelo menos um ano após o último evento, mesmo com a exclusão do perfil de estudo. O prazo fiscal total, comprovantes, acesso e descarte ainda precisam de decisão profissional.
- O P0 ganhou `/api/health`, que verifica o binding D1, 20 tabelas, 14 gatilhos e pedidos sem arquivo financeiro sem divulgar o esquema ao visitante. O endpoint e seus cenários de falha foram testados localmente; Production retornou 503; após as migrações, repetir em Production e Preview.
- Em 01/10/2026, `wrangler.jsonc` foi reintroduzido pelo navegador e convertido de UTF-16 para UTF-8. Ainda não define saída Pages nem D1; o frontend está publicado e o binding aparece no painel; o esquema D1 e as APIs não passaram. O painel visual e a priorização estão em `guias-cloudflare/index.html` e `guias-cloudflare/07-prioridades.html`.
- Em 01/10/2026, a conversa salva sobre a Cloudflare mostrou deploys falhos: `wrangler deploy` tratou a raiz como assets de Worker; depois Pages encontrou `require("node:crypto")` no Pix; por fim, Root directory `dist` falhou antes do build. O diagnóstico está em `guias-cloudflare/06-diagnostico.html`.
- O Pix, o QR e o hash do código de acesso foram adaptados para APIs Web; manter `functions/` para que Pages publique o backend.
- A conta Cloudflare e o 2FA foram configurados segundo a conversa salva; o frontend Pages está publicado; falta validar a API e o D1.
- Dois commits feitos pelo navegador adicionaram `wrangler.jsonc` parcial e removeram `functions/package.json`. Na integração, o arquivo parcial foi removido para manter bindings no painel e o delimitador ESM das Functions foi restaurado; os commits originais permanecem no histórico.
- A revisão antes da conta Cloudflare e os comandos copiáveis estão em `guias-cloudflare/index.html`. A pasta é pública no GitHub, mas não é copiada para `dist/`.
- A CSP agora também é enviada por `_headers` para os ativos estáticos, inclusive `frame-ancestors`; verificar o cabeçalho no domínio Pages após publicar.
- Publicação atual: frontend na Cloudflare Pages; Pages Functions e D1 ainda precisam de validação funcional. O frontend e as rotas `/api/*` compartilham a origem.
- O GitHub pessoal de Jonathan contém o código na raiz. A conta Cloudflare deve pertencer ao projeto e receber membros individuais; nunca compartilhar senha ou 2FA.
- Nada foi cadastrado no Aiven. A alternativa Vercel/MySQL foi retirada dos arquivos ativos; seu histórico permanece nos commits anteriores.
- O contato público é `linuxflow2026@gmail.com`. Credenciais Pix, binding D1 e códigos de acesso não pertencem ao Git.
- A conta Cloudflare e o 2FA constam da conversa salva; a configuração Pages/D1 e a publicação real ainda não foram validadas. Consulte `docs/cloudflare-d1.md`.

## Entregue no código

- Quiz, trilhas, terminal simulado, ranking e perfis locais/sincronizados.
- Premium por Pix com conferência e ativação manuais.
- Salas com duelo ou partida coletiva, temporizador opcional, placar e eventos para o criador.
- Grupos de estudo, sugestões e relatórios de resultados verificados.
- Personagem com mascote, cor e faixa etária opcional. A faixa não aparece nos relatórios.
- Testes de regras e fluxos D1 com SQLite local; build estático por lista de arquivos.

## Próximas decisões de produto

| Prioridade | Decisão ou trabalho | Critério para concluir |
|---|---|---|
| Alta | Publicar em Cloudflare e testar no domínio real | Perfil, ranking, comunidade, sugestões e Premium funcionam com D1. |
| Alta | Revisão pedagógica pelo professor | Questões, fontes e dificuldade aprovadas por tema. |
| Alta | Papel docente verificado | Código restringe logs e relatórios a concessão ativa; escola define e executa aprovação, revogação e política para menores. |
| Alta | Uso com menores | A escola define base legal, responsáveis, retenção, moderação e política de acesso. |
| Média | Proteção contra abuso | Limites por origem, moderação de nomes/sugestões e revisão de logs. |
| Média | Operação Premium | Migração e teste local entregues; aplicar no D1 Preview/Production e confirmar o procedimento com pagamento real somente após conferência bancária. |
| Média | Retenção de dados | Definir e automatizar descarte de salas, eventos, grupos e sugestões conforme política institucional. |
| Média | Manutenibilidade da interface | Separar `js/app.js`, `js/data.js` e blocos finais repetidos de `css/style.css` em unidades menores. |
| Média | Relatórios pedagógicos | Métricas por objetivo, tendências e exportação sem expor dados a outros alunos. |
| Média | Tempo real | Avaliar infraestrutura própria para atualização instantânea; hoje a sala consulta a API periodicamente. |
| Média | Conteúdo e acessibilidade | Mais cenários, revisão de espanhol, teste com leitores de tela e celulares reais. |
| Baixa | Autenticação social e PWA | Só iniciar após política de conta, recuperação e cache definidas. |

## Critérios de manutenção

- `js/data.js` é conteúdo editorial; `js/core.js` contém regras puras; `js/app.js` controla a interface; `js/community.js` controla o espaço coletivo.
- `functions/api/` é a API ativa. `cloudflare/common.mjs` centraliza autenticação, acesso ao D1 e respostas HTTP. `server/` guarda validações compartilhadas e dados Premium.
- Aplique `sql/d1-schema.sql` antes de ativar as Functions. Toda alteração futura do esquema em produção deve ter uma migração numerada, sem depender de recriar tabelas.
- Comente regras, limites e efeitos não óbvios perto do código. Evite comentários que apenas repetem o nome da função ou a linha seguinte.
- Rode `npm test`, `npm run build` e confira o layout em tela pequena e grande antes de publicar.
