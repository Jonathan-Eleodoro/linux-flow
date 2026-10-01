# Notas de manutenção e evolução

Este arquivo concentra decisões, mudanças de plano e trabalho pendente. Ele é público, mas fica fora do README para que a página inicial do repositório permaneça objetiva. Atualize a data e a situação de cada item ao mudar o produto.

## Caminho atual — 30/09/2026

- Em 01/10/2026, a conversa salva sobre a Cloudflare mostrou deploys falhos: `wrangler deploy` tratou a raiz como assets de Worker; depois Pages encontrou `require("node:crypto")` no Pix; por fim, Root directory `dist` falhou antes do build. O diagnóstico está em `guias-cloudflare/06-diagnostico.html`.
- O Pix, o QR e o hash do código de acesso foram adaptados para APIs Web; manter `functions/` para que Pages publique o backend.
- A conta Cloudflare e o 2FA foram configurados segundo a conversa salva; o estado atual do painel e a publicação bem-sucedida ainda precisam ser verificados.
- Dois commits feitos pelo navegador adicionaram `wrangler.jsonc` parcial e removeram `functions/package.json`. Na integração, o arquivo parcial foi removido para manter bindings no painel e o delimitador ESM das Functions foi restaurado; os commits originais permanecem no histórico.
- A revisão antes da conta Cloudflare e os comandos copiáveis estão em `guias-cloudflare/index.html`. A pasta é pública no GitHub, mas não é copiada para `dist/`.
- A CSP agora também é enviada por `_headers` para os ativos estáticos, inclusive `frame-ancestors`; verificar o cabeçalho no domínio Pages após publicar.
- Publicação planejada: Cloudflare Pages + Pages Functions + D1. O frontend e as rotas `/api/*` compartilham a origem.
- O GitHub pessoal de Jonathan contém o código na raiz. A conta Cloudflare deve pertencer ao projeto e receber membros individuais; nunca compartilhar senha ou 2FA.
- Nada foi cadastrado no Aiven. A alternativa Vercel/MySQL foi retirada dos arquivos ativos; seu histórico permanece nos commits anteriores.
- O contato público é `linuxflow2026@gmail.com`. Credenciais Pix, binding D1 e códigos de acesso não pertencem ao Git.
- A Cloudflare ainda precisa ser criada/configurada e a publicação real ainda não foi validada. Consulte `docs/cloudflare-d1.md`.

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
| Alta | Papel docente verificado | A escola define quem concede e revoga acesso de mestre. |
| Alta | Uso com menores | A escola define base legal, responsáveis, retenção, moderação e política de acesso. |
| Média | Proteção contra abuso | Limites por origem, moderação de nomes/sugestões e revisão de logs. |
| Média | Operação Premium | Substituir as duas instruções SQL manuais por aprovação transacional auditável. |
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
