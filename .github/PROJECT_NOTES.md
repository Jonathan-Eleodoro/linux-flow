# Notas de manutenção e evolução

Este arquivo concentra decisões, mudanças de plano e trabalho pendente. Ele é público, mas fica fora do README para que a página inicial do repositório permaneça objetiva. Atualize a data e a situação de cada item ao mudar o produto.

## Caminho atual — 30/09/2026

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
